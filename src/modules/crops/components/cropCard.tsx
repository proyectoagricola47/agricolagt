import type { Crop } from '../../../model/crop'

type Props = {
  crop: Crop
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function CropCard({ crop, onEdit, onDelete }: Props) {
  const badgeColor =
    crop.status === 'Cosechado'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : crop.status === 'En crecimiento'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : crop.status === 'Sembrado'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {crop.name}{crop.speciesName ? ` · ${crop.speciesName}` : ''}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{crop.type}</p>
          </div>
          <span className={`px-2 py-1 text-xs border rounded-full ${badgeColor}`}>{crop.status}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-gray-500">Área</div>
            <div className="font-medium text-gray-900">{crop.area} {crop.areaUnit}</div>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-gray-500">Siembra</div>
            <div className="font-medium text-gray-900">{crop.sowingDate || '—'}</div>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-gray-500">Cosecha est.</div>
            <div className="font-medium text-gray-900">{crop.expectedHarvestDate || '—'}</div>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="text-gray-500">Ubicación</div>
            <div className="font-medium text-gray-900 truncate" title={crop.location}>{crop.location || '—'}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {onEdit && (
            <button onClick={() => onEdit(crop.id)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">Editar</button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(crop.id)} className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm">Eliminar</button>
          )}
        </div>
      </div>
    </article>
  )
}
