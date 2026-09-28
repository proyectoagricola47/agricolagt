import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cropsService } from '../services/cropsService'
import { activityService } from '../services/activityService'
import { harvestService } from '../services/harvestService'
import { pestService } from '../../pests/services/pestService'
import ActivityForm from '../components/ActivityForm'
import ActivityTimeline from '../components/ActivityTimeline'
import HarvestForm from '../components/HarvestForm'
import HarvestList from '../components/HarvestList'
import { AREA_UNIT_LABEL, type Crop } from '../../../model/crop'
import type { CropActivity, CropActivityInput } from '../../../model/activity'
import type { Harvest, HarvestInput } from '../../../model/harvest'
import { SEVERITY_COLOR, SEVERITY_LABEL, type PestReport } from '../../../model/pest'

function formatoFecha(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-GT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function CropDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [crop, setCrop] = useState<Crop | undefined>()
  const [labores, setLabores] = useState<CropActivity[]>([])
  const [plagas, setPlagas] = useState<PestReport[]>([])
  const [cosechas, setCosechas] = useState<Harvest[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [formCosecha, setFormCosecha] = useState(false)

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true)
    setError(null)
    try {
      const [c, l, p, h] = await Promise.all([
        cropsService.get(id),
        activityService.listByCrop(id),
        pestService.listByCrop(id),
        harvestService.listByCrop(id),
      ])
      setCrop(c)
      setLabores(l)
      setPlagas(p)
      setCosechas(h)
    } catch (e) {
      console.error(e)
      setError('No se pudo cargar la ficha del cultivo.')
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  async function registrarLabor(data: CropActivityInput) {
    const nueva = await activityService.create(data)
    setLabores((prev) => [nueva, ...prev].sort((a, b) => b.performedAt.localeCompare(a.performedAt)))
    setFormAbierto(false)
  }

  async function eliminarLabor(idLabor: string) {
    if (!confirm('¿Eliminar esta labor de la bitácora?')) return
    try {
      await activityService.remove(idLabor)
      setLabores((prev) => prev.filter((a) => a.id !== idLabor))
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar la labor.')
    }
  }

  async function registrarCosecha(data: HarvestInput) {
    const nueva = await harvestService.create(data)
    setCosechas((prev) => [nueva, ...prev].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate)))
    setFormCosecha(false)
  }

  async function eliminarCosecha(idCosecha: string) {
    if (!confirm('¿Eliminar esta cosecha del historial?')) return
    try {
      await harvestService.remove(idCosecha)
      setCosechas((prev) => prev.filter((h) => h.id !== idCosecha))
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar la cosecha.')
    }
  }

  /** Resumen de riego, que es lo que el documento pide vigilar. */
  const resumenRiego = useMemo(() => {
    const riegos = labores.filter((a) => a.activityType === 'riego')
    if (riegos.length === 0) return undefined
    return { veces: riegos.length, ultimo: riegos[0].performedAt }
  }, [labores])

  const gastoTotal = useMemo(
    () => labores.reduce((suma, a) => suma + (a.cost ?? 0), 0),
    [labores],
  )

  const ingresoTotal = useMemo(
    () => cosechas.reduce((suma, h) => suma + (h.income ?? 0), 0),
    [cosechas],
  )

  if (cargando) return <p className="text-gray-500">Cargando…</p>
  if (error) return <p className="text-red-700">{error}</p>
  if (!crop) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        No se encontró el cultivo.{' '}
        <Link to="/crops" className="text-primary-700 underline">Volver a mis cultivos</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/crops" className="text-sm text-gray-500 hover:text-gray-700">← Mis cultivos</Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{crop.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {crop.speciesName ? `${crop.speciesName} · ` : ''}{crop.type} · {crop.area} {AREA_UNIT_LABEL[crop.areaUnit]}
            </p>
          </div>
          <button
            onClick={() => navigate(`/crops/${crop.id}/edit`)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Editar cultivo
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Estado</p>
          <p className="font-semibold text-gray-900">{crop.status}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Siembra</p>
          <p className="font-semibold text-gray-900 text-sm">{formatoFecha(crop.sowingDate)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Cosecha estimada</p>
          <p className="font-semibold text-gray-900 text-sm">{formatoFecha(crop.expectedHarvestDate)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Gasto registrado</p>
          <p className="font-semibold text-gray-900">Q{gastoTotal.toFixed(2)}</p>
          {ingresoTotal > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Ingreso Q{ingresoTotal.toFixed(2)} · Balance{' '}
              <span className={ingresoTotal - gastoTotal >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                Q{(ingresoTotal - gastoTotal).toFixed(2)}
              </span>
            </p>
          )}
        </div>
      </section>

      {resumenRiego && (
        <p className="text-sm text-gray-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          💧 Se ha regado {resumenRiego.veces} {resumenRiego.veces === 1 ? 'vez' : 'veces'}.
          El último riego fue el {formatoFecha(resumenRiego.ultimo)}.
        </p>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">Bitácora de labores</h2>
            <p className="text-sm text-gray-600">
              Siembra, fertilización, riego, control de plagas y cosecha de este cultivo.
            </p>
          </div>
          <button
            onClick={() => setFormAbierto((v) => !v)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm whitespace-nowrap"
          >
            {formAbierto ? 'Cerrar' : 'Registrar labor'}
          </button>
        </div>

        {formAbierto && (
          <div className="rounded-xl border border-gray-200 p-4 mb-5">
            <ActivityForm cropId={crop.id} onSaved={registrarLabor} onCancel={() => setFormAbierto(false)} />
          </div>
        )}

        <ActivityTimeline items={labores} onDelete={eliminarLabor} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">Cosechas y rendimiento</h2>
            <p className="text-sm text-gray-600">
              Lo que realmente se obtuvo en cada temporada, para poder comparar entre años.
            </p>
          </div>
          <button
            onClick={() => setFormCosecha((v) => !v)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm whitespace-nowrap"
          >
            {formCosecha ? 'Cerrar' : 'Registrar cosecha'}
          </button>
        </div>

        {formCosecha && (
          <div className="rounded-xl border border-gray-200 p-4 mb-5">
            <HarvestForm cropId={crop.id} onSaved={registrarCosecha} onCancel={() => setFormCosecha(false)} />
          </div>
        )}

        <HarvestList
          items={cosechas}
          area={crop.area}
          areaUnit={crop.areaUnit}
          onDelete={eliminarCosecha}
        />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold">Plagas reportadas en este cultivo</h2>
          <Link
            to="/plagas/nueva"
            className="px-4 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm whitespace-nowrap"
          >
            Reportar plaga
          </Link>
        </div>

        {plagas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center text-gray-500">
            No hay plagas reportadas en este cultivo.
          </div>
        ) : (
          <ul className="space-y-2">
            {plagas.map((p) => (
              <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{p.pestType}</p>
                  <p className="text-xs text-gray-500">Detectada el {formatoFecha(p.detectedAt)}</p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap"
                  style={{ backgroundColor: SEVERITY_COLOR[p.severity] }}
                >
                  {SEVERITY_LABEL[p.severity]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
