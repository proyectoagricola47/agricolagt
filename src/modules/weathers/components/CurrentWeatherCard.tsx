type Detail = { label: string; value: string; icon?: 'feels' | 'humidity' | 'wind' | 'uv' }

type Props = {
  tempC: number
  summary: string
  details: Detail[]
  /**
   * Variante compacta enfocada en lo agrícola: muestra solo Humedad, Viento y UV
   * y mejora la legibilidad de los valores.
   */
  variant?: 'default' | 'compact'
}

function Icon({ name }: { name: Detail['icon'] }) {
  const base = 'w-4 h-4 text-gray-500'
  switch (name) {
    case 'feels':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v8" />
          <circle cx="12" cy="16" r="5" />
        </svg>
      )
    case 'humidity':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z" />
        </svg>
      )
    case 'wind':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h10a3 3 0 1 0-3-3" />
          <path d="M2 18h14a3 3 0 1 1-3 3" />
        </svg>
      )
    case 'uv':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      )
    default:
      return null
  }
}

export default function CurrentWeatherCard({ tempC, summary, details, variant = 'default' }: Props) {
  const visibleDetails =
    variant === 'compact'
      ? details.filter((d) => ['humidity', 'wind', 'uv'].includes(String(d.icon)))
      : details
  return (
    <section className="rounded-2xl border border-gray-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 grid place-items-center rounded-full bg-white border border-gray-200">⛅</div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Clima Actual</p>
            <p className="text-gray-600 -mt-0.5">{summary}</p>
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-extrabold text-gray-900">{Math.round(tempC)}°C</div>
      </div>
      {variant === 'compact' ? (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-3">
          {visibleDetails.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center border border-emerald-100">
                <Icon name={d.icon} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">{d.value}</div>
                <div className="text-[11px] text-gray-500">{d.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {visibleDetails.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <Icon name={d.icon} />
              <span className="text-gray-500">{d.label}:</span>
              <span className="font-medium text-gray-800">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
