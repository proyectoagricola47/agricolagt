import { useEffect, useState } from 'react'
import LocationPicker from '../../../components/map/LocationPicker'
import { cropsService } from '../../crops/services/cropsService'
import type { Crop } from '../../../model/crop'
import {
  PEST_OPTIONS,
  SEVERITY_LABEL,
  STATUS_LABEL,
  type PestReport,
  type PestReportInput,
  type PestSeverity,
  type PestStatus,
} from '../../../model/pest'
import { subirFotografia } from '../services/pestService'

type Props = {
  initial?: PestReport
  onSubmit: (data: PestReportInput) => Promise<void>
  onCancel?: () => void
}

const OTRO = '__otro__'

export default function PestForm({ initial, onSubmit, onCancel }: Props) {
  const [crops, setCrops] = useState<Crop[]>([])

  const enLista = initial?.pestType ? PEST_OPTIONS.includes(initial.pestType) : true
  const [pestType, setPestType] = useState(enLista ? initial?.pestType ?? '' : OTRO)
  const [otraPlaga, setOtraPlaga] = useState(enLista ? '' : initial?.pestType ?? '')

  const [cropId, setCropId] = useState(initial?.cropId ?? '')
  const [severity, setSeverity] = useState<PestSeverity>(initial?.severity ?? 'media')
  const [status, setStatus] = useState<PestStatus>(initial?.status ?? 'activa')
  const [detectedAt, setDetectedAt] = useState(
    initial?.detectedAt || new Date().toISOString().slice(0, 10),
  )
  const [location, setLocation] = useState(initial?.location ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : undefined,
  )
  const [treatment, setTreatment] = useState(initial?.treatment ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  /** Fotografía ya guardada; solo se reemplaza si se elige un archivo nuevo. */
  const photoUrl = initial?.photoUrl ?? ''
  const [archivo, setArchivo] = useState<File | null>(null)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    cropsService
      .list()
      .then((r) => { if (vivo) setCrops(r) })
      .catch(() => { if (vivo) setCrops([]) })
    return () => { vivo = false }
  }, [])

  /** Si el cultivo elegido tiene coordenadas, se heredan al reporte. */
  function elegirCultivo(id: string) {
    setCropId(id)
    if (!coords && id) {
      const c = crops.find((x) => x.id === id)
      if (c?.lat != null && c?.lng != null) setCoords({ lat: c.lat, lng: c.lng })
      if (!location && c?.location) setLocation(c.location)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const tipoFinal = pestType === OTRO ? otraPlaga.trim() : pestType.trim()
    if (!tipoFinal) {
      setError('Indica de qué plaga o enfermedad se trata.')
      return
    }
    if (!detectedAt) {
      setError('Indica la fecha en que la detectaste.')
      return
    }

    setGuardando(true)
    try {
      let url = photoUrl
      if (archivo) url = await subirFotografia(archivo)

      await onSubmit({
        cropId: cropId || undefined,
        pestType: tipoFinal,
        severity,
        status,
        detectedAt,
        location: location.trim() || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        photoUrl: url || undefined,
        treatment: treatment.trim() || undefined,
        notes: notes.trim() || undefined,
      })
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'No se pudo guardar el reporte.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Plaga o enfermedad</label>
          <select
            value={pestType}
            onChange={(e) => setPestType(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            <option value="" disabled>Selecciona…</option>
            {PEST_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value={OTRO}>Otra…</option>
          </select>
          {pestType === OTRO && (
            <input
              value={otraPlaga}
              onChange={(e) => setOtraPlaga(e.target.value)}
              className="mt-2 w-full h-10 rounded-lg border border-gray-300 px-3"
              placeholder="Escribe el nombre de la plaga"
            />
          )}
        </div>

        <div>
          <label className="text-sm text-gray-600">Cultivo afectado</label>
          <select
            value={cropId}
            onChange={(e) => elegirCultivo(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            <option value="">Sin asociar a un cultivo</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.speciesName ? ` · ${c.speciesName}` : ''}
              </option>
            ))}
          </select>
          {crops.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Aún no tienes cultivos registrados. Puedes reportar la plaga igual.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-600">Severidad</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as PestSeverity)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            {(Object.keys(SEVERITY_LABEL) as PestSeverity[]).map((s) => (
              <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Situación</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PestStatus)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            {(Object.keys(STATUS_LABEL) as PestStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Fecha en que se detectó</label>
          <input
            type="date"
            value={detectedAt}
            onChange={(e) => setDetectedAt(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Lugar</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder="Aldea, sector o referencia"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Tratamiento aplicado</label>
          <input
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder="Producto, dosis o medida tomada"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
            placeholder="Extensión del daño, parte de la planta afectada, etc."
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600">Fotografía</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-white"
        />
        {photoUrl && !archivo && (
          <img src={photoUrl} alt="Fotografía del reporte" className="mt-2 h-32 rounded-lg object-cover" />
        )}
      </div>

      <div>
        <label className="text-sm text-gray-600">Ubicación en el mapa</label>
        <p className="text-xs text-gray-500 mb-2">
          Sirve para ubicar el foco en el mapa de distribución de plagas.
        </p>
        <LocationPicker value={coords} onChange={setCoords} />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="pt-1 flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={guardando}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar reporte'}
        </button>
      </div>
    </form>
  )
}
