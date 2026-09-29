# Mapa y reportes comunitarios

Hasta esta versión, el mapa de distribución y la pantalla de reportes
mostraban únicamente los datos del agricultor que consultaba. Eso dejaba
al mapa sin su razón de ser: un foco de plaga solo funciona como alerta
temprana si los vecinos pueden verlo.

A partir de este cambio ambas pantallas muestran la información de toda
la comunidad.

## Qué cambió

### Base de datos — `supabase/migracion_comunitario.sql`

Se agregan cuatro políticas de **lectura** sobre `crops`, `pest_reports`,
`crop_activities` y `harvests`, que permiten a cualquier usuario
autenticado consultar las filas de los demás.

Las políticas de escritura no se modificaron. Cada agricultor sigue
pudiendo crear, editar y borrar únicamente lo suyo.

### Servicios

Se agregaron métodos que consultan sin filtrar por usuario, conservando
los anteriores para las pantallas que deben seguir siendo personales:

| Servicio | Método nuevo | Método que se conserva |
|---|---|---|
| `cropsService` | `listAll()` | `list()` |
| `pestService` | `listAll()` | `list()` |
| `harvestService` | `listAll()` | `listMine()` |
| `activityService` | `listAllRecent()` | `listRecent()` |

### Pantallas

`mapPage.tsx` y `reportService.ts` pasan a usar los métodos nuevos.
Se ajustaron los textos descriptivos, que hablaban en segunda persona
("tus cultivos", "lo que has registrado") y ahora dicen que la
información es de la comunidad.

## Qué NO cambió

**Mis Cultivos** sigue mostrando solo los cultivos propios, porque esa
pantalla usa `cropsService.list()`, que filtra por usuario en el código.
Lo mismo ocurre con la lista de plagas propias y con la bitácora.

## Consideración de privacidad

Con este cambio, la ubicación de las parcelas queda visible para
cualquier usuario autenticado. Es una decisión de diseño deliberada,
coherente con el propósito comunitario del mapa de distribución, pero
conviene dejarla documentada en el apartado de seguridad del trabajo.

Como efecto secundario, un usuario que conociera el identificador de un
cultivo ajeno podría consultar su ficha. No hay forma de llegar a ella
desde la interfaz, ya que solo se navega desde la lista propia.

## Orden de aplicación

1. Ejecutar `supabase/migracion_comunitario.sql` en el editor de SQL.
2. Subir los archivos a GitHub y esperar el despliegue.
