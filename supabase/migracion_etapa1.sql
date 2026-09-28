-- =====================================================================
-- AgrícolaGT · Migración de la Etapa 1
-- Módulos M-01 (contacto en el perfil) y M-03 (notificaciones)
-- Ejecutar en Supabase: panel del proyecto > SQL Editor > New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- M-01 · Campo de contacto del agricultor
-- ---------------------------------------------------------------------
alter table public.users
  add column if not exists phone text;

-- ---------------------------------------------------------------------
-- M-03 · Historial de notificaciones
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text,
  type        text,
  severity    text check (severity in ('low', 'medium', 'high')),
  dedup_key   text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Por si la tabla ya existía sin esta columna
alter table public.notifications
  add column if not exists dedup_key text;

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

-- Evita duplicar la misma alerta para el mismo usuario en el mismo día.
-- La clave la calcula la aplicación (título + fecha), porque un índice de
-- PostgreSQL no admite expresiones que dependan de la zona horaria.
create unique index if not exists notifications_dedup_idx
  on public.notifications (user_id, dedup_key);

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila (T-01)
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "notificaciones_lectura_propia" on public.notifications;
create policy "notificaciones_lectura_propia"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notificaciones_insercion_propia" on public.notifications;
create policy "notificaciones_insercion_propia"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "notificaciones_actualizacion_propia" on public.notifications;
create policy "notificaciones_actualizacion_propia"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "notificaciones_borrado_propio" on public.notifications;
create policy "notificaciones_borrado_propio"
  on public.notifications for delete
  using (auth.uid() = user_id);
