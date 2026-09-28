# Etapa 2 — cambios aplicados

Módulos M-04, M-05 y M-07 del documento «Funcionalidades pendientes del sistema AgrícolaGT».

## Antes de correr la aplicación

Ejecutar **una sola vez** el archivo `supabase/migracion_etapa2.sql` en el panel de
Supabase: *SQL Editor → New query → pegar el contenido → Run*.

Crea las tablas `pest_reports` y `crop_activities`, agrega las columnas `lat` y `lng`
a la tabla `crops`, y prepara el depósito `pest-photos` para las fotografías.
Todas las sentencias son repetibles: volver a ejecutarlas no causa daño.

## M-04 · Registro y seguimiento de plagas

- `src/model/pest.ts` — nuevo
- `src/modules/pests/services/pestService.ts` — nuevo
- `src/modules/pests/components/PestForm.tsx` — nuevo
- `src/modules/pests/components/PestCard.tsx` — nuevo
- `src/modules/pests/pages/myPests.tsx` — nuevo
- `src/modules/pests/pages/pestUpsert.tsx` — nuevo
- Rutas privadas `/plagas`, `/plagas/nueva` y `/plagas/:id/editar`

El agricultor registra la plaga o enfermedad, su severidad, la fecha en que la
detectó, el cultivo afectado, el tratamiento aplicado y una fotografía opcional.
La situación de cada foco avanza entre activa, controlada y erradicada. El listado
se filtra por severidad, por situación y por texto libre, y muestra el conteo de
focos activos y de severidad alta.

## M-05 · Prácticas agrícolas por cultivo

- `src/model/activity.ts` — nuevo
- `src/modules/crops/services/activityService.ts` — nuevo
- `src/modules/crops/components/ActivityForm.tsx` — nuevo
- `src/modules/crops/components/ActivityTimeline.tsx` — nuevo
- `src/modules/crops/pages/cropDetail.tsx` — nuevo
- `src/modules/crops/components/cropCard.tsx` — enlace a la ficha
- Ruta privada `/crops/:id`

Cada cultivo tiene su bitácora en orden cronológico. Las labores registradas son
siembra, fertilización, riego, control de plagas, poda, cosecha y otra labor, con
insumo, cantidad, unidad, costo y observaciones. **El riego queda registrado como
un tipo más de actividad**, con lo que se cubre la gestión del agua que el documento
promete en el objetivo general y en la hipótesis, sin un módulo aparte. La ficha
resume cuántas veces se ha regado, cuándo fue el último riego, el gasto acumulado
y las plagas reportadas en ese cultivo.

## M-07 · Mapa de cultivos y distribución de plagas

- `src/components/map/LocationPicker.tsx` — nuevo
- `src/modules/maps/pages/mapPage.tsx` — nuevo
- `src/modules/crops/components/CropForm.tsx` — selector de ubicación
- `src/model/crop.ts` y `src/modules/crops/services/cropsService.ts` — coordenadas
- Ruta privada `/mapa`

El selector permite señalar el punto tocando el mapa o tomar la ubicación del
dispositivo. El mapa general dibuja los cultivos en verde y los focos de plaga con
el color y el tamaño correspondientes a su severidad: verde para baja, ámbar para
media y rojo para alta. Se puede ocultar cada capa y filtrar por tipo de plaga.
Al reportar una plaga sobre un cultivo ya ubicado, las coordenadas se heredan.

Los marcadores se dibujan como círculos y no como iconos de imagen, para que el
mapa no dependa de archivos externos y siga funcionando sin conexión.

## Navegación

Se agregaron los enlaces **Plagas** y **Mapa** al menú de escritorio
(`TopNav.tsx`) y al menú móvil (`MobileTopbar.tsx`), visibles con la sesión abierta.

## Verificación

```
npm install
npx tsc -b        # sin errores
npx vite build    # compilación de producción correcta
```
