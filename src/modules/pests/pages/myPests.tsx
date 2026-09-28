import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PestCard from '../components/PestCard'
import { pestService } from '../services/pestService'
import {
  SEVERITY_LABEL,
  STATUS_LABEL,
  type PestReport,
  type PestSeverity,
  type PestStatus,
} from '../../../model/pest'

export default function MyPestsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<PestReport[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [severidad, setSeveridad] = useState<PestSeverity | ''>('')
  const [situacion, setSituacion] = useState<PestStatus | ''>('')

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setItems(await pestService.list())
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar los reportes. Revisa tu conexión.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este reporte de plaga?')) return
    try {
      await pestService.remove(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar el reporte.')
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter((p) => {
      if (severidad && p.severity !== severidad) return false
      if (situacion && p.status !== situacion) return false
      if (!q) return true
      return [p.pestType, p.cropName, p.location, p.treatment, p.notes]
        .some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [items, busqueda, severidad, situacion])

  const activas = items.filter((p) => p.status === 'activa').length
  const altas = items.filter((p) => p.severity === 'alta' && p.status === 'activa').length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Plagas y enfermedades</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Lleva el registro de las plagas que aparecen en tus cultivos, el tratamiento
            aplicado y cómo evoluciona cada foco.
          </p>
        </div>
        <button
          onClick={() => navigate('/plagas/nueva')}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm whitespace-nowrap"
        >
          Reportar plaga
        </button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-600">Reportes en total</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-2xl font-bold text-amber-800">{activas}</p>
            <p className="text-xs text-amber-800">Focos activos</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-2xl font-bold text-red-800">{altas}</p>
            <p className="text-xs text-red-800">De severidad alta</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 my-5">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por plaga, cultivo o lugar…"
          className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-gray-300"
        />
        <select
          value={severidad}
          onChange={(e) => setSeveridad(e.target.value as PestSeverity | '')}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          <option value="">Toda severidad</option>
          {(Object.keys(SEVERITY_LABEL) as PestSeverity[]).map((s) => (
            <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
          ))}
        </select>
        <select
          value={situacion}
          onChange={(e) => setSituacion(e.target.value as PestStatus | '')}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          <option value="">Toda situación</option>
          {(Object.keys(STATUS_LABEL) as PestStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando reportes…</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">
          <p className="text-gray-600">
            {items.length === 0
              ? 'Todavía no has reportado ninguna plaga.'
              : 'Ningún reporte coincide con el filtro.'}
          </p>
          {items.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Cuando registres la primera, vas a poder verla también en el{' '}
              <Link to="/mapa" className="text-primary-700 underline">mapa de cultivos</Link>.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <PestCard
              key={p.id}
              report={p}
              onEdit={(id) => navigate(`/plagas/${id}/editar`)}
              onDelete={eliminar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
