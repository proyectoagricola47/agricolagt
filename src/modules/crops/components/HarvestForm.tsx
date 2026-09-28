import { useState } from 'react'
import {
  HARVEST_UNITS,
  QUALITY_LABEL,
  temporadaSugerida,
  type HarvestInput,
  type HarvestQuality,
} from '../../../model/harvest'

type Props = {
  cropId: string
  onSaved: (data: HarvestInput) => Promise<void>
  onCancel?: () => void
}

export default function HarvestForm({ cropId, onSaved, onCancel }: Props) {
  const [season, setSeason] = useState(temporadaSugerida())
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('qq')
  const [quality, setQuality] = useState<HarvestQuality | ''>('')
  const [income, setIncome] = useState('')
  const [notes, setNotes] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!season.trim()) { setError('Indica la temporada.'); return }
    const cantidad = Number(quantity)
    if (!quantity.trim() || Number.isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad cosechada debe ser un número mayor que cero.')
      return
    }
    const ingreso = income.trim() ? Number(income) : undefined
    if (ingreso !== undefined && Number.isNaN(ingreso)) {
      setError('El ingreso debe ser un número.')
      return
    }

    setGuardando(true)
    try {
      await onSaved({
        cropId,
        season: season.trim(),
        harvestDate,
        quantity: cantidad,
        unit,
        quality: quality || undefined,
        income: ingreso,
        notes: notes.trim() || undefined,
      })
      setQuantity(''); setIncome(''); setNotes(''); setQuality('')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'No se pudo guardar la cosecha.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Temporada</label>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder="Primera 2026"
          />
          <p className="mt-1 text-xs text-gray-500">
            Usa siempre el mismo nombre para poder comparar entre años.
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-600">Fecha de cosecha</label>
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-sm text-gray-600">Cantidad obtenida</label>
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
              {HARVEST_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Calidad</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as HarvestQuality | '')}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            <option value="">Sin clasificar</option>
            {(Object.keys(QUALITY_LABEL) as HarvestQuality[]).map((q) => (
              <option key={q} value={q}>{QUALITY_LABEL[q]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Ingreso en quetzales</label>
          <input
            type="number"
            step="0.01"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
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
            placeholder="Cómo se dio la temporada, a quién se vendió, etc."
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
          {guardando ? 'Guardando…' : 'Registrar cosecha'}
        </button>
      </div>
    </form>
  )
}
