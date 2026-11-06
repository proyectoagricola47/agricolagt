/**
 * Nombres que se muestran en el menú.
 *
 * La asesora revisó el sistema buscando los módulos por el nombre que llevan
 * en el documento de graduación y no los encontró, porque en el menú se
 * llamaban de otra forma. Aquí están los dos juegos de nombres.
 *
 * Para volver a los nombres cortos basta cambiar la constante de abajo a
 * `false`: no hay que tocar ningún otro archivo.
 */
const USAR_NOMBRES_DEL_DOCUMENTO = true

/** Los que estaban antes de la revisión. */
const CORTOS = {
  inicio: 'Inicio',
  clima: 'Clima',
  consejos: 'Consejos',
  publicaciones: 'Publicaciones',
  articulos: 'Artículos',
  mercado: 'Mercado',
  perfil: 'Mi Perfil',
  notificaciones: 'Notificaciones',
  cultivos: 'Mis Cultivos',
  plagas: 'Plagas',
  agua: 'Agua',
  mapa: 'Mapa',
  reportes: 'Reportes',
  asistencia: 'Asistencia',
  bandeja: 'Bandeja',
  misPublicaciones: 'Mis Publicaciones',
  admin: 'Admin',
}

/** Los mismos módulos con el nombre que llevan en el documento. */
const DEL_DOCUMENTO: typeof CORTOS = {
  ...CORTOS,
  clima: 'Pronóstico climático',
  consejos: 'Consejos',
  notificaciones: 'Alertas y notificaciones',
  cultivos: 'Gestión de cultivos',
  asistencia: 'Consulta a profesionales',
  bandeja: 'Bandeja de consultas',
}

export const E = USAR_NOMBRES_DEL_DOCUMENTO ? DEL_DOCUMENTO : CORTOS
