import { useEffect, useState } from 'react'
import type { Crop, CropInput, AreaUnit, CropStatus } from '../../../model/crop'

const statusOptions: CropStatus[] = ['Sembrado', 'En crecimiento', 'Cosechado', 'Pausado']
const unitOptions: AreaUnit[] = ['ha', 'mz', 'm2']

// Opciones predefinidas de tipo y especie por tipo
const typeOptions = [
  'Hortaliza',
  'Grano',
  'Cereal',
  'Fruta',
  'Cítrico',
  'Leguminosa',
  'Tubérculo',
  'Forraje',
  'Oleaginosa',
  'Ornamental',
]

const speciesByType: Record<string, string[]> = {
  Hortaliza: ['Tomate', 'Lechuga', 'Pepino', 'Cebolla', 'Zanahoria', 'Chile/Pimiento', 'Repollo'],
  Grano: ['Maíz', 'Trigo', 'Arroz', 'Cebada', 'Avena', 'Sorgo'],
  Cereal: ['Maíz', 'Trigo', 'Arroz', 'Cebada', 'Avena', 'Sorgo'],
  Fruta: ['Banano', 'Mango', 'Papaya', 'Piña', 'Manzana', 'Uva'],
  Cítrico: ['Naranja', 'Limón', 'Lima', 'Mandarina', 'Toronja'],
  Leguminosa: ['Frijol', 'Soya', 'Lenteja', 'Garbanzos', 'Arveja'],
  Tubérculo: ['Papa', 'Yuca', 'Camote'],
  Forraje: ['Alfalfa', 'Pasto', 'Sorgo forrajero'],
  Oleaginosa: ['Girasol', 'Canola'],
  Ornamental: ['Rosa', 'Clavel', 'Crisantemo'],
}

type Props = {
  initial?: Partial<Crop>
  onSubmit: (data: CropInput) => void
  onCancel?: () => void
}

export default function CropForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type || '')
  const [customType, setCustomType] = useState('')
  const [speciesName, setSpeciesName] = useState(initial?.speciesName || '')
  const [customSpecies, setCustomSpecies] = useState('')
  const [area, setArea] = useState<number>(initial?.area ?? 0)
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(initial?.areaUnit || 'ha')
  const [status, setStatus] = useState<CropStatus>(initial?.status || 'Sembrado')
  const [sowingDate, setSowingDate] = useState(initial?.sowingDate || '')
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(initial?.expectedHarvestDate || '')
  const [location, setLocation] = useState(initial?.location || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  // Inicializar selects con valores personalizados si no están en las listas
  useEffect(() => {
    // Tipo
    if (initial?.type && !typeOptions.includes(initial.type)) {
      setType('__other__')
      setCustomType(initial.type)
    }
    // Especie
    const currentType = initial?.type || ''
    const speciesList = speciesByType[currentType] || []
    if (initial?.speciesName && speciesList.length > 0 && !speciesList.includes(initial.speciesName)) {
      setSpeciesName('__other__')
      setCustomSpecies(initial.speciesName)
    }
    if (initial?.speciesName && speciesList.length === 0) {
      // Si el tipo es "Otro" o no existe lista, tratamos especie como personalizada
      setSpeciesName('__other__')
      setCustomSpecies(initial.speciesName)
    }
  // solo al montar o cambiar initial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.type, initial?.speciesName])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() && !speciesName.trim()) {
      alert('Debes indicar nombre o especie')
      return
    }
    const finalType = type === '__other__' ? customType.trim() : type.trim()
    const finalSpecies = speciesName === '__other__' ? customSpecies.trim() : speciesName.trim()

    if (!finalType) {
      alert('Debes indicar el tipo de cultivo (selecciona o escribe en Otro)')
      return
    }
    if (!area || area <= 0) {
      alert('El área debe ser mayor a 0')
      return
    }
    const payload: CropInput = {
      userId: initial?.userId || 'me',
      name: name.trim() || finalSpecies || finalType,
      type: finalType,
      speciesName: finalSpecies || undefined,
      area,
      areaUnit,
      status,
      sowingDate: sowingDate || undefined,
      expectedHarvestDate: expectedHarvestDate || undefined,
      location: location || undefined,
      notes: notes || undefined,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Nombre del cultivo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3" placeholder="Lote Norte" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Tipo de cultivo</label>
          <select
            value={type || ''}
            onChange={(e) => {
              const v = e.target.value
              setType(v)
              // Reset especie si cambia tipo
              setSpeciesName('')
              setCustomSpecies('')
            }}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            <option value="" disabled>Selecciona un tipo…</option>
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__other__">Otro…</option>
          </select>
          {type === '__other__' && (
            <input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="mt-2 w-full h-10 rounded-lg border border-gray-300 px-3"
              placeholder="Especifica el tipo (ej. Aromáticas)"
            />
          )}
        </div>
        <div>
          <label className="text-sm text-gray-600">Especie</label>
          <select
            value={speciesName || ''}
            onChange={(e) => setSpeciesName(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
            disabled={!type || type === '__other__'}
          >
            <option value="" disabled>{!type ? 'Selecciona un tipo primero…' : (type === '__other__' ? 'Especie personalizada…' : 'Selecciona la especie…')}</option>
            {(speciesByType[type] || []).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="__other__">Otro…</option>
          </select>
          {(speciesName === '__other__' || type === '__other__') && (
            <input
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              className="mt-2 w-full h-10 rounded-lg border border-gray-300 px-3"
              placeholder="Especifica la especie"
            />
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-sm text-gray-600">Área</label>
            <input type="number" step="0.01" value={area} onChange={(e) => setArea(parseFloat(e.target.value))} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3" placeholder="2.5" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Unidad</label>
            <select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value as AreaUnit)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3">
              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as CropStatus)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3">
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Fecha de siembra</label>
          <input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Fecha estimada de cosecha</label>
          <input type="date" value={expectedHarvestDate} onChange={(e) => setExpectedHarvestDate(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Ubicación</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3" placeholder="Finca/sector" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-3" rows={4} placeholder="Observaciones, riego, plagas, etc." />
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300">Cancelar</button>}
        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Guardar</button>
      </div>
    </form>
  )
}
