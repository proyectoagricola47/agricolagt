-- ============================================================
-- AgrícolaGT · Migración de la etapa 2
-- Módulos M-04 (plagas), M-05 (prácticas agrícolas) y M-07 (mapa)
--
-- Ejecutar una sola vez en Supabase: SQL Editor -> New query ->
-- pegar todo este archivo -> Run.
-- Se puede volver a ejecutar sin riesgo: todo es "if not exists".
-- ============================================================


-- ------------------------------------------------------------
-- 1. Coordenadas en los cultivos (M-07)
-- ------------------------------------------------------------
alter table public.crops add column if not exists lat double precision;
alter table public.crops add column if not exists lng double precision;


-- ------------------------------------------------------------
-- 2. Reportes de plagas (M-04)
-- ------------------------------------------------------------
create table if not exists public.pest_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  crop_id     uuid references public.crops(id) on delete set null,
  pest_type   text not null,
  severity    text not null check (severity in ('baja','media','alta')),
  detected_at date not null,
  status      text not null default 'activa'
              check (status in ('activa','controlada','erradicada')),
  location    text,
  lat         double precision,
  lng         double precision,
  photo_url   text,
  treatment   text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pest_reports_user_idx on public.pest_reports (user_id);
create index if not exists pest_reports_crop_idx on public.pest_reports (crop_id);
create index if not exists pest_reports_fecha_idx on public.pest_reports (detected_at desc);

alter table public.pest_reports enable row level security;

drop policy if exists "plagas_lectura_propia" on public.pest_reports;
create policy "plagas_lectura_propia"
  on public.pest_reports for select
  using (auth.uid() = user_id);

drop policy if exists "plagas_insercion_propia" on public.pest_reports;
create policy "plagas_insercion_propia"
  on public.pest_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "plagas_actualizacion_propia" on public.pest_reports;
create policy "plagas_actualizacion_propia"
  on public.pest_reports for update
  using (auth.uid() = user_id);

drop policy if exists "plagas_borrado_propio" on public.pest_reports;
create policy "plagas_borrado_propio"
  on public.pest_reports for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 3. Prácticas agrícolas por cultivo (M-05)
--    El riego queda registrado como un tipo más de actividad.
-- ------------------------------------------------------------
create table if not exists public.crop_activities (
  id            uuid primary key default gen_random_uuid(),
  crop_id       uuid not null references public.crops(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  activity_type text not null check (activity_type in
                  ('siembra','fertilizacion','riego','control_plagas','poda','cosecha','otro')),
  performed_at  date not null,
  input_name    text,
  quantity      numeric,
  unit          text,
  cost          numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists crop_activities_crop_idx on public.crop_activities (crop_id);
create index if not exists crop_activities_user_idx on public.crop_activities (user_id);
create index if not exists crop_activities_fecha_idx on public.crop_activities (performed_at desc);

alter table public.crop_activities enable row level security;

drop policy if exists "labores_lectura_propia" on public.crop_activities;
create policy "labores_lectura_propia"
  on public.crop_activities for select
  using (auth.uid() = user_id);

drop policy if exists "labores_insercion_propia" on public.crop_activities;
create policy "labores_insercion_propia"
  on public.crop_activities for insert
  with check (auth.uid() = user_id);

drop policy if exists "labores_actualizacion_propia" on public.crop_activities;
create policy "labores_actualizacion_propia"
  on public.crop_activities for update
  using (auth.uid() = user_id);

drop policy if exists "labores_borrado_propio" on public.crop_activities;
create policy "labores_borrado_propio"
  on public.crop_activities for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 4. Depósito de fotografías de plagas
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pest-photos', 'pest-photos', true)
on conflict (id) do nothing;

drop policy if exists "fotos_plagas_lectura_publica" on storage.objects;
create policy "fotos_plagas_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'pest-photos');

drop policy if exists "fotos_plagas_subida_propia" on storage.objects;
create policy "fotos_plagas_subida_propia"
  on storage.objects for insert
  with check (
    bucket_id = 'pest-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "fotos_plagas_borrado_propio" on storage.objects;
create policy "fotos_plagas_borrado_propio"
  on storage.objects for delete
  using (
    bucket_id = 'pest-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
