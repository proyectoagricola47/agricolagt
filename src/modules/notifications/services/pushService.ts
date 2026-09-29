import { supabase } from '../../../api/supabaseClient'

/**
 * Llave pública que autoriza a este sistema a enviar avisos al navegador.
 * Su pareja privada vive únicamente en el proceso programado de envío.
 */
const LLAVE_PUBLICA = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** El navegador espera la llave en forma de arreglo de bytes. */
function llaveABytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const crudo = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length))
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i)
  return bytes
}

function aBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let texto = ''
  for (const b of bytes) texto += String.fromCharCode(b)
  return btoa(texto)
}

/** ¿El navegador admite notificaciones enviadas desde el servidor? */
export function navegadorSoportaPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/** ¿Está configurada la llave pública que autoriza el envío? */
export function hayLlaveConfigurada(): boolean {
  return Boolean(LLAVE_PUBLICA)
}

/** ¿Se puede usar la función completa? */
export function soportaPush(): boolean {
  return navegadorSoportaPush() && hayLlaveConfigurada()
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!soportaPush()) return null
  const registro = await navigator.serviceWorker.ready
  return registro.pushManager.getSubscription()
}

/** ¿Este dispositivo ya está registrado para recibir avisos? */
export async function estaSuscrito(): Promise<boolean> {
  return Boolean(await suscripcionActual())
}

/**
 * Registra el dispositivo. Debe invocarse desde un toque del usuario,
 * porque de lo contrario el navegador rechaza la solicitud de permiso.
 */
export async function suscribirDispositivo(): Promise<void> {
  if (!soportaPush()) throw new Error('Este navegador no admite avisos con la aplicación cerrada.')

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('Debes permitir las notificaciones para recibir los avisos.')

  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Debes iniciar sesión.')

  const registro = await navigator.serviceWorker.ready
  let suscripcion = await registro.pushManager.getSubscription()
  if (!suscripcion) {
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: llaveABytes(LLAVE_PUBLICA as string),
    })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: uid,
      endpoint: suscripcion.endpoint,
      p256dh: aBase64(suscripcion.getKey('p256dh')),
      auth: aBase64(suscripcion.getKey('auth')),
      dispositivo: navigator.userAgent.slice(0, 200),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

/** Cancela el registro de este dispositivo. */
export async function desuscribirDispositivo(): Promise<void> {
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return
  const endpoint = suscripcion.endpoint
  await suscripcion.unsubscribe().catch(() => undefined)
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

/** ¿Está activo el modo de demostración en este dispositivo? */
export async function modoDemoActivo(): Promise<boolean> {
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return false
  const { data } = await supabase
    .from('push_subscriptions')
    .select('modo_demo')
    .eq('endpoint', suscripcion.endpoint)
    .maybeSingle()
  return Boolean(data?.modo_demo)
}

/**
 * Activa o desactiva el envío de una verificación cada cinco minutos.
 * Queda guardado en la base, de modo que sigue enviándose aunque la
 * aplicación y el navegador estén cerrados, hasta que se desactive.
 */
export async function cambiarModoDemo(activo: boolean): Promise<void> {
  if (activo) await suscribirDispositivo()
  const suscripcion = await suscripcionActual()
  if (!suscripcion) throw new Error('El dispositivo no está registrado.')

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ modo_demo: activo, updated_at: new Date().toISOString() })
    .eq('endpoint', suscripcion.endpoint)
  if (error) throw error
}
