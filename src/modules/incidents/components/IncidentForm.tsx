import { useEffect, useState } from 'react'
import { cropsService } from '../../crops/services/cropsService'
import type { Crop } from '../../../model/crop'
import { INCIDENT_TYPES, type IncidentInput } from '../../../model/incident'

type Props = {
  onSaved: (data: IncidentInput) => Promise<void>
  onCancel?: () => void
}

export default function IncidentForm({ onSaved, onCancel }: Props) {
  const [crops, setCrops] = useState<Crop[]>([])
  const [type, setType] = useState(INCIDENT_TYPES[0])
  const [cropId, setCropId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    cropsService.list()
      .then((r) => { if (vivo) setCrops(r) })
      .catch(() => { if (vivo) setCrops([]) })
    return () => { vivo = false }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!subject.trim()) { setError('Escribe un asunto breve.'); return }
    if (description.trim().length < 15) {
      setError('Describe el problema con un poco más de detalle para que te puedan ayudar.')
      return
    }

    setGuardando(true)
    try {
      await onSaved({
        cropId: cropId || undefined,
        type,
        subject: subject.trim(),
        description: description.trim(),
      })
      setSubject(''); setDescription(''); setCropId('')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'No se pudo enviar la solicitud.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Tema de la consulta</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Cultivo relacionado</label>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 bg-white"
          >
            <option value="">No aplica</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.speciesName ? ` · ${c.speciesName}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Asunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3"
            placeholder="En pocas palabras, qué necesitas"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3"
            placeholder="Cuenta qué observaste, desde cuándo, qué has intentado y qué resultado tuviste."
          />
          <p className="mt-1 text-xs text-gray-500">
            Mientras más detalle des, mejor te pueden orientar.
          </p>
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
          {guardando ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  )
}
