-- ============================================================
--  AgrícolaGT · Radiografía completa de la base de datos
--
--  Devuelve en una sola consulta: tablas con su cantidad de filas,
--  columnas con tipo y valor por omisión, llaves primarias y
--  foráneas, restricciones de verificación, índices, estado y
--  políticas de seguridad por fila, funciones, disparadores y
--  depósitos de archivos.
--
--  Cómo usarla:
--    1. Pegar en Supabase → SQL Editor → Run.
--    2. En los resultados, pulsar "Download CSV".
--    3. Enviar ese archivo.
--
--  No modifica nada: solo lee los catálogos del sistema.
-- ============================================================

-- 0 · Tablas con su cantidad de filas
select 0 as orden, 'TABLA' as seccion, t.tablename as objeto,
       'filas: ' || (xpath('/row/c/text()',
          query_to_xml(format('select count(*) as c from public.%I', t.tablename),
                       false, true, '')))[1]::text as detalle
from pg_tables t
where t.schemaname = 'public'

union all

-- 1 · Columnas
select 1, 'COLUMNA', c.relname,
       lpad(a.attnum::text, 2, '0') || ' · ' || a.attname
       || ' ' || format_type(a.atttypid, a.atttypmod)
       || case when a.attnotnull then ' NOT NULL' else '' end
       || coalesce(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), '')
from pg_attribute a
join pg_class     c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where n.nspname = 'public' and c.relkind = 'r'
  and a.attnum > 0 and not a.attisdropped

union all

-- 2 · Llaves y restricciones
select 2, 'RESTRICCION', rel.relname,
       con.conname || ' · ' || pg_get_constraintdef(con.oid)
from pg_constraint con
join pg_class     rel on rel.oid = con.conrelid
join pg_namespace ns  on ns.oid = rel.relnamespace
where ns.nspname = 'public'

union all

-- 3 · Índices
select 3, 'INDICE', i.tablename, i.indexname || ' · ' || i.indexdef
from pg_indexes i
where i.schemaname = 'public'

union all

-- 4 · Seguridad por fila: si está activada
select 4, 'RLS_ESTADO', c.relname,
       case when c.relrowsecurity then 'habilitada' else 'DESHABILITADA' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

-- 5 · Políticas de seguridad por fila
select 5, 'RLS_POLITICA', p.tablename,
       p.policyname || ' · ' || p.cmd
       || ' · roles: ' || array_to_string(p.roles, ',')
       || ' · USING: '  || coalesce(p.qual, '—')
       || ' · CHECK: '  || coalesce(p.with_check, '—')
from pg_policies p
where p.schemaname = 'public'

union all

-- 6 · Funciones
select 6, 'FUNCION', p.proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'

union all

-- 7 · Disparadores
select 7, 'TRIGGER', c.relname, pg_get_triggerdef(t.oid)
from pg_trigger t
join pg_class     c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal

union all

-- 8 · Depósitos de archivos
select 8, 'BUCKET', b.id,
       case when b.public then 'público' else 'privado' end
from storage.buckets b

order by 1, 3, 4;
