import { useState } from 'react'
import {
  ACTIVITY_LABEL,
  UNIT_OPTIONS,
  type ActivityType,
  type CropActivityInput,
} from '../../../model/activity'

type Props = {
  cropId: string
  onSaved: (data: CropActivityInput) => Promise<void>
  onCancel?: () => void
}

/** Rótulo del insumo según la labor, para que el campo tenga sentido. */
const ETIQUETA_INSUMO: Record<ActivityType, string> = {
  siembra: 'Semilla o variedad',
  fertilizacion: 'Fertilizante',
  riego: 'Método de riego',
  control_plagas: 'Producto aplicado',
  poda: 'Herramienta o técnica',
  cosecha: 'Producto obtenido',
  otro: 'Insumo',
}

export default function ActivityForm({ cropId, onSaved, onCancel }: Props) {
  const [activityType, setActivityType] = useState<ActivityType>('riego')
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10))
  const [inputName, setInputName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!performedAt) {
      setError('Indica la fecha de la labor.')
      return
    }
    const cantidad = quantity.trim() ? Number(quantity) : undefined
    if (cantidad !== undefined && Number.isNaN(cantidad)) {
      setError('La cantidad debe ser un número.')
      return
    }
    const monto = cost.trim() ? Number(cost) : undefined
    if (monto !== undefined && Number.isNaN(monto)) {
      setError('El costo debe ser un número.')
      return
    }

    setGuardando(true)
    try {
      await onSaved({
        cropId,
        activityType,
        performedAt,
        inputName: inputName.trim() || undefined,
        quantity: cantidad,
        unit: unit || undefined,
        cost: monto,
        notes: notes.trim() || undefined,
      })
      setInputName(''); setQuantity(''); setUnit(''); setCost(''); setNotes('')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'No se pudo guardar la labor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Labor realizada</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            {(Object.keys(ACTIVITY_LABEL) as ActivityType[]).map((t) => (
              <option key={t} value={t}>{ACTIVITY_LABEL[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Fecha</label>
          <input
            type="date"
            value={performedAt}
            onChange={(e) => setPerformedAt(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">{ETIQUETA_INSUMO[activityType]}</label>
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder={activityType === 'riego' ? 'Goteo, aspersión, manual…' : 'Nombre del insumo'}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-sm text-gray-600">Cantidad</label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Unidad</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
            >
              <option value="">—</option>
              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Costo en quetzales</label>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder="Opcional"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
            placeholder="Detalle de la labor"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-2">
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
          {guardando ? 'Guardando…' : 'Registrar labor'}
        </button>
      </div>
    </form>
  )
}
