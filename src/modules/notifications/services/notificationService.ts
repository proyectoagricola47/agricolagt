import { supabase } from '../../../api/supabaseClient'
import type { AppNotification, NotificationSeverity } from '../../../model/notification'

/** Alerta agrícola tal como la produce el servicio de clima. */
export type AlertaEntrante = {
  title: string
  description: string
  severity: NotificationSeverity
  tags?: string[]
}

const LS_PERMISO = 'notif:permiso-solicitado'

function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body ?? undefined,
    type: row.type ?? undefined,
    severity: row.severity ?? undefined,
    read: Boolean(row.read),
    createdAt: row.created_at,
  }
}

/** ¿El navegador admite notificaciones? */
export function soportaNotificaciones(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function estadoDelPermiso(): NotificationPermission | 'no-soportado' {
  if (!soportaNotificaciones()) return 'no-soportado'
  return Notification.permission
}

/**
 * Pide el permiso una sola vez por dispositivo. Si el usuario lo niega,
 * la aplicación sigue funcionando y solo se guarda el historial.
 */
export async function pedirPermisoUnaVez(): Promise<NotificationPermission | 'no-soportado'> {
  if (!soportaNotificaciones()) return 'no-soportado'
  if (Notification.permission !== 'default') return Notification.permission

  let yaSolicitado = false
  try {
    yaSolicitado = localStorage.getItem(LS_PERMISO) === '1'
  } catch {
    yaSolicitado = false
  }
  if (yaSolicitado) return Notification.permission

  try {
    localStorage.setItem(LS_PERMISO, '1')
  } catch {
    // almacenamiento bloqueado: no es motivo para detener nada
  }

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Muestra la notificación del navegador, si hay permiso. */
function mostrarEnNavegador(titulo: string, cuerpo: string) {
  if (!soportaNotificaciones() || Notification.permission !== 'granted') return
  try {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: titulo,
    })
  } catch (e) {
    console.error('No se pudo mostrar la notificación', e)
  }
}

/**
 * Clave que evita repetir la misma alerta al mismo usuario el mismo día.
 * Se calcula aquí, y no en la base, porque un índice de PostgreSQL no admite
 * expresiones que dependan de la zona horaria.
 */
function claveDelDia(titulo: string): string {
  const hoy = new Date().toISOString().slice(0, 10)
  return `${titulo}|${hoy}`
}

/** Guarda la notificación en el historial del usuario. */
async function guardarEnHistorial(
  userId: string,
  alerta: AlertaEntrante,
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: alerta.title,
    body: alerta.description,
    type: 'clima',
    severity: alerta.severity,
    dedup_key: claveDelDia(alerta.title),
  })
  // El índice único sobre dedup_key evita repetir la misma alerta el mismo día:
  // si choca, no es un error que deba interrumpir al usuario.
  if (error && error.code !== '23505') throw error
}

/**
 * Procesa las alertas del clima: guarda en el historial las de severidad
 * media y alta, y notifica en el navegador únicamente las altas.
 */
export async function procesarAlertas(alertas: AlertaEntrante[]): Promise<void> {
  if (!alertas?.length) return

  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return

  const relevantes = alertas.filter((a) => a.severity === 'high' || a.severity === 'medium')
  if (!relevantes.length) return

  await pedirPermisoUnaVez()

  for (const alerta of relevantes) {
    try {
      await guardarEnHistorial(uid, alerta)
      if (alerta.severity === 'high') {
        mostrarEnNavegador(alerta.title, alerta.description)
      }
    } catch (e) {
      console.error('No se pudo registrar la alerta', e)
    }
  }
}

export async function listarMisNotificaciones(limite = 50): Promise<AppNotification[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('id,user_id,title,body,type,severity,read,created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function contarNoLeidas(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

export async function marcarComoLeida(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}

export async function marcarTodasComoLeidas(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', uid)
    .eq('read', false)
  if (error) throw error
}
