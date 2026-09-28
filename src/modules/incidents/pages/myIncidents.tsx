import { useEffect, useState } from 'react'
import IncidentForm from '../components/IncidentForm'
import { incidentService } from '../services/incidentService'
import {
  INCIDENT_STATUS_LABEL,
  INCIDENT_STATUS_STYLE,
  type Incident,
  type IncidentInput,
} from '../../../model/incident'

function formatoFecha(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-GT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function MyIncidentsPage() {
  const [items, setItems] = useState<Incident[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setItems(await incidentService.listMine())
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function enviar(data: IncidentInput) {
    const nueva = await incidentService.create(data)
    setItems((prev) => [nueva, ...prev])
    setFormAbierto(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta solicitud?')) return
    try {
      await incidentService.remove(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar la solicitud.')
    }
  }

  const sinResponder = items.filter((i) => i.status !== 'cerrada').length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Asistencia técnica</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Reporta un problema en tu cultivo y recibe orientación. Verás la respuesta
            aquí mismo y te llegará un aviso en la campana.
          </p>
        </div>
        <button
          onClick={() => setFormAbierto((v) => !v)}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm whitespace-nowrap"
        >
          {formAbierto ? 'Cerrar' : 'Nueva solicitud'}
        </button>
      </div>

      {formAbierto && (
        <div className="rounded-xl border border-gray-200 p-4 mb-6">
          <IncidentForm onSaved={enviar} onCancel={() => setFormAbierto(false)} />
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {items.length > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          {sinResponder > 0
            ? `Tienes ${sinResponder} ${sinResponder === 1 ? 'solicitud' : 'solicitudes'} en trámite.`
            : 'Todas tus solicitudes están cerradas.'}
        </p>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center text-gray-600">
          Todavía no has hecho ninguna solicitud de asistencia.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{i.subject}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {i.type}
                    {i.cropName ? ` · ${i.cropName}` : ''} · {formatoFecha(i.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${INCIDENT_STATUS_STYLE[i.status]}`}>
                  {INCIDENT_STATUS_LABEL[i.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{i.description}</p>

              {i.response ? (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-semibold text-emerald-900">
                    Respuesta{i.assignedName ? ` de ${i.assignedName}` : ''}
                    {i.respondedAt ? ` · ${formatoFecha(i.respondedAt)}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{i.response}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Aún no hay respuesta. Te avisaremos cuando la haya.
                </p>
              )}

              {i.status === 'abierta' && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => eliminar(i.id)}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Eliminar solicitud
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
