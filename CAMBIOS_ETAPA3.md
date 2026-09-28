# Etapa 3 — cambios aplicados

Módulos M-06, M-08, M-09 y M-10 del documento «Funcionalidades pendientes del sistema
AgrícolaGT». Con esta entrega quedan cubiertas las nueve observaciones de la asesora.

## Antes de correr la aplicación

Ejecutar **una sola vez** el archivo `supabase/migracion_etapa3.sql` en el panel de
Supabase: *SQL Editor → New query → pegar el contenido → Run*.

Crea las tablas `harvests`, `incidents` y `tips`, la función `es_personal_tecnico()`,
y deja precargados diecisiete consejos agrícolas. Todas las sentencias son repetibles.

## M-06 · Cosechas y rendimiento por temporada

- `src/model/harvest.ts` — nuevo
- `src/modules/crops/services/harvestService.ts` — nuevo
- `src/modules/crops/components/HarvestForm.tsx` — nuevo
- `src/modules/crops/components/HarvestList.tsx` — nuevo
- `src/modules/crops/pages/cropDetail.tsx` — sección de cosechas

Se registra lo realmente obtenido en cada temporada: cantidad, unidad, calidad,
ingreso y observaciones. El historial calcula el rendimiento por unidad de superficie
usando el área del cultivo, señala la mejor temporada y, junto al gasto de las labores,
muestra el balance del cultivo. El nombre de temporada se sugiere según la fecha,
siguiendo la división local entre primera y postrera.

## M-08 · Incidencias y asistencia técnica

- `src/model/incident.ts` — nuevo
- `src/modules/incidents/services/incidentService.ts` — nuevo
- `src/modules/incidents/components/IncidentForm.tsx` — nuevo
- `src/modules/incidents/pages/myIncidents.tsx` — nuevo
- `src/modules/incidents/pages/adminIncidents.tsx` — nuevo
- Rutas privadas `/asistencia` y `/asistencia/bandeja`

El agricultor describe su problema y sigue el estado de la solicitud, que avanza entre
abierta, en proceso y cerrada. El personal con rol de administrador o editor la ve en
su bandeja junto al teléfono de contacto del solicitante, la toma, responde y la cierra.
Al responder, el agricultor recibe un aviso en su campana de notificaciones.

**Para probar la bandeja** el usuario debe tener rol `admin` o `editor` en la tabla
`users`. Se cambia desde el Table Editor de Supabase o desde la pantalla de
administración de usuarios de la propia aplicación.

## M-09 · Consejos y recomendaciones personalizadas

- `src/modules/tips/services/recommendationService.ts` — nuevo
- `src/modules/tips/components/TipsPanel.tsx` — nuevo
- `src/modules/articles/pages/ArticlesListPage.tsx` — panel en la portada

Cruza las alertas que ya calcula el módulo de clima con los cultivos que el agricultor
tiene registrados. Se muestran entre dos y cuatro consejos, con preferencia por los que
coinciden a la vez con la condición del clima y con un cultivo suyo. Cada consejo indica
por qué se le está mostrando.

## M-10 · Reportes y estadísticas

- `src/modules/reports/services/reportService.ts` — nuevo
- `src/modules/reports/components/SeasonChart.tsx` — nuevo
- `src/modules/reports/components/PestSummary.tsx` — nuevo
- `src/modules/reports/pages/reportsPage.tsx` — nuevo
- Ruta privada `/reportes`

Reúne lo registrado en los demás módulos: rendimiento por temporada, incidencia de
plagas por tipo con desglose de severidad, labores por tipo y por mes, y el balance
entre el gasto de las labores y el ingreso de las cosechas. Se filtra por temporada y
por ubicación.

Las gráficas se dibujan con elementos de la propia página y no con una biblioteca
externa, para no agregar peso ni depender de archivos que no estarían disponibles
sin conexión. El rendimiento se agrupa por unidad de medida, ya que sumar quintales
con cajas daría una cifra sin sentido.

## Seguridad

Las políticas de las tablas nuevas restringen cada fila a su propietario. La bandeja de
incidencias es la única excepción: el personal técnico ve todas las solicitudes. Esa
comprobación se resuelve en la función `es_personal_tecnico()`, declarada con
privilegios del definidor para que la política no consulte la tabla de usuarios bajo las
restricciones del propio usuario, lo que produciría una recursión.

## Navegación

Se agregaron **Reportes** y **Asistencia** al menú, y **Bandeja** solo para quien tenga
rol de administrador o editor.

## Verificación

```
npm install
npx tsc -b        # sin errores
npx vite build    # compilación de producción correcta
```
