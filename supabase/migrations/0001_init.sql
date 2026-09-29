-- Rúbricas ESISCOM · esquema inicial
-- Ejecutar en el SQL Editor de Supabase (o con `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabla privada de configuración (clave de administrador).
-- Sin políticas RLS => no es accesible por la API pública.
-- ---------------------------------------------------------------------------
create table if not exists public.config (
  clave text primary key,
  valor text not null
);

alter table public.config enable row level security;

-- ---------------------------------------------------------------------------
-- Equipos
-- ---------------------------------------------------------------------------
create table if not exists public.equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  integrantes text[] not null default '{}',
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Evaluadores (perfil ligado al usuario anónimo de Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.evaluadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'profesor',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Evaluaciones
-- ---------------------------------------------------------------------------
create table if not exists public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos (id) on delete cascade,
  evaluador_id uuid not null references public.evaluadores (id) on delete cascade,
  rubrica_id text not null,
  respuestas jsonb not null default '{}'::jsonb,
  comentarios jsonb not null default '{}'::jsonb,
  cierre jsonb not null default '{}'::jsonb,
  total int,
  enviado boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (equipo_id, evaluador_id, rubrica_id)
);

create index if not exists evaluaciones_rubrica_idx
  on public.evaluaciones (rubrica_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.equipos enable row level security;

drop policy if exists equipos_lectura on public.equipos;
create policy equipos_lectura on public.equipos
  for select to authenticated using (true);

alter table public.evaluadores enable row level security;

drop policy if exists evaluadores_select_propio on public.evaluadores;
create policy evaluadores_select_propio on public.evaluadores
  for select to authenticated using (user_id = auth.uid());

drop policy if exists evaluadores_insert_propio on public.evaluadores;
create policy evaluadores_insert_propio on public.evaluadores
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists evaluadores_update_propio on public.evaluadores;
create policy evaluadores_update_propio on public.evaluadores
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.evaluaciones enable row level security;

drop policy if exists evaluaciones_propias on public.evaluaciones;
create policy evaluaciones_propias on public.evaluaciones
  for all to authenticated
  using (
    evaluador_id in (
      select id from public.evaluadores where user_id = auth.uid()
    )
  )
  with check (
    evaluador_id in (
      select id from public.evaluadores where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Funciones de administración (security definer, validadas por clave)
-- ---------------------------------------------------------------------------
-- pgcrypto en Supabase vive en el esquema `extensions`; encapsulamos el hash
-- para que no dependa del search_path de quien la llame.
create or replace function public.hash_clave(p_clave text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(p_clave, 'sha256'), 'hex');
$$;

create or replace function public.admin_login(p_clave text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.config
    where clave = 'admin'
      and valor = public.hash_clave(p_clave)
  );
$$;

create or replace function public.admin_guardar_equipo(
  p_clave text,
  p_id uuid,
  p_nombre text,
  p_integrantes text[],
  p_orden int
)
returns public.equipos
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado public.equipos;
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;

  if p_id is null then
    insert into public.equipos (nombre, integrantes, orden)
    values (p_nombre, coalesce(p_integrantes, '{}'), p_orden)
    returning * into resultado;
  else
    update public.equipos
    set nombre = p_nombre,
        integrantes = coalesce(p_integrantes, '{}'),
        orden = p_orden
    where id = p_id
    returning * into resultado;

    if resultado is null then
      insert into public.equipos (id, nombre, integrantes, orden)
      values (p_id, p_nombre, coalesce(p_integrantes, '{}'), p_orden)
      returning * into resultado;
    end if;
  end if;

  return resultado;
end;
$$;

create or replace function public.admin_eliminar_equipo(p_clave text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  delete from public.equipos where id = p_id;
end;
$$;

create or replace function public.admin_listar_evaluaciones(
  p_clave text,
  p_rubrica text
)
returns setof public.evaluaciones
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  return query
    select *
    from public.evaluaciones
    where rubrica_id = p_rubrica
    order by updated_at desc;
end;
$$;

create or replace function public.admin_listar_evaluadores(p_clave text)
returns setof public.evaluadores
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  return query
    select *
    from public.evaluadores
    order by nombre;
end;
$$;
