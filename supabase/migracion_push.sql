-- ============================================================
-- AgrícolaGT · Notificaciones push
--
-- Guarda la credencial que el navegador genera para cada dispositivo
-- suscrito. Con ella, el proceso programado puede enviar avisos aunque
-- la aplicación esté cerrada.
--
-- Ejecutar una sola vez: SQL Editor -> New query -> pegar -> Run.
-- ============================================================

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  modo_demo   boolean not null default false,
  dispositivo text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
create index if not exists push_subscriptions_demo_idx on public.push_subscriptions (modo_demo);

alter table public.push_subscriptions enable row level security;

drop policy if exists "suscripciones_lectura_propia" on public.push_subscriptions;
create policy "suscripciones_lectura_propia"
  on public.push_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "suscripciones_insercion_propia" on public.push_subscriptions;
create policy "suscripciones_insercion_propia"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);

drop policy if exists "suscripciones_actualizacion_propia" on public.push_subscriptions;
create policy "suscripciones_actualizacion_propia"
  on public.push_subscriptions for update using (auth.uid() = user_id);

drop policy if exists "suscripciones_borrado_propio" on public.push_subscriptions;
create policy "suscripciones_borrado_propio"
  on public.push_subscriptions for delete using (auth.uid() = user_id);
