-- Rúbricas ESISCOM · borrado de evaluaciones y borrado total
-- Ejecutar en el SQL Editor de Supabase (o con `supabase db push`).

-- ---------------------------------------------------------------------------
-- Borrar una evaluación puntual.
-- ---------------------------------------------------------------------------
create or replace function public.admin_eliminar_evaluacion(
  p_clave text,
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  delete from public.evaluaciones where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Borrar todas las evaluaciones (conserva equipos y evaluadores).
-- ---------------------------------------------------------------------------
create or replace function public.admin_borrar_evaluaciones(p_clave text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  delete from public.evaluaciones;
end;
$$;

-- ---------------------------------------------------------------------------
-- Borrar todo: evaluaciones, evaluadores (jueces) y equipos.
-- No toca public.config (clave de administrador).
-- ---------------------------------------------------------------------------
create or replace function public.admin_borrar_todo(p_clave text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_login(p_clave) then
    raise exception 'Clave de administrador inválida';
  end if;
  delete from public.evaluaciones;
  delete from public.evaluadores;
  delete from public.equipos;
end;
$$;
