-- ============================================================
-- AgrícolaGT · Migración de la etapa 3
-- Módulos M-06 (cosechas), M-08 (incidencias), M-09 (consejos)
-- y M-10 (reportes, que solo lee lo anterior).
--
-- Ejecutar una sola vez en Supabase: SQL Editor -> New query ->
-- pegar todo este archivo -> Run.
-- Se puede volver a ejecutar sin riesgo.
-- ============================================================


-- ------------------------------------------------------------
-- 0. Quién es personal técnico
--
-- Se resuelve en una función con privilegios del definidor para
-- que las políticas no tengan que consultar la tabla de usuarios
-- con las restricciones del propio usuario, lo que produciría
-- una recursión.
-- ------------------------------------------------------------
create or replace function public.es_personal_tecnico()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;


-- ------------------------------------------------------------
-- 1. Cosechas (M-06)
-- ------------------------------------------------------------
create table if not exists public.harvests (
  id           uuid primary key default gen_random_uuid(),
  crop_id      uuid not null references public.crops(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  season       text not null,
  harvest_date date not null,
  quantity     numeric not null,
  unit         text not null,
  quality      text check (quality in ('primera','segunda','tercera')),
  income       numeric,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists harvests_crop_idx on public.harvests (crop_id);
create index if not exists harvests_user_idx on public.harvests (user_id);
create index if not exists harvests_temporada_idx on public.harvests (season);

alter table public.harvests enable row level security;

drop policy if exists "cosechas_lectura_propia" on public.harvests;
create policy "cosechas_lectura_propia"
  on public.harvests for select using (auth.uid() = user_id);

drop policy if exists "cosechas_insercion_propia" on public.harvests;
create policy "cosechas_insercion_propia"
  on public.harvests for insert with check (auth.uid() = user_id);

drop policy if exists "cosechas_actualizacion_propia" on public.harvests;
create policy "cosechas_actualizacion_propia"
  on public.harvests for update using (auth.uid() = user_id);

drop policy if exists "cosechas_borrado_propio" on public.harvests;
create policy "cosechas_borrado_propio"
  on public.harvests for delete using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 2. Incidencias y asistencia técnica (M-08)
-- ------------------------------------------------------------
create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  crop_id     uuid references public.crops(id) on delete set null,
  type        text not null,
  subject     text not null,
  description text not null,
  status      text not null default 'abierta'
              check (status in ('abierta','en_proceso','cerrada')),
  assigned_to uuid references public.users(id),
  response    text,
  responded_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists incidents_user_idx on public.incidents (user_id);
create index if not exists incidents_estado_idx on public.incidents (status);
create index if not exists incidents_fecha_idx on public.incidents (created_at desc);

alter table public.incidents enable row level security;

-- El agricultor ve las suyas; el personal técnico ve todas.
drop policy if exists "incidencias_lectura" on public.incidents;
create policy "incidencias_lectura"
  on public.incidents for select
  using (auth.uid() = user_id or public.es_personal_tecnico());

drop policy if exists "incidencias_insercion_propia" on public.incidents;
create policy "incidencias_insercion_propia"
  on public.incidents for insert
  with check (auth.uid() = user_id);

-- El agricultor corrige la suya mientras siga abierta;
-- el personal técnico la atiende en cualquier momento.
drop policy if exists "incidencias_actualizacion" on public.incidents;
create policy "incidencias_actualizacion"
  on public.incidents for update
  using (auth.uid() = user_id or public.es_personal_tecnico());

drop policy if exists "incidencias_borrado_propio" on public.incidents;
create policy "incidencias_borrado_propio"
  on public.incidents for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 3. Consejos agrícolas (M-09)
--
-- Catálogo de lectura pública. La condición corresponde a las
-- alertas que ya calcula el módulo de clima; crop_type en nulo
-- significa que el consejo aplica a cualquier cultivo.
-- ------------------------------------------------------------
create table if not exists public.tips (
  id         uuid primary key default gen_random_uuid(),
  crop_type  text,
  condition  text,
  title      text not null,
  body       text not null,
  source     text,
  created_at timestamptz not null default now()
);

create index if not exists tips_condicion_idx on public.tips (condition);
create index if not exists tips_cultivo_idx on public.tips (crop_type);

alter table public.tips enable row level security;

drop policy if exists "consejos_lectura_publica" on public.tips;
create policy "consejos_lectura_publica"
  on public.tips for select using (true);

drop policy if exists "consejos_escritura_personal" on public.tips;
create policy "consejos_escritura_personal"
  on public.tips for all
  using (public.es_personal_tecnico())
  with check (public.es_personal_tecnico());


-- ------------------------------------------------------------
-- 4. Consejos precargados
-- ------------------------------------------------------------
delete from public.tips where source = 'AgrícolaGT';

insert into public.tips (crop_type, condition, title, body, source) values
-- Lluvias intensas
(null, 'lluvia_intensa', 'Revisa los drenajes antes de la lluvia',
 'Limpia las zanjas y los canales de salida para que el agua no se estanque. El encharcamiento por más de dos días pudre la raíz y favorece los hongos del suelo.', 'AgrícolaGT'),
('Grano', 'lluvia_intensa', 'Protege el grano próximo a cosecha',
 'Si el maíz o el frijol ya está seco en la planta, adelanta la cosecha. El grano mojado en campo se mancha y pierde precio.', 'AgrícolaGT'),
('Hortaliza', 'lluvia_intensa', 'Aporca y tutora las hortalizas',
 'Levanta un poco de tierra al pie de la planta y asegura los tutores. La lluvia fuerte con viento tumba el tomate y el chile cargados.', 'AgrícolaGT'),
(null, 'lluvia_intensa', 'Espera para aplicar productos',
 'No fumigues ni fertilices antes de la lluvia: el producto se lava y se pierde el gasto. Deja pasar al menos seis horas sin lluvia después de aplicar.', 'AgrícolaGT'),

-- Sequía
(null, 'sequia', 'Riega temprano o al caer la tarde',
 'Riega antes de las nueve de la mañana o después de las cuatro de la tarde. Al mediodía buena parte del agua se evapora antes de llegar a la raíz.', 'AgrícolaGT'),
(null, 'sequia', 'Cubre el suelo con rastrojo',
 'Una capa de rastrojo, hoja seca o zacate al pie de la planta conserva la humedad y baja la temperatura del suelo. Es la medida más barata contra la sequía.', 'AgrícolaGT'),
('Grano', 'sequia', 'Cuida las etapas críticas del maíz',
 'La floración y el llenado de grano son los momentos en que el maíz más resiente la falta de agua. Si el riego es limitado, concéntralo en esas semanas.', 'AgrícolaGT'),

-- Ola de calor
('Hortaliza', 'ola_calor', 'Da sombra a las hortalizas',
 'Con más de 35 grados el tomate y el chile botan la flor. Una malla de sombra o un tapesco improvisado reduce la pérdida de fruto.', 'AgrícolaGT'),
(null, 'ola_calor', 'Aumenta la frecuencia del riego',
 'Riega con menos volumen pero más seguido. Con calor fuerte el suelo se seca desde arriba y la raíz nueva queda desprotegida.', 'AgrícolaGT'),

-- Humedad baja
(null, 'humedad_baja', 'Vigila la araña roja',
 'El ambiente seco favorece al ácaro rojo. Revisa el envés de las hojas: si ves puntos amarillos o telaraña fina, actúa de inmediato.', 'AgrícolaGT'),

-- Índice ultravioleta alto
(null, 'uv_alto', 'Protégete tú también',
 'Con índice ultravioleta alto, trabaja de sombrero y camisa de manga larga, y evita la jornada entre las once y las dos.', 'AgrícolaGT'),

-- Viento
(null, 'viento', 'Asegura tutores y coberturas',
 'Revisa amarres, tutores y cualquier plástico o malla. El viento fuerte levanta las coberturas y quiebra las plantas altas.', 'AgrícolaGT'),

-- Generales, sin depender del clima
(null, 'general', 'Anota cada labor que realices',
 'Registrar riegos, fertilizaciones y aplicaciones te permite comparar temporadas y saber qué te funcionó. Sin registro, la experiencia se pierde de un año a otro.', 'AgrícolaGT'),
(null, 'general', 'Revisa el cultivo dos veces por semana',
 'La mayoría de plagas se controla barato cuando se detecta temprano. Camina el terreno y revisa hojas, tallo y raíz de varias plantas al azar.', 'AgrícolaGT'),
('Leguminosa', 'general', 'Rota el frijol con otro cultivo',
 'Sembrar frijol sobre frijol año con año acumula enfermedades del suelo. Alternarlo con maíz o una hortaliza corta el ciclo de esas enfermedades.', 'AgrícolaGT'),
('Grano', 'general', 'Guarda el grano bien seco',
 'Almacena el grano por debajo del catorce por ciento de humedad y en recipiente cerrado. Así evitas el gorgojo y el hongo durante el almacenamiento.', 'AgrícolaGT');


-- ------------------------------------------------------------
-- 5. El personal técnico puede notificar al agricultor
--
-- La política existente solo permite que cada quien se cree sus
-- propias notificaciones. Se agrega una segunda, que convive con
-- la anterior, para que al responder una incidencia se le pueda
-- avisar a quien la reportó.
-- ------------------------------------------------------------
drop policy if exists "notificaciones_insercion_personal" on public.notifications;
create policy "notificaciones_insercion_personal"
  on public.notifications for insert
  with check (public.es_personal_tecnico());
