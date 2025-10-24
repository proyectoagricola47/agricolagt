import { dewPointC, suggestOperationWindows, type WeatherBundle } from '../services/openWeatherService'

type Props = {
  bundle: WeatherBundle
}

function fmtHour(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function TodaySummaryCard({ bundle }: Props) {
  const today = bundle.daily[0]
  const dp = dewPointC(bundle.current.tempC, bundle.current.humidity)
  const rainMm = typeof today?.rainMm === 'number' ? today.rainMm : undefined
  const popPct = Math.round((today?.pop || 0) * 100)

  const windows = suggestOperationWindows(bundle.hourly)

  // "Radar" textual: bloques horarios donde pop >= 60%
  const risky: { start: string; end: string }[] = []
  if (bundle.hourly?.length) {
    const hourly = bundle.hourly.slice(0, 12) // próximas 12h
    let i = 0
    while (i < hourly.length) {
      if ((hourly[i].pop || 0) < 0.6) { i++; continue }
      const start = i
      while (i < hourly.length && (hourly[i].pop || 0) >= 0.6) i++
      const end = i - 1
      risky.push({ start: hourly[start].date, end: hourly[end].date })
    }
  }

  const comfort = dp >= 18 ? 'Bochornoso' : dp <= 10 ? 'Seco/fresco' : 'Confort moderado'

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Hoy en Atescatempa</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Prob. de lluvia</div>
          <div className="text-2xl font-extrabold text-gray-900">{popPct}%</div>
          <div className="text-xs text-gray-500">{rainMm !== undefined ? `Lluvia estimada: ${Math.round(rainMm)} mm` : '—'}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Punto de rocío</div>
          <div className="text-2xl font-extrabold text-gray-900">{dp}°C</div>
          <div className="text-xs text-gray-500">{comfort}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Ventanas sugeridas</div>
          {windows.length ? (
            <ul className="mt-1 text-sm text-gray-800 space-y-1">
              {windows.slice(0,2).map((w, i) => (
                <li key={i}>{fmtHour(w.start)}–{fmtHour(w.end)}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-sm text-gray-500">Sin ventanas ideales próximas</div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-900 mb-1">Radar textual (próximas horas)</div>
        {risky.length ? (
          <ul className="text-sm text-gray-700 list-disc ml-5">
            {risky.map((r, i) => (
              <li key={i}>Lluvias probables entre {fmtHour(r.start)} y {fmtHour(r.end)}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Sin franjas con lluvia probable (&ge; 60%) en próximas 12 horas.</div>
        )}
      </div>
    </section>
  )
}
