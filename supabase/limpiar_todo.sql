-- ============================================================
--  AgrícolaGT · Depuración completa de la base de datos
--
--  Vacía TODAS las tablas del esquema público EXCEPTO dos:
--
--    · users              → las cuentas. Si se vacía, el borrado
--                           en cascada se lleva todo y la aplicación
--                           no reconstruye el perfil cuando se entra
--                           con Google.
--    · push_subscriptions → los dispositivos registrados para las
--                           notificaciones. Si se vacía, hay que
--                           volver a dar el permiso en el teléfono.
--
--  Lleva una comprobación: si por algún motivo la tabla users
--  perdiera filas, el guion se detiene y NO borra nada.
--
--  Esto afecta a TODOS los usuarios, no solo al tuyo.
--  Después de correrlo hay que ejecutar datos_ejemplo.sql.
-- ============================================================


-- ------------------------------------------------------------
--  PASO 1 · Ver qué se va a borrar, antes de borrarlo.
--  Ejecuta solo esta consulta y revisa la lista y las cantidades.
-- ------------------------------------------------------------
select
  t.tablename as tabla,
  (xpath('/row/c/text()',
         query_to_xml(format('select count(*) as c from public.%I', t.tablename),
                      false, true, '')))[1]::text::bigint as filas,
  case when t.tablename in ('users', 'push_subscriptions')
       then 'SE CONSERVA'
       else 'se vacía' end as accion
from pg_tables t
where t.schemaname = 'public'
order by accion, t.tablename;


-- ------------------------------------------------------------
--  PASO 2 · La depuración.
--  Ejecuta este bloque cuando ya revisaste la lista de arriba.
-- ------------------------------------------------------------
do $$
declare
  t         record;
  antes     bigint;
  despues   bigint;
  cuantas   int  := 0;
  lista     text := '';
begin
  select count(*) into antes from public.users;

  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('users', 'push_subscriptions')
    order by tablename
  loop
    execute format('truncate table public.%I restart identity cascade', t.tablename);
    lista   := lista || t.tablename || ', ';
    cuantas := cuantas + 1;
  end loop;

  -- Comprobación de seguridad. Si users perdió filas, se deshace todo.
  select count(*) into despues from public.users;
  if antes is distinct from despues then
    raise exception
      'ABORTADO. La tabla users pasó de % a % filas, así que no se borró nada. Revisa las llaves foráneas.',
      antes, despues;
  end if;

  raise notice 'Se vaciaron % tablas: %', cuantas, lista;
  raise notice 'La tabla users conserva sus % cuentas.', despues;
end $$;


-- ------------------------------------------------------------
--  PASO 3 · Comprobar que las cuentas siguen completas.
-- ------------------------------------------------------------
select email, name, role from public.users order by email;
