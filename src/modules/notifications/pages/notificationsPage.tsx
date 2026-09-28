import { useEffect, useState } from 'react'
import type { AppNotification } from '../../../model/notification'
import {
  listarMisNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  estadoDelPermiso,
  pedirPermisoUnaVez,
} from '../services/notificationService'

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const ESTILO_SEVERIDAD: Record<string, string> = {
  high: 'border-red-300 bg-red-50',
  medium: 'border-amber-300 bg-amber-50',
  low: 'border-emerald-300 bg-emerald-50',
}

const ICONO_SEVERIDAD: Record<string, string> = {
  high: '⚠️',
  medium: '🟡',
  low: '✅',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [cargando, setCargando] = useState(true)
  const [permiso, setPermiso] = useState(estadoDelPermiso())

  async function cargar() {
    setCargando(true)
    try {
      setItems(await listarMisNotificaciones())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function activarPermiso() {
    const r = await pedirPermisoUnaVez()
    setPermiso(r)
  }

  async function leerTodas() {
    await marcarTodasComoLeidas().catch(console.error)
    cargar()
  }

  async function leerUna(id: string) {
    await marcarComoLeida(id).catch(console.error)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const noLeidas = items.filter((n) => !n.read).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Notificaciones</h1>
          <p className="text-sm text-gray-600">
            {noLeidas > 0 ? `Tienes ${noLeidas} sin leer` : 'No tienes notificaciones sin leer'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={leerTodas}
            className="px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {permiso === 'default' && (
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <p className="text-sm text-gray-800">
            Activa las notificaciones para recibir los avisos de sequía, lluvia intensa y
            ola de calor aunque no tengas la aplicación abierta.
          </p>
          <button
            onClick={activarPermiso}
            className="mt-3 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm"
          >
            Activar notificaciones
          </button>
        </div>
      )}

      {permiso === 'denied' && (
        <div className="mb-6 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          Bloqueaste las notificaciones en este navegador. Puedes volver a permitirlas desde
          la configuración del sitio. Mientras tanto, las alertas siguen apareciendo en esta pantalla.
        </div>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
          Todavía no hay alertas registradas. Consulta el clima para que el sistema evalúe
          las condiciones de tu ubicación.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${ESTILO_SEVERIDAD[n.severity ?? 'low'] ?? 'border-gray-200 bg-white'} ${n.read ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span aria-hidden>{ICONO_SEVERIDAD[n.severity ?? 'low'] ?? '•'}</span>
                  <div>
                    <h2 className="font-semibold text-gray-900">{n.title}</h2>
                    {n.body && <p className="mt-1 text-sm text-gray-700">{n.body}</p>}
                    <p className="mt-2 text-xs text-gray-500">{formatoFecha(n.createdAt)}</p>
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => leerUna(n.id)}
                    className="text-xs text-primary-700 hover:text-primary-800 underline whitespace-nowrap"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
