import { useState } from 'react'
import LocationPicker from '../../../components/map/LocationPicker'
import {
  WATER_TYPE_LABEL,
  WATER_TYPE_ICON,
  type WaterSource,
  type WaterSourceInput,
  type WaterSourceType,
} from '../../../model/water'

type Props = {
  initial?: WaterSource
  onSubmit: (data: WaterSourceInput) => Promise<void>
  onCancel: () => void
}

export default function WaterForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sourceType, setSourceType] = useState<WaterSourceType>(initial?.sourceType ?? 'pozo')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(
    initial ? { lat: initial.lat, lng: initial.lng } : undefined,
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar() {
    setError('')
    if (!name.trim()) { setError('Ponle un nombre a la fuente para poder reconocerla.'); return }
    if (!coords) { setError('Señala en el mapa dónde está la fuente.'); return }
    setGuardando(true)
    try {
      await onSubmit({ name: name.trim(), sourceType, lat: coords.lat, lng: coords.lng })
    } catch (e) {
      console.error(e)
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700">Nombre de la fuente</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pozo de la finca Cardona"
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Tipo de fuente</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as WaterSourceType)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
          >
            {(Object.keys(WATER_TYPE_LABEL) as WaterSourceType[]).map((t) => (
              <option key={t} value={t}>
                {WATER_TYPE_ICON[t]} {WATER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Ubicación en el mapa</label>
        <p className="text-xs text-gray-500 mb-2">
          Toca el mapa donde está la fuente, o usa el botón de tu ubicación si estás ahí.
        </p>
        <LocationPicker value={coords} onChange={setCoords} />
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancelar</button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
