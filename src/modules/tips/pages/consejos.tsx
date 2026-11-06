import { useEffect, useMemo, useState } from 'react'
import { listarConsejos, ETIQUETA_CONDICION, type Tip } from '../services/recommendationService'

/**
 * Biblioteca de consejos agrícolas.
 *
 * Los consejos ya estaban en la base y se mostraban solo en la página de
 * inicio, cuando había una alerta de clima que los hiciera aparecer. Esta
 * página los deja consultar siempre, con filtros por condición y por cultivo.
 */
export default function TipsPage() {
  const [items, setItems] = useState<Tip[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [condicion, setCondicion] = useState('')
  const [cultivo, setCultivo] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    let vivo = true
    listarConsejos()
      .then((r) => { if (vivo) { setItems(r); setCargando(false) } })
      .catch((e) => {
        console.error(e)
        if (vivo) { setError('No se pudieron cargar los consejos. Revisa tu conexión.'); setCargando(false) }
      })
    return () => { vivo = false }
  }, [])

  const condiciones = useMemo(
    () => Array.from(new Set(items.map((t) => t.condition).filter(Boolean) as string[])).sort(),
    [items],
  )
  const cultivos = useMemo(
    () => Array.from(new Set(items.map((t) => t.cropType).filter(Boolean) as string[])).sort(),
    [items],
  )

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return items.filter((t) => {
      if (condicion && t.condition !== condicion) return false
      if (cultivo && t.cropType !== cultivo) return false
      if (texto && !(`${t.title} ${t.body}`.toLowerCase().includes(texto))) return false
      return true
    })
  }, [items, condicion, cultivo, busqueda])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Consejos agrícolas</h1>
      <p className="text-gray-600 mb-5">
        Recomendaciones para el manejo del cultivo según la condición del clima y el tipo de
        siembra. En la página de inicio aparecen los que corresponden al clima de hoy y a los
        cultivos que tenga registrados.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar un consejo"
          className="px-3 py-2 rounded-lg border border-gray-300"
        />
        <select
          value={condicion}
          onChange={(e) => setCondicion(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300"
        >
          <option value="">Cualquier condición</option>
          {condiciones.map((c) => (
            <option key={c} value={c}>{ETIQUETA_CONDICION[c] ?? c}</option>
          ))}
        </select>
        <select
          value={cultivo}
          onChange={(e) => setCultivo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300"
        >
          <option value="">Cualquier cultivo</option>
          {cultivos.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {cargando && <p className="text-gray-500">Cargando consejos…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="text-gray-500">No hay consejos que coincidan con lo que buscas.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {visibles.map((t) => (
          <li key={t.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h2 className="font-bold text-emerald-900">{t.title}</h2>
            <p className="text-gray-700 mt-1">{t.body}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {t.condition && (
                <span className="text-xs px-2 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800">
                  {ETIQUETA_CONDICION[t.condition] ?? t.condition}
                </span>
              )}
              {t.cropType && (
                <span className="text-xs px-2 py-1 rounded-full bg-white border border-amber-300 text-amber-800">
                  {t.cropType}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!cargando && !error && (
        <p className="text-sm text-gray-500 mt-6">
          {visibles.length} de {items.length} consejos.
        </p>
      )}
    </div>
  )
}
