import { useEffect, useState } from 'react'
import { incidentService } from '../services/incidentService'
import {
  INCIDENT_STATUS_LABEL,
  INCIDENT_STATUS_STYLE,
  type Incident,
  type IncidentStatus,
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

export default function AdminIncidentsPage() {
  const [items, setItems] = useState<Incident[]>([])
  const [filtro, setFiltro] = useState<IncidentStatus | ''>('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function cargar(estado?: IncidentStatus | '') {
    setCargando(true)
    setError(null)
    try {
      setItems(await incidentService.listAll(estado || undefined))
    } catch (e) {
      console.error(e)
      setError('No se pudo cargar la bandeja de incidencias.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar(filtro) }, [filtro])

  function reemplazar(actualizada: Incident) {
    setItems((prev) => prev.map((i) => (i.id === actualizada.id ? actualizada : i)))
  }

  async function tomar(id: string) {
    try {
      const r = await incidentService.tomar(id)
      if (r) reemplazar(r)
    } catch (e) {
      console.error(e)
      alert('No se pudo tomar la incidencia.')
    }
  }

  async function responder(id: string, cerrar: boolean) {
    if (texto.trim().length < 10) {
      alert('Escribe una respuesta con algo más de detalle.')
      return
    }
    setEnviando(true)
    try {
      const r = await incidentService.responder(id, texto.trim(), cerrar)
      if (r) reemplazar(r)
      setRespondiendo(null)
      setTexto('')
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar la respuesta.')
    } finally {
      setEnviando(false)
    }
  }

  const abiertas = items.filter((i) => i.status === 'abierta').length
  const enProceso = items.filter((i) => i.status === 'en_proceso').length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold">Bandeja de asistencia técnica</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Solicitudes enviadas por los agricultores. Al responder, la persona recibe
          un aviso en su campana de notificaciones.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          <p className="text-xs text-gray-600">En la lista</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-2xl font-bold text-amber-800">{abiertas}</p>
          <p className="text-xs text-amber-800">Sin atender</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-2xl font-bold text-blue-800">{enProceso}</p>
          <p className="text-xs text-blue-800">En proceso</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as IncidentStatus | '')}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          <option value="">Todas</option>
          {(Object.keys(INCIDENT_STATUS_LABEL) as IncidentStatus[]).map((s) => (
            <option key={s} value={s}>{INCIDENT_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center text-gray-600">
          No hay incidencias que mostrar.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{i.subject}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {i.authorName ?? 'Agricultor'}
                    {i.authorPhone ? ` · 📞 ${i.authorPhone}` : ''}
                    {i.cropName ? ` · ${i.cropName}` : ''} · {formatoFecha(i.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">{i.type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${INCIDENT_STATUS_STYLE[i.status]}`}>
                  {INCIDENT_STATUS_LABEL[i.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{i.description}</p>

              {i.response && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-semibold text-emerald-900">
                    Respuesta{i.assignedName ? ` de ${i.assignedName}` : ''}
                    {i.respondedAt ? ` · ${formatoFecha(i.respondedAt)}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{i.response}</p>
                </div>
              )}

              {respondiendo === i.id ? (
                <div className="mt-4">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                    placeholder="Escribe la orientación para el agricultor…"
                  />
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => { setRespondiendo(null); setTexto('') }}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => responder(i.id, false)}
                      disabled={enviando}
                      className="px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm disabled:opacity-60"
                    >
                      Responder y dejar abierta
                    </button>
                    <button
                      onClick={() => responder(i.id, true)}
                      disabled={enviando}
                      className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm disabled:opacity-60"
                    >
                      Responder y cerrar
                    </button>
                  </div>
                </div>
              ) : (
                i.status !== 'cerrada' && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {i.status === 'abierta' && (
                      <button
                        onClick={() => tomar(i.id)}
                        className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                      >
                        Tomar
                      </button>
                    )}
                    <button
                      onClick={() => { setRespondiendo(i.id); setTexto(i.response ?? '') }}
                      className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm"
                    >
                      Responder
                    </button>
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
