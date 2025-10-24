import type { Alert } from '../../../model/weather'

type Props = { alerts: Alert[] }

export default function AlertsList({ alerts }: Props) {
  if (!alerts?.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-sm text-gray-500">
        Sin alertas destacadas.
      </div>
    )
  }

  const colorBy = (s: Alert['severity']) =>
    s === 'high'
      ? 'border-red-300 bg-red-50/80'
      : s === 'medium'
      ? 'border-amber-300 bg-amber-50/80'
      : 'border-emerald-300 bg-emerald-50/80'

  const iconBy = (s: Alert['severity']) =>
    s === 'high' ? '⚠️' : s === 'medium' ? '🟡' : '✅'

  return (
    <ul className="space-y-3">
      {alerts.map((a, i) => (
        <li key={i} className={`rounded-xl border ${colorBy(a.severity)} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none" aria-hidden>{iconBy(a.severity)}</span>
              <h4 className="font-semibold text-gray-900">{a.title}</h4>
            </div>
            {a.tags && (
              <div className="flex flex-wrap gap-2">
                {a.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-gray-300 bg-white text-gray-700">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-700">{a.description}</p>
        </li>
      ))}
    </ul>
  )
}
