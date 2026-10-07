import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { waterService } from '../services/waterService'
import {
  WATER_TYPE_LABEL,
  WATER_TYPE_ICON,
  type WaterSource,
} from '../../../model/water'

export default function MyWaterPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WaterSource[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setItems(await waterService.list())
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar las fuentes. Revisa tu conexión.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function eliminar(id: string) {
    if (!confirm('¿Quitar esta fuente de agua del mapa?')) return
    try {
      await waterService.remove(id)
      setItems((prev) => prev.filter((f) => f.id !== id))
    } catch (e) {
      console.error(e)
      alert('No se pudo quitar la fuente.')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">Fuentes de agua</h1>
        <Link
          to="/agua/nueva"
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm whitespace-nowrap"
        >
          Registrar fuente
        </Link>
      </div>
      <p className="text-sm text-gray-600 mb-5 max-w-2xl">
        Las fuentes que registres aparecen como puntos azules en el mapa de la
        comunidad, para que todos sepan de dónde se puede tomar agua para regar.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-700">Todavía no has registrado ninguna fuente de agua.</p>
          <p className="text-sm text-gray-500 mt-1">
            Registra el río, el pozo o el nacimiento que usas para regar y quedará
            señalado en el mapa.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {WATER_TYPE_ICON[f.sourceType]} {f.name}
                </p>
                <p className="text-sm text-gray-600">
                  {WATER_TYPE_LABEL[f.sourceType]} · {f.lat.toFixed(5)}, {f.lng.toFixed(5)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/agua/${f.id}/editar`)}
                  className="px-3 py-1.5 rounded-md border border-primary-500 text-primary-700 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(f.id)}
                  className="px-3 py-1.5 rounded-md border text-red-600 text-sm"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
