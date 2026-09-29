-- Datos iniciales.
-- 1) Define la clave de administrador (debe coincidir con VITE_ADMIN_KEY).
--    Cambia 'CAMBIA_ESTA_CLAVE' por tu clave real antes de ejecutar.
insert into public.config (clave, valor)
values ('admin', public.hash_clave('CAMBIA_ESTA_CLAVE'))
on conflict (clave) do update set valor = excluded.valor;

-- 2) Equipos de ejemplo (edítalos o bórralos desde el panel de administración).
insert into public.equipos (nombre, integrantes, orden) values
  ('Equipo 1', '{}', 1),
  ('Equipo 2', '{}', 2),
  ('Equipo 3', '{}', 3)
on conflict do nothing;
