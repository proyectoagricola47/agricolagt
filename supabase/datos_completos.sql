-- ============================================================
--  AgrícolaGT · Carga completa de datos de ejemplo
--
--  Llena todas las tablas que la aplicación realmente usa, con
--  las coordenadas dentro del municipio de Atescatempa, Jutiapa.
--
--  Reparte el contenido entre varios agricultores para que el
--  mercado, las publicaciones y los artículos se vean con vida,
--  y carga el grueso en la cuenta principal, que es la que vas
--  a usar para recorrer la aplicación.
--
--  NO crea ni modifica nada en los perfiles excluidos abajo.
--
--  Se puede volver a ejecutar cuantas veces se quiera.
--  Ejecutar en Supabase → SQL Editor → Run.
-- ============================================================

do $$
declare
  -- ======================================================
  --  CONFIGURACIÓN
  -- ======================================================
  correo_principal text   := 'lraymundop1@miumg.edu.gt';

  excluidos text[] := array[
    'sheylaesquivel@gmail.com',
    'anyilutin2020@gmail.com',
    'eaguilaro@miumg.edu.gt'
  ];

  -- Centro de Atescatempa. Todas las coordenadas se calculan
  -- como desplazamientos pequeños alrededor de este punto.
  lat0 double precision := 14.2333;
  lng0 double precision := -89.7333;

  -- ======================================================
  v_yo      uuid;
  v_editor  uuid;
  v_otros   uuid[];
  v_u       uuid;
  v_c1      uuid;
  v_c2      uuid;
  v_art     uuid;
  i         int;
  n_otros   int;

  c_maiz uuid; c_frijol uuid; c_tomate uuid; c_chile  uuid;
  c_cafe uuid; c_sandia uuid; c_limon  uuid; c_papa   uuid; c_sorgo uuid;

  -- Catálogos para variar el contenido de los demás agricultores
  nom  text[] := array['Lote La Ceiba','Parcela San José','El Guayabo','Tierra Blanca',
                       'Lote del Pozo','La Joya','El Zapote','Parcela Nueva'];
  tip  text[] := array['Grano','Leguminosa','Hortaliza','Fruta','Forraje','Tubérculo','Grano','Hortaliza'];
  esp  text[] := array['Maíz','Frijol','Tomate','Sandía','Sorgo forrajero','Papa','Maíz','Pepino'];
  pla  text[] := array['Gusano cogollero','Mosca blanca','Trips','Pulgón','Langosta',
                       'Nematodos','Barrenador del tallo','Antracnosis'];
  sev  text[] := array['alta','media','baja','media','alta','baja','media','alta'];
  est  text[] := array['activa','controlada','erradicada','activa','controlada','activa','erradicada','activa'];
  dlat double precision[] := array[ 0.0121,-0.0093, 0.0045,-0.0138, 0.0169,-0.0052, 0.0088,-0.0175];
  dlng double precision[] := array[-0.0104, 0.0142,-0.0188, 0.0061, 0.0115,-0.0147, 0.0173,-0.0069];
  ref  text[] := array['Aldea El Manguito','Sector sur, cerca del río','Camino a Jutiapa',
                       'Orilla de la laguna','Parte alta del cerro','Sector poniente',
                       'Entrada de la aldea','Terreno plano del oriente'];

begin
  -- ============ USUARIOS ============
  select id into v_yo from public.users where email = correo_principal limit 1;
  if v_yo is null then
    raise exception 'No existe ningún usuario con el correo %. Corrige la variable correo_principal.', correo_principal;
  end if;
  if correo_principal = any (excluidos) then
    raise exception 'El correo principal % está en la lista de excluidos. Corrige una de las dos.', correo_principal;
  end if;

  -- Un autor con permiso para artículos, que no esté excluido.
  select id into v_editor
  from public.users
  where role in ('admin','editor') and not (email = any (excluidos))
  order by (id = v_yo) desc, created_at
  limit 1;
  if v_editor is null then v_editor := v_yo; end if;

  -- Los demás agricultores, sin los excluidos y sin la cuenta principal.
  select coalesce(array_agg(id order by created_at), '{}')
  into v_otros
  from public.users
  where not (email = any (excluidos)) and id <> v_yo;

  n_otros := least(coalesce(array_length(v_otros, 1), 0), 8);

  -- ============ LIMPIEZA (respeta a los excluidos) ============
  delete from public.article_comments where author_id not in (select id from public.users where email = any (excluidos));
  delete from public.comments         where author_id not in (select id from public.users where email = any (excluidos));
  delete from public.articles         where author_id not in (select id from public.users where email = any (excluidos));
  delete from public.posts            where author_id not in (select id from public.users where email = any (excluidos));
  delete from public.notifications    where user_id   not in (select id from public.users where email = any (excluidos));
  delete from public.incidents        where user_id   not in (select id from public.users where email = any (excluidos));
  delete from public.harvests         where user_id   not in (select id from public.users where email = any (excluidos));
  delete from public.crop_activities  where user_id   not in (select id from public.users where email = any (excluidos));
  delete from public.pest_reports     where user_id   not in (select id from public.users where email = any (excluidos));
  delete from public.crops            where user_id   not in (select id from public.users where email = any (excluidos));

  -- ==========================================================
  --  CUENTA PRINCIPAL · el grueso del contenido
  -- ==========================================================

  -- ---------- cultivos ----------
  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Lote Norte', 'Grano', 'Maíz', 2.5, 'mz', 'En crecimiento',
          '2026-05-18', '2026-09-30', 'Aldea El Manguito', lat0+0.0077, lng0+0.0048,
          'Maíz criollo amarillo, sembrado a doble hilera.')
  returning id into c_maiz;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Lote El Río', 'Leguminosa', 'Frijol', 1.0, 'mz', 'En crecimiento',
          '2026-08-20', '2026-11-25', 'Orilla del río, sector sur', lat0-0.0065, lng0-0.0077,
          'Frijol de postrera. Suelo con buena humedad.')
  returning id into c_frijol;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Invernadero 1', 'Hortaliza', 'Tomate', 800, 'm2', 'En crecimiento',
          '2026-07-10', '2026-10-15', 'Casa de malla, patio trasero', lat0+0.0019, lng0+0.0032,
          'Tomate de crecimiento indeterminado, con tutoreo.')
  returning id into c_tomate;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Parcela Chile', 'Hortaliza', 'Chile pimiento', 0.5, 'mz', 'Sembrado',
          '2026-09-05', '2026-12-20', 'Camino a Jutiapa, kilómetro 3', lat0-0.0138, lng0+0.0105,
          'Primera experiencia con chile pimiento.')
  returning id into c_chile;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Cafetal Viejo', 'Fruta', 'Café', 3.0, 'mz', 'Pausado',
          '2024-06-01', '2026-01-30', 'Ladera del cerro', lat0+0.0147, lng0-0.0187,
          'Cafetal heredado. Pendiente de renovar la plantación.')
  returning id into c_cafe;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Lote Sandía', 'Fruta', 'Sandía', 1.5, 'mz', 'Cosechado',
          '2026-01-15', '2026-04-20', 'Terreno plano, sector oriente', lat0-0.0023, lng0+0.0183,
          'Se vendió a intermediario de Jutiapa.')
  returning id into c_sandia;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Huerto de Limón', 'Cítrico', 'Limón persa', 0.75, 'mz', 'En crecimiento',
          '2023-08-10', '2026-11-30', 'Atrás de la casa', lat0+0.0032, lng0-0.0022,
          'Cuarenta árboles en producción.')
  returning id into c_limon;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Tablón de Papa', 'Tubérculo', 'Papa', 0.25, 'mz', 'En crecimiento',
          '2026-08-01', '2026-11-10', 'Parte alta del terreno', lat0+0.0112, lng0-0.0137,
          'Prueba en pequeño para ver si se adapta.')
  returning id into c_papa;

  insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                            sowing_date, expected_harvest_date, location, lat, lng, notes)
  values (v_yo, 'Potrero', 'Forraje', 'Sorgo forrajero', 2.0, 'mz', 'En crecimiento',
          '2026-06-12', '2026-10-05', 'Sector poniente', lat0-0.0043, lng0-0.0167,
          'Para alimentar el ganado en la época seca.')
  returning id into c_sorgo;

  -- ---------- plagas: las 16 del catálogo ----------
  insert into public.pest_reports (user_id, crop_id, pest_type, severity, detected_at, status,
                                   location, lat, lng, treatment, notes)
  values
    (v_yo, c_maiz,   'Gusano cogollero',     'alta',  '2026-09-24', 'activa',
     'Aldea El Manguito', lat0+0.0079, lng0+0.0053, 'Aplicación foliar dirigida al cogollo',
     'Daño visible en cerca del treinta por ciento de las plantas.'),
    (v_yo, c_maiz,   'Gallina ciega',        'media', '2026-08-12', 'controlada',
     'Aldea El Manguito', lat0+0.0072, lng0+0.0041, 'Tratamiento al suelo antes de la segunda fertilización',
     'Se detectó al remover tierra durante el aporque.'),
    (v_yo, c_maiz,   'Barrenador del tallo', 'baja',  '2026-07-19', 'erradicada',
     'Aldea El Manguito', lat0+0.0083, lng0+0.0037, 'Eliminación manual de plantas afectadas',
     'Solo aparecieron cuatro plantas con el tallo perforado.'),
    (v_yo, c_frijol, 'Mosca blanca',         'alta',  '2026-09-26', 'activa',
     'Orilla del río, sector sur', lat0-0.0063, lng0-0.0072, 'Trampas amarillas y aplicación jabonosa',
     'Alta presencia en el envés de las hojas jóvenes.'),
    (v_yo, c_frijol, 'Chinche salivosa',     'baja',  '2026-09-10', 'erradicada',
     'Orilla del río, sector sur', lat0-0.0068, lng0-0.0082, 'Control manual',
     'Focos aislados, sin daño económico.'),
    (v_yo, c_frijol, 'Antracnosis',          'media', '2026-09-18', 'controlada',
     'Orilla del río, sector sur', lat0-0.0071, lng0-0.0069, 'Fungicida preventivo y mejor ventilación',
     'Manchas hundidas y oscuras en las vainas.'),
    (v_yo, c_tomate, 'Ácaro rojo',           'media', '2026-09-18', 'activa',
     'Casa de malla', lat0+0.0019, lng0+0.0032, 'Aumento de humedad y azufre mojable',
     'Puntos amarillos y telaraña fina en las hojas bajeras.'),
    (v_yo, c_tomate, 'Tizón tardío',         'alta',  '2026-09-20', 'controlada',
     'Casa de malla', lat0+0.0017, lng0+0.0029, 'Fungicida preventivo después de las lluvias',
     'Manchas de aspecto aceitoso en hoja y tallo.'),
    (v_yo, c_tomate, 'Trips',                'media', '2026-08-29', 'controlada',
     'Casa de malla', lat0+0.0021, lng0+0.0034, 'Trampas azules y aplicación dirigida',
     'Deformación de las hojas nuevas y cicatrices en el fruto.'),
    (v_yo, c_chile,  'Picudo del chile',     'media', '2026-09-27', 'activa',
     'Camino a Jutiapa, kilómetro 3', lat0-0.0136, lng0+0.0108,
     'Recolección y destrucción de los frutos caídos',
     'Se observan orificios de postura en los frutos pequeños.'),
    (v_yo, c_cafe,   'Roya',                 'alta',  '2026-07-30', 'controlada',
     'Ladera del cerro', lat0+0.0145, lng0-0.0185, 'Poda sanitaria y aplicación de cobre',
     'Afectó sobre todo la parte baja de la plantación.'),
    (v_yo, c_sandia, 'Pulgón',               'baja',  '2026-03-05', 'erradicada',
     'Sector oriente', lat0-0.0021, lng0+0.0181, 'Control biológico con mariquitas',
     'Se resolvió sin necesidad de aplicaciones químicas.'),
    (v_yo, c_sandia, 'Mildiu',               'media', '2026-03-22', 'controlada',
     'Sector oriente', lat0-0.0027, lng0+0.0188, 'Aplicación de cobre y menos riego por aspersión',
     'Polvo blanquecino en el envés de las hojas.'),
    (v_yo, c_limon,  'Nematodos',            'media', '2026-06-14', 'activa',
     'Atrás de la casa', lat0+0.0034, lng0-0.0019, 'Incorporación de materia orgánica al suelo',
     'Árboles con crecimiento lento y raíces con nudos.'),
    (v_yo, c_papa,   'Langosta',             'alta',  '2026-09-08', 'controlada',
     'Parte alta del terreno', lat0+0.0114, lng0-0.0134, 'Aviso a los vecinos y aplicación en conjunto',
     'Llegó un grupo grande que se comió el follaje en dos días.'),
    (v_yo, c_sorgo,  'Gusano cogollero',     'media', '2026-07-25', 'controlada',
     'Sector poniente', lat0-0.0041, lng0-0.0163, 'Aplicación temprana al cogollo',
     'Se atendió a tiempo y el cultivo se recuperó.'),
    (v_yo, null,     'Hormiga arriera',      'media', '2026-09-15', 'activa',
     'Cerca de la casa', lat0+0.0006, lng0+0.0004, 'Ubicación y tratamiento del hormiguero',
     'No está en un cultivo en particular, pero corta las plantas jóvenes.'),
    (v_yo, null,     'Langosta',             'baja',  '2026-09-09', 'erradicada',
     'Camino hacia la aldea', lat0+0.0091, lng0-0.0058, 'Observación, no se aplicó nada',
     'Solo pasaron de largo, sin quedarse a comer.');

  -- ---------- labores: los 7 tipos ----------
  insert into public.crop_activities (crop_id, user_id, activity_type, performed_at,
                                      input_name, quantity, unit, cost, notes)
  values
    (c_maiz,   v_yo, 'siembra',        '2026-05-18', 'Semilla criolla',        45,   'lb',        320, 'Siembra manual con espeque.'),
    (c_maiz,   v_yo, 'fertilizacion',  '2026-06-05', 'Urea',                    3,   'qq',        690, 'Primera fertilización.'),
    (c_maiz,   v_yo, 'riego',          '2026-06-20', 'Manual con manguera',     4,   'horas',      60, 'Canícula corta, se regó para sostener la planta.'),
    (c_maiz,   v_yo, 'fertilizacion',  '2026-07-08', 'Fórmula 15-15-15',        2,   'qq',        520, 'Segunda fertilización, al aporque.'),
    (c_maiz,   v_yo, 'control_plagas', '2026-08-13', 'Insecticida al suelo',    1,   'l',         145, 'Por presencia de gallina ciega.'),
    (c_maiz,   v_yo, 'riego',          '2026-08-28', 'Manual con manguera',     3,   'horas',      45, 'Días sin lluvia durante el llenado del grano.'),
    (c_maiz,   v_yo, 'control_plagas', '2026-09-25', 'Aplicación foliar',       2,   'bombadas',  180, 'Contra el gusano cogollero.'),
    (c_frijol, v_yo, 'siembra',        '2026-08-20', 'Frijol negro',           30,   'lb',        240, 'Siembra de postrera.'),
    (c_frijol, v_yo, 'otro',           '2026-08-30', 'Limpia manual',        null,   null,        350, 'Se pagó una cuadrilla por día.'),
    (c_frijol, v_yo, 'fertilizacion',  '2026-09-05', 'Fórmula 10-30-10',      1.5,   'qq',        390, 'Junto con la primera limpia.'),
    (c_frijol, v_yo, 'control_plagas', '2026-09-26', 'Jabón potásico',          1,   'l',          85, 'Contra la mosca blanca.'),
    (c_tomate, v_yo, 'siembra',        '2026-07-10', 'Pilones de tomate',    1200,   'unidades', 1800, 'Trasplante desde el semillero.'),
    (c_tomate, v_yo, 'riego',          '2026-07-15', 'Goteo',                   2,   'horas',       0, 'Riego diario programado.'),
    (c_tomate, v_yo, 'fertilizacion',  '2026-07-25', 'Fertirriego completo',    5,   'kg',        275, 'Aplicado por el sistema de goteo.'),
    (c_tomate, v_yo, 'poda',           '2026-08-10', 'Poda de brotes',       null,   null,          0, 'Se dejó un solo eje por planta.'),
    (c_tomate, v_yo, 'riego',          '2026-08-20', 'Goteo',                   2,   'horas',       0, 'Se mantiene el programa diario.'),
    (c_tomate, v_yo, 'control_plagas', '2026-09-19', 'Azufre mojable',          2,   'kg',        120, 'Contra el ácaro rojo.'),
    (c_tomate, v_yo, 'control_plagas', '2026-09-21', 'Fungicida de cobre',      1,   'kg',        160, 'Preventivo contra el tizón.'),
    (c_tomate, v_yo, 'riego',          '2026-09-26', 'Goteo',                   2,   'horas',       0, 'Sin cambios en el programa.'),
    (c_chile,  v_yo, 'siembra',        '2026-09-05', 'Pilones de chile',      600,   'unidades',  900, 'Primera experiencia con este cultivo.'),
    (c_chile,  v_yo, 'riego',          '2026-09-12', 'Aspersión',               2,   'horas',      30, 'Riego de establecimiento.'),
    (c_chile,  v_yo, 'riego',          '2026-09-22', 'Aspersión',               2,   'horas',      30, 'Segunda aplicación.'),
    (c_cafe,   v_yo, 'poda',           '2026-07-31', 'Poda sanitaria',       null,   null,        400, 'Eliminación de ramas afectadas por roya.'),
    (c_cafe,   v_yo, 'control_plagas', '2026-08-02', 'Caldo bordelés',         20,   'l',         260, 'Aplicación de cobre contra la roya.'),
    (c_sandia, v_yo, 'siembra',        '2026-01-15', 'Semilla híbrida',         2,   'kg',        850, 'Siembra directa.'),
    (c_sandia, v_yo, 'riego',          '2026-02-10', 'Goteo',                   3,   'horas',      75, 'Etapa de crecimiento.'),
    (c_sandia, v_yo, 'fertilizacion',  '2026-02-25', 'Nitrato de potasio',     25,   'kg',        430, 'Para el llenado del fruto.'),
    (c_sandia, v_yo, 'cosecha',        '2026-04-20', 'Corte manual',         null,   null,        600, 'Se pagó cuadrilla de corte.'),
    (c_limon,  v_yo, 'poda',           '2026-02-14', 'Poda de formación',    null,   null,        250, 'Se abrió el centro de los árboles.'),
    (c_limon,  v_yo, 'riego',          '2026-04-05', 'Manual por árbol',        5,   'horas',      80, 'Época seca, riego cada tercer día.'),
    (c_limon,  v_yo, 'fertilizacion',  '2026-05-20', 'Abono orgánico',        400,   'kg',        600, 'Un costal por árbol.'),
    (c_papa,   v_yo, 'siembra',        '2026-08-01', 'Papa semilla',           80,   'lb',        560, 'Prueba en pequeño.'),
    (c_papa,   v_yo, 'control_plagas', '2026-09-09', 'Aplicación en conjunto',  1,   'l',         130, 'Por la llegada de la langosta.'),
    (c_papa,   v_yo, 'riego',          '2026-09-14', 'Manual con manguera',     2,   'horas',      30, 'Después de la aplicación.'),
    (c_sorgo,  v_yo, 'siembra',        '2026-06-12', 'Sorgo forrajero',        20,   'lb',        180, 'Al voleo.'),
    (c_sorgo,  v_yo, 'control_plagas', '2026-07-26', 'Aplicación foliar',       2,   'bombadas',  150, 'Contra el cogollero.'),
    (c_sorgo,  v_yo, 'otro',           '2026-08-15', 'Chapia de orillas',    null,   null,        200, 'Para que no entre la maleza.');

  -- ---------- cosechas ----------
  insert into public.harvests (crop_id, user_id, season, harvest_date, quantity, unit, quality, income, notes)
  values
    (c_maiz,   v_yo, 'Primera 2023',  '2023-10-02',  24, 'qq',       'tercera', 2160, 'Grano pequeño y manchado por la lluvia en la cosecha.'),
    (c_maiz,   v_yo, 'Primera 2024',  '2024-09-28',  32, 'qq',       'segunda', 3200, 'Año con poca lluvia durante la floración.'),
    (c_maiz,   v_yo, 'Primera 2025',  '2025-09-25',  38, 'qq',       'primera', 4180, 'La mejor temporada hasta ahora.'),
    (c_frijol, v_yo, 'Postrera 2024', '2024-11-28',  11, 'qq',       'segunda', 1870, 'Se perdió parte por exceso de lluvia.'),
    (c_frijol, v_yo, 'Postrera 2025', '2025-11-30',  14, 'qq',       'primera', 2660, 'Buen precio al momento de vender.'),
    (c_tomate, v_yo, 'Primera 2025',  '2025-10-10',  95, 'cajas',    'primera', 7125, 'Primera cosecha del invernadero.'),
    (c_sandia, v_yo, 'Verano 2026',   '2026-04-20', 420, 'unidades', 'primera', 6300, 'Vendida a intermediario de Jutiapa.'),
    (c_cafe,   v_yo, 'Primera 2024',  '2025-01-20',  26, 'qq',       'primera', 8320, 'Antes de que llegara la roya.'),
    (c_cafe,   v_yo, 'Primera 2025',  '2026-01-28',  18, 'qq',       'segunda', 5400, 'Rendimiento bajo por la roya.'),
    (c_limon,  v_yo, 'Anual 2025',    '2025-12-15', 340, 'redes',    'primera', 5100, 'Buena producción, precio bajo en diciembre.'),
    (c_sorgo,  v_yo, 'Primera 2025',  '2025-10-08',  45, 'pacas',    'segunda', 2250, 'Se guardó para la época seca.');

  -- ---------- asistencia técnica ----------
  insert into public.incidents (user_id, crop_id, type, subject, description, status, response, responded_at)
  values
    (v_yo, c_maiz, 'Plaga o enfermedad', 'El cogollero no cede con la aplicación',
     'Apliqué hace tres días y sigo viendo larvas dentro del cogollo. El daño se ve en casi un tercio del lote. Quisiera saber si debo repetir la aplicación o cambiar de producto.',
     'abierta', null, null),
    (v_yo, c_papa, 'Semilla y siembra', 'Si la papa se adapta a esta altura',
     'Sembré un tablón pequeño de papa para probar. Quisiera saber si a la altura de Atescatempa conviene seguir con este cultivo o si mejor lo dejo.',
     'abierta', null, null),
    (v_yo, c_tomate, 'Riego y agua', 'Dudas con el tiempo de riego por goteo',
     'Tengo el goteo programado dos horas diarias, pero no sé si es mucho o poco para tomate en casa de malla. El suelo se ve húmedo en la superficie pero quiero estar seguro.',
     'en_proceso', null, null),
    (v_yo, c_limon, 'Suelo y fertilización', 'Los limones crecen despacio',
     'Los árboles tienen tres años y se ven pequeños comparados con los del vecino. Al sacar uno vi que las raíces tienen unos nuditos.',
     'en_proceso', null, null),
    (v_yo, c_cafe, 'Suelo y fertilización', 'Renovación del cafetal',
     'El cafetal es heredado y tiene más de quince años. Después de la roya estoy pensando renovarlo. Necesito orientación sobre qué variedad conviene en esta zona y cuándo hacerlo.',
     'cerrada',
     'Para la altura de Atescatempa conviene una variedad resistente a la roya. La renovación se hace por lotes, no todo de una vez, para no quedarse sin ingreso. Comience por el lote más afectado al terminar la cosecha.',
     '2026-09-12 16:30:00-06'),
    (v_yo, null, 'Comercialización', 'A quién vender el maíz este año',
     'El año pasado vendí a un intermediario que pagó por debajo del precio. Quisiera saber si hay alguna organización de productores en el municipio.',
     'cerrada',
     'En el municipio funcionan dos asociaciones de productores de granos básicos. Acérquese a la municipalidad, a la oficina de desarrollo económico, donde le pueden dar el contacto de ambas.',
     '2026-08-20 10:15:00-06'),
    (v_yo, null, 'Uso de la aplicación', 'No me llegaban los avisos al teléfono',
     'Instalé la aplicación en el teléfono pero los avisos del clima no me aparecían. Ya quedó resuelto después de dar el permiso de notificaciones.',
     'cerrada',
     'El permiso de notificaciones debe otorgarse desde el propio teléfono, en el apartado de avisos del perfil. Una vez concedido, los avisos llegan aunque la aplicación esté cerrada.',
     '2026-09-27 09:00:00-06');

  -- ---------- avisos en la campana ----------
  insert into public.notifications (user_id, title, body, type, severity, read, dedup_key, created_at)
  values
    (v_yo, 'Lluvia intensa prevista',
     'Se esperan lluvias fuertes en las próximas 48 horas. Revise los drenajes y retrase las aplicaciones foliares.',
     'clima', 'high', false, null, now() - interval '3 hours'),
    (v_yo, 'Temperatura alta',
     'Se prevén temperaturas por encima de los 34 grados. Riegue temprano o al caer la tarde.',
     'clima', 'medium', false, null, now() - interval '1 day'),
    (v_yo, 'Respuesta a su solicitud',
     'El personal técnico respondió su consulta sobre la renovación del cafetal.',
     'incidencia', 'low', true, null, now() - interval '2 days'),
    (v_yo, 'Índice ultravioleta elevado',
     'El índice ultravioleta alcanzará niveles altos al mediodía. Proteja al personal que trabaje en campo.',
     'clima', 'medium', true, null, now() - interval '4 days');

  -- ---------- publicaciones y mercado ----------
  insert into public.posts (author_id, title, excerpt, content, categories, status)
  values
    (v_yo, 'Vendo maíz criollo, 20 quintales',
     'Maíz amarillo criollo de la cosecha pasada, bien seco y limpio.',
     'Tengo disponibles veinte quintales de maíz criollo amarillo de la cosecha de primera. El grano está seco, por debajo del catorce por ciento de humedad, y almacenado en silo metálico. Entrego en Atescatempa o puedo llevarlo hasta Jutiapa si la compra es de diez quintales o más.',
     '{Comercial,Granos}', 'published'),
    (v_yo, 'Tomate de invernadero por caja',
     'Tomate de primera, cortado el mismo día de la entrega.',
     'Tomate de casa de malla, de variedad de crecimiento indeterminado. Se entrega en cajas de veinticinco libras. Puedo apartar producción semanal para quien compre de forma constante. El precio se conviene según el volumen.',
     '{Comercial,Hortalizas}', 'published'),
    (v_yo, 'Frijol negro para semilla',
     'Frijol seleccionado de la postrera anterior, apto para siembra.',
     'Frijol negro de la postrera pasada, seleccionado a mano y libre de grano picado. Sirve para semilla. Disponible por libra o por quintal.',
     '{Comercial,Granos}', 'published'),
    (v_yo, 'Limón persa por red',
     'Limón de huerto propio, cortado por encargo.',
     'Limón persa de huerto propio, cuarenta árboles en producción. Se corta por encargo para que llegue fresco. Vendo por red o por ciento. Hay disponibilidad casi todo el año, con más producción entre noviembre y febrero.',
     '{Comercial,Frutas}', 'published'),
    (v_yo, 'Cómo me fue con el control del cogollero',
     'Comparto lo que me funcionó y lo que no, por si le sirve a alguien.',
     'Este año el cogollero pegó fuerte en el lote de maíz. Lo que mejor me resultó fue aplicar temprano, cuando la planta estaba pequeña, y dirigir la aplicación al cogollo y no a la hoja. Cuando esperé a ver el daño ya era tarde. También noté que los lotes que fertilicé a tiempo aguantaron mejor.',
     '{Plagas,Maíz}', 'published'),
    (v_yo, 'La langosta pasó por la parte alta',
     'Aviso para los que tienen terreno hacia el cerro.',
     'El ocho de septiembre llegó un grupo grande de langosta a la parte alta del terreno y en dos días se comió el follaje de la papa. Avisé a los vecinos y aplicamos el mismo día, entre varios. Si ven el grupo acercándose, no esperen: avisen y apliquen todos a la vez, porque si solo uno aplica las langostas se pasan al terreno de al lado.',
     '{Plagas,Avisos}', 'published'),
    (v_yo, 'Borrador: notas sobre el riego por goteo',
     'Apuntes que todavía estoy ordenando.',
     'Estoy anotando los tiempos de riego del invernadero para comparar el gasto de agua entre meses. Cuando tenga los datos completos lo publico.',
     '{Riego}', 'draft');

  -- ==========================================================
  --  LOS DEMÁS AGRICULTORES · conjuntos pequeños y variados
  -- ==========================================================
  for i in 1 .. n_otros loop
    v_u := v_otros[i];

    insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                              sowing_date, expected_harvest_date, location, lat, lng, notes)
    values (v_u, nom[i], tip[i], esp[i], 1.0 + (i * 0.25), 'mz',
            case when i % 3 = 0 then 'Cosechado' else 'En crecimiento' end,
            date '2026-05-01' + (i * 11), date '2026-09-15' + (i * 11),
            ref[i], lat0 + dlat[i], lng0 + dlng[i],
            'Parcela registrada durante las pruebas de la aplicación.')
    returning id into v_c1;

    insert into public.crops (user_id, name, type, species_name, area, area_unit, status,
                              sowing_date, expected_harvest_date, location, lat, lng, notes)
    values (v_u, nom[i] || ' II', tip[((i + 3) % 8) + 1], esp[((i + 3) % 8) + 1], 0.5, 'mz',
            'Sembrado', date '2026-08-05' + (i * 5), date '2026-11-20' + (i * 5),
            ref[((i + 2) % 8) + 1], lat0 + dlat[i] * 0.6, lng0 + dlng[i] * 0.6,
            'Segunda parcela, más pequeña.')
    returning id into v_c2;

    insert into public.pest_reports (user_id, crop_id, pest_type, severity, detected_at, status,
                                     location, lat, lng, treatment, notes)
    values
      (v_u, v_c1, pla[i], sev[i], date '2026-09-01' + i, est[i],
       ref[i], lat0 + dlat[i] * 1.02, lng0 + dlng[i] * 1.02,
       'Aplicación dirigida al foco', 'Foco detectado durante la revisión semanal.'),
      (v_u, v_c2, pla[((i + 4) % 8) + 1], sev[((i + 2) % 8) + 1], date '2026-08-10' + i,
       est[((i + 5) % 8) + 1], ref[((i + 2) % 8) + 1],
       lat0 + dlat[i] * 0.62, lng0 + dlng[i] * 0.62,
       'Monitoreo y control manual', 'Daño leve, se mantiene en observación.');

    insert into public.crop_activities (crop_id, user_id, activity_type, performed_at,
                                        input_name, quantity, unit, cost, notes)
    values
      (v_c1, v_u, 'siembra',        date '2026-05-01' + (i * 11), 'Semilla',      40, 'lb',   300 + (i * 25), 'Siembra de la temporada.'),
      (v_c1, v_u, 'fertilizacion',  date '2026-06-10' + (i * 7),  'Urea',          2, 'qq',   460 + (i * 30), 'Primera fertilización.'),
      (v_c1, v_u, 'riego',          date '2026-07-05' + (i * 4),  'Manguera',      3, 'horas', 45 + (i * 5),  'Días sin lluvia.'),
      (v_c2, v_u, 'siembra',        date '2026-08-05' + (i * 5),  'Semilla',      20, 'lb',   180 + (i * 15), 'Siembra de la segunda parcela.'),
      (v_c2, v_u, 'control_plagas', date '2026-08-20' + (i * 3),  'Aplicación',    1, 'l',    110 + (i * 10), 'Por el foco detectado.');

    insert into public.harvests (crop_id, user_id, season, harvest_date, quantity, unit, quality, income, notes)
    values
      (v_c1, v_u, 'Primera 2025', date '2025-09-20' + i, 20 + (i * 3), 'qq',
       (array['primera','segunda','tercera'])[((i - 1) % 3) + 1], 2200 + (i * 280),
       'Resultado de la temporada anterior.');

    insert into public.incidents (user_id, crop_id, type, subject, description, status, response, responded_at)
    values
      (v_u, v_c1,
       (array['Plaga o enfermedad','Riego y agua','Suelo y fertilización','Cosecha y almacenamiento'])[((i - 1) % 4) + 1],
       'Consulta sobre ' || lower(esp[i]),
       'Tengo dudas con el manejo de ' || lower(esp[i]) || ' en esta parcela. Quisiera orientación sobre qué hacer en las próximas semanas.',
       (array['abierta','en_proceso','cerrada'])[((i - 1) % 3) + 1],
       case when ((i - 1) % 3) + 1 = 3
            then 'Se recomienda revisar el cultivo dos veces por semana y llevar el registro de cada labor para poder comparar con la temporada anterior.'
            else null end,
       case when ((i - 1) % 3) + 1 = 3 then now() - (i * interval '2 days') else null end);

    insert into public.posts (author_id, title, excerpt, content, categories, status)
    values
      (v_u, 'Vendo ' || lower(esp[i]) || ' · ' || ref[i],
       'Producción propia, disponible esta semana.',
       'Tengo disponible ' || lower(esp[i]) || ' de mi parcela en ' || ref[i] ||
       '. Entrego en Atescatempa. El precio se conviene según la cantidad, y para compras grandes puedo llevarlo hasta el casco urbano.',
       '{Comercial}', 'published');
  end loop;

  -- ==========================================================
  --  ARTÍCULOS · contenido editorial del personal técnico
  -- ==========================================================
  insert into public.articles (author_id, title, slug, excerpt, content_html, categories, status, published_at)
  values (v_editor, 'Calendario de siembra para Atescatempa', 'calendario-siembra-atescatempa',
   'Las fechas de siembra de primera y de postrera en el municipio, y qué conviene sembrar en cada una.',
   '<p>En Atescatempa el ciclo agrícola se organiza en dos temporadas de siembra, marcadas por el régimen de lluvias.</p><h3>Primera</h3><p>Se siembra entre mediados de mayo y principios de junio, cuando ya se establecieron las primeras lluvias. Es la temporada del maíz y de los cultivos que necesitan un ciclo largo.</p><h3>Postrera</h3><p>Se siembra entre mediados de agosto y principios de septiembre, aprovechando la humedad acumulada. Es la temporada del frijol, que necesita menos agua y un ciclo más corto.</p><p>Sembrar fuera de estas ventanas expone el cultivo a la canícula o a que la lluvia lo sorprenda en cosecha.</p>',
   '{Siembra,Clima}', 'published', now() - interval '20 days')
  returning id into v_art;

  insert into public.article_comments (article_id, author_id, text)
  values (v_art, v_yo, 'Muy útil. Este año sembré la postrera el veinte de agosto y me funcionó bien.');
  if n_otros >= 1 then
    insert into public.article_comments (article_id, author_id, text)
    values (v_art, v_otros[1], 'Una consulta: ¿estas fechas también aplican para las partes altas del municipio?');
  end if;

  insert into public.articles (author_id, title, slug, excerpt, content_html, categories, status, published_at)
  values (v_editor, 'Reconocer el gusano cogollero a tiempo', 'reconocer-gusano-cogollero',
   'Cómo identificar el daño temprano, cuándo aplicar y por qué esperar sale más caro.',
   '<p>El gusano cogollero es la plaga que más pérdidas causa en el maíz del oriente del país. El control es barato si se hace temprano y caro si se hace tarde.</p><h3>Cómo se reconoce</h3><p>El primer signo son raspaduras translúcidas en las hojas nuevas. Después aparecen agujeros alineados y, en el cogollo, aserrín. Para entonces la larva ya está protegida dentro del cogollo.</p><h3>Cuándo aplicar</h3><p>La aplicación debe dirigirse al cogollo, no a la hoja, y hacerse cuando la planta aún es pequeña. Una aplicación temprana y bien dirigida vale más que tres tardías.</p>',
   '{Plagas,Maíz}', 'published', now() - interval '12 days')
  returning id into v_art;

  insert into public.article_comments (article_id, author_id, text)
  values (v_art, v_yo, 'Confirmo lo del aserrín en el cogollo. Cuando lo vi ya era tarde.');

  insert into public.articles (author_id, title, slug, excerpt, content_html, categories, status, published_at)
  values (v_editor, 'Qué anotar de cada labor y para qué sirve', 'que-anotar-de-cada-labor',
   'El registro no es papeleo: es la única forma de saber si una temporada fue mejor que otra.',
   '<p>Un agricultor que no registra repite los mismos errores porque no tiene con qué compararlos.</p><h3>Lo mínimo</h3><p>De cada labor conviene anotar la fecha, qué se aplicó, cuánto y cuánto costó. Con esos cuatro datos ya se puede calcular el costo por manzana y compararlo con el ingreso de la cosecha.</p><h3>Lo que revela</h3><p>Al cruzar el registro con la cosecha aparecen cosas que de memoria no se ven: que el lote fertilizado a tiempo rindió más, o que una aplicación tardía no sirvió de nada.</p>',
   '{Registro,Buenas prácticas}', 'published', now() - interval '5 days')
  returning id into v_art;

  insert into public.articles (author_id, title, slug, excerpt, content_html, categories, status, published_at)
  values (v_editor, 'Borrador: manejo del agua en la canícula', 'manejo-agua-canicula',
   'Artículo en preparación sobre cómo sostener el cultivo durante la sequía de medio ciclo.',
   '<p>Contenido en preparación.</p>', '{Riego}', 'draft', null);

  -- ==========================================================
  --  COMENTARIOS EN LAS PUBLICACIONES
  -- ==========================================================
  if n_otros >= 1 then
    insert into public.comments (post_id, author_id, text)
    select p.id, v_otros[1], '¿Todavía tiene disponible? Me interesan cinco quintales.'
    from public.posts p where p.author_id = v_yo and p.title like 'Vendo maíz%' limit 1;
  end if;
  if n_otros >= 2 then
    insert into public.comments (post_id, author_id, text)
    select p.id, v_otros[2], 'Gracias por compartirlo. A mí me pasó igual el año pasado.'
    from public.posts p where p.author_id = v_yo and p.title like 'Cómo me fue%' limit 1;
  end if;
  if n_otros >= 3 then
    insert into public.comments (post_id, author_id, text)
    select p.id, v_otros[3], 'Buen aviso. Por acá también se vieron, pero no se quedaron.'
    from public.posts p where p.author_id = v_yo and p.title like 'La langosta%' limit 1;
  end if;
  insert into public.comments (post_id, author_id, text)
  select p.id, v_yo, 'Buenas. Le escribo al número que tengo registrado en el perfil.'
  from public.posts p where p.author_id <> v_yo and p.title like 'Vendo %' limit 1;

  raise notice 'Carga terminada. Cuenta principal: %. Otros agricultores con datos: %.', correo_principal, n_otros;
end $$;


-- ============================================================
--  CONSEJOS · tabla pública, no pertenece a ningún usuario
-- ============================================================
delete from public.tips;

insert into public.tips (crop_type, condition, title, body, source) values
(null, 'lluvia_intensa', 'Revisa los drenajes antes de la lluvia',
 'Limpia las zanjas y los canales de salida para que el agua no se estanque. El encharcamiento por más de dos días pudre la raíz y favorece los hongos del suelo.', 'AgrícolaGT'),
('Grano', 'lluvia_intensa', 'Protege el grano próximo a cosecha',
 'Si el maíz o el frijol ya está seco en la planta, adelanta la cosecha. El grano mojado en campo se mancha y pierde precio.', 'AgrícolaGT'),
('Hortaliza', 'lluvia_intensa', 'Aporca y tutora las hortalizas',
 'Levanta un poco de tierra al pie de la planta y asegura los tutores. La lluvia fuerte con viento tumba el tomate y el chile cargados.', 'AgrícolaGT'),
(null, 'lluvia_intensa', 'Espera para aplicar productos',
 'No fumigues ni fertilices antes de la lluvia: el producto se lava y se pierde el gasto. Deja pasar al menos seis horas sin lluvia después de aplicar.', 'AgrícolaGT'),
(null, 'sequia', 'Riega temprano o al caer la tarde',
 'Riega antes de las nueve de la mañana o después de las cuatro de la tarde. Al mediodía buena parte del agua se evapora antes de llegar a la raíz.', 'AgrícolaGT'),
(null, 'sequia', 'Cubre el suelo con rastrojo',
 'Una capa de rastrojo, hoja seca o zacate al pie de la planta conserva la humedad y baja la temperatura del suelo. Es la medida más barata contra la sequía.', 'AgrícolaGT'),
('Grano', 'sequia', 'Cuida las etapas críticas del maíz',
 'La floración y el llenado de grano son los momentos en que el maíz más resiente la falta de agua. Si el riego es limitado, concéntralo en esas semanas.', 'AgrícolaGT'),
('Hortaliza', 'ola_calor', 'Da sombra a las hortalizas',
 'Con más de 35 grados el tomate y el chile botan la flor. Una malla de sombra o un tapesco improvisado reduce la pérdida de fruto.', 'AgrícolaGT'),
(null, 'ola_calor', 'Aumenta la frecuencia del riego',
 'Riega con menos volumen pero más seguido. Con calor fuerte el suelo se seca desde arriba y la raíz nueva queda desprotegida.', 'AgrícolaGT'),
(null, 'humedad_baja', 'Vigila la araña roja',
 'El ambiente seco favorece al ácaro rojo. Revisa el envés de las hojas: si ves puntos amarillos o telaraña fina, actúa de inmediato.', 'AgrícolaGT'),
(null, 'uv_alto', 'Protégete tú también',
 'Con índice ultravioleta alto, trabaja de sombrero y camisa de manga larga, y evita la jornada entre las once y las dos.', 'AgrícolaGT'),
(null, 'viento', 'Asegura tutores y coberturas',
 'Revisa amarres, tutores y cualquier plástico o malla. El viento fuerte levanta las coberturas y quiebra las plantas altas.', 'AgrícolaGT'),
(null, 'general', 'Anota cada labor que realices',
 'Registrar riegos, fertilizaciones y aplicaciones te permite comparar temporadas y saber qué te funcionó. Sin registro, la experiencia se pierde de un año a otro.', 'AgrícolaGT'),
(null, 'general', 'Revisa el cultivo dos veces por semana',
 'La mayoría de plagas se controla barato cuando se detecta temprano. Camina el terreno y revisa hojas, tallo y raíz de varias plantas al azar.', 'AgrícolaGT'),
('Leguminosa', 'general', 'Rota el frijol con otro cultivo',
 'Sembrar frijol sobre frijol año con año acumula enfermedades del suelo. Alternarlo con maíz o una hortaliza corta el ciclo de esas enfermedades.', 'AgrícolaGT'),
('Grano', 'general', 'Guarda el grano bien seco',
 'Almacena el grano por debajo del catorce por ciento de humedad y en recipiente cerrado. Así evitas el gorgojo y el hongo durante el almacenamiento.', 'AgrícolaGT'),
('Cítrico', 'sequia', 'Riego del cítrico en época seca',
 'El limón resiste la sequía pero la falta de agua durante la floración reduce el amarre del fruto. Riegue cada tercer día alrededor del tronco, sin mojar el follaje, y mantenga una capa de hojarasca para conservar la humedad.', 'AgrícolaGT'),
('Cítrico', 'lluvia_intensa', 'Drenaje en el huerto de cítricos',
 'El cítrico no tolera el agua estancada en la raíz. Después de una lluvia fuerte revise que no queden charcos al pie de los árboles y abra un canal de salida si es necesario.', 'AgrícolaGT'),
('Tubérculo', 'humedad_baja', 'Aporque de la papa con poca humedad',
 'Cuando el ambiente está seco, realice el aporque después de regar y no antes. La tierra suelta y seca no protege el tubérculo y queda expuesto al sol, lo que produce manchas verdes.', 'AgrícolaGT'),
('Tubérculo', 'lluvia_intensa', 'La papa después de una lluvia fuerte',
 'El exceso de agua favorece la pudrición del tubérculo. Evite entrar al tablón mientras el suelo esté saturado y revise el drenaje entre los surcos.', 'AgrícolaGT'),
('Forraje', 'sequia', 'Aprovechamiento del sorgo en la época seca',
 'El sorgo forrajero rebrota después del corte si queda suficiente humedad. Corte a veinte centímetros del suelo para que la planta tenga reserva y pueda rebrotar cuando llueva.', 'AgrícolaGT'),
('Forraje', 'general', 'Conservación del forraje',
 'Si tiene más forraje del que el ganado consume, conviene ensilarlo o pacarlo mientras está verde. Guardado en seco pierde valor nutritivo con el tiempo.', 'AgrícolaGT'),
('Leguminosa', 'humedad_baja', 'El frijol y la humedad del suelo',
 'El frijol necesita humedad sobre todo en la floración y el llenado de la vaina. Si el suelo está seco en esas etapas, un solo riego en el momento oportuno puede marcar la diferencia en el rendimiento.', 'AgrícolaGT'),
(null, 'viento', 'Aplicaciones cuando hay viento',
 'Con viento por encima de los quince kilómetros por hora la aplicación se desvía y se pierde buena parte del producto. Espere a que amaine, normalmente temprano en la mañana o al caer la tarde.', 'AgrícolaGT'),
(null, 'general', 'Lleve el registro el mismo día',
 'Anote la labor el mismo día que la realiza. Los registros que se dejan para después se llenan de memoria y pierden exactitud, que es justamente lo que sirve para comparar entre temporadas.', 'AgrícolaGT'),
(null, 'general', 'Compare siempre el rendimiento, no la cantidad',
 'Una cosecha de treinta quintales no dice nada por sí sola. Lo que conviene comparar es cuánto se obtuvo por manzana, porque eso sí permite saber si una temporada fue mejor que otra.', 'AgrícolaGT');


-- ============================================================
--  COMPROBACIÓN · cuántas filas quedaron en cada tabla
-- ============================================================
select t.tablename as tabla,
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from public.%I', t.tablename),
                           false, true, '')))[1]::text::bigint as filas
from pg_tables t
where t.schemaname = 'public'
order by t.tablename;


-- ============================================================
--  OPCIONAL · eliminar las dos tablas que el código no usa.
--  Descomenta solo si decides quitarlas del diccionario de datos.
-- ============================================================
-- drop table if exists public.ai_alerts;
-- drop table if exists public.weather_alerts;
