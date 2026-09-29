import { useEffect, useMemo, useState } from 'react'
import SeasonChart from '../components/SeasonChart'
import PestSummary from '../components/PestSummary'
import {
  cargarDatos,
  construirReporte,
  type DatosCrudos,
  type Filtros,
} from '../services/reportService'
import { ACTIVITY_ICON, ACTIVITY_LABEL } from '../../../model/activity'

function nombreDeMes(mes: string): string {
  const [anio, m] = mes.split('-')
  if (!anio || !m) return mes
  try {
    return new Date(Number(anio), Number(m) - 1, 1)
      .toLocaleDateString('es-GT', { month: 'short', year: '2-digit' })
  } catch {
    return mes
  }
}

export default function ReportsPage() {
  const [datos, setDatos] = useState<DatosCrudos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<Filtros>({})

  useEffect(() => {
    let vivo = true
    cargarDatos()
      .then((d) => { if (vivo) { setDatos(d); setCargando(false) } })
      .catch((e) => {
        console.error(e)
        if (vivo) { setError('No se pudieron cargar los datos del reporte.'); setCargando(false) }
      })
    return () => { vivo = false }
  }, [])

  const reporte = useMemo(
    () => (datos ? construirReporte(datos, filtros) : null),
    [datos, filtros],
  )

  if (cargando) return <p className="text-gray-500">Calculando…</p>
  if (error) return <p className="text-red-700">{error}</p>
  if (!reporte) return null

  const balance = reporte.ingresoTotal - reporte.gastoTotal
  const maxLabores = Math.max(1, ...reporte.laboresPorMes.map((m) => m.total))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Reportes y estadísticas</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Resumen de lo registrado por la comunidad: rendimiento por temporada, incidencia de
          plagas y labores realizadas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filtros.temporada ?? ''}
          onChange={(e) => setFiltros((f) => ({ ...f, temporada: e.target.value || undefined }))}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          <option value="">Todas las temporadas</option>
          {reporte.temporadasDisponibles.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filtros.ubicacion ?? ''}
          onChange={(e) => setFiltros((f) => ({ ...f, ubicacion: e.target.value || undefined }))}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          <option value="">Todas las ubicaciones</option>
          {reporte.ubicacionesDisponibles.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>

        {(filtros.temporada || filtros.ubicacion) && (
          <button
            onClick={() => setFiltros({})}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Quitar filtros
          </button>
        )}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Cultivos</p>
          <p className="text-2xl font-bold text-gray-900">{reporte.cultivos}</p>
          <p className="text-xs text-gray-500">{reporte.areaTotal.toFixed(2)} de área</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Focos de plaga activos</p>
          <p className="text-2xl font-bold text-gray-900">{reporte.focosActivos}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Gasto en labores</p>
          <p className="text-2xl font-bold text-gray-900">Q{reporte.gastoTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            Q{balance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Ingreso Q{reporte.ingresoTotal.toFixed(2)}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Rendimiento por temporada</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cantidad obtenida en cada temporada, agrupada por unidad de medida.
        </p>
        <SeasonChart datos={reporte.rendimiento} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Incidencia de plagas</h2>
        <p className="text-sm text-gray-600 mb-4">
          Reportes por tipo de plaga, con el desglose de severidad dentro de cada barra.
        </p>
        <PestSummary porTipo={reporte.plagasPorTipo} porSeveridad={reporte.plagasPorSeveridad} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Labores realizadas</h2>
        <p className="text-sm text-gray-600 mb-4">
          Trabajo registrado en las bitácoras de los cultivos de la comunidad.
        </p>

        {reporte.laboresPorTipo.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
            No hay labores registradas todavía.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <ul className="space-y-2">
              {reporte.laboresPorTipo.map((l) => (
                <li
                  key={l.tipo}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-900">
                    <span aria-hidden>{ACTIVITY_ICON[l.tipo]}</span>
                    {ACTIVITY_LABEL[l.tipo]}
                  </span>
                  <span className="text-sm text-gray-700">
                    {l.total}
                    {l.costo > 0 && (
                      <span className="text-xs text-gray-500"> · Q{l.costo.toFixed(2)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {reporte.laboresPorMes.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Labores por mes</p>
                <div className="flex items-end gap-2 h-32">
                  {reporte.laboresPorMes.map((m) => (
                    <div key={m.mes} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="text-xs text-gray-600">{m.total}</span>
                      <div
                        className="w-full bg-primary-600 rounded-t"
                        style={{ height: `${(m.total / maxLabores) * 100}%` }}
                        role="img"
                        aria-label={`${nombreDeMes(m.mes)}: ${m.total} labores`}
                      />
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {nombreDeMes(m.mes)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
