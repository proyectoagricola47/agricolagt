-- ============================================================
--  AgrícolaGT · Mapa y reportes comunitarios
--
--  Hasta ahora cada agricultor solo podía leer sus propios
--  cultivos, plagas, labores y cosechas. Eso deja el mapa de
--  distribución sin su razón de ser: un foco de plaga solo
--  sirve como alerta temprana si los vecinos pueden verlo.
--
--  Esta migración agrega políticas de LECTURA para cualquier
--  usuario autenticado. Las políticas de escritura NO se tocan:
--  cada quien sigue pudiendo crear, modificar y borrar
--  únicamente lo suyo.
--
--  Ejecutar en Supabase → SQL Editor → Run.
-- ============================================================

-- Cultivos
drop policy if exists "cultivos_lectura_comunidad" on public.crops;
create policy "cultivos_lectura_comunidad"
  on public.crops for select
  using (auth.uid() is not null);

-- Reportes de plaga
drop policy if exists "plagas_lectura_comunidad" on public.pest_reports;
create policy "plagas_lectura_comunidad"
  on public.pest_reports for select
  using (auth.uid() is not null);

-- Labores agrícolas
drop policy if exists "labores_lectura_comunidad" on public.crop_activities;
create policy "labores_lectura_comunidad"
  on public.crop_activities for select
  using (auth.uid() is not null);

-- Cosechas
drop policy if exists "cosechas_lectura_comunidad" on public.harvests;
create policy "cosechas_lectura_comunidad"
  on public.harvests for select
  using (auth.uid() is not null);


-- ------------------------------------------------------------
--  Comprobación: deben aparecer cuatro políticas nuevas de
--  lectura, conviviendo con las de lectura propia anteriores.
-- ------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('crops','pest_reports','crop_activities','harvests')
  and cmd = 'SELECT'
order by tablename, policyname;
