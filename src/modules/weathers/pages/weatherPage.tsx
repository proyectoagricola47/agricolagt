import { useEffect, useMemo, useState } from 'react'
import CurrentWeatherCard from '../components/CurrentWeatherCard'
import ForecastDayCard from '../components/ForecastDayCard'
import AlertsList from '../components/AlertsList'
import TodaySummaryCard from '../components/TodaySummaryCard'
import WeatherMap from '../components/WeatherMap'
import { deriveInsights, getWeatherAtescatempa, type WeatherBundle } from '../services/openWeatherService'
import { procesarAlertas } from '../../notifications/services/notificationService'

/**
 * Clave que usaban las versiones anteriores para recordar la última
 * ubicación consultada. Se conserva únicamente para borrarla, de modo que
 * los dispositivos que quedaron fijados en otra ciudad vuelvan al municipio.
 */
const CLAVE_UBICACION_ANTIGUA = 'weather:lastLocation'

/** El sistema trabaja sobre Atescatempa, Jutiapa, que es su ámbito de estudio. */
const MUNICIPIO = 'Atescatempa, GT'

function dayLabelFromDate(dateISO: string) {
	const d = new Date(dateISO)
	return d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
}

export default function WeatherPage() {
		const [bundle, setBundle] = useState<WeatherBundle | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
		const place = MUNICIPIO

	useEffect(() => {
		let alive = true
		async function load() {
			try {
				setLoading(true)
				// Se borra la ubicación que hubieran guardado las versiones anteriores.
				try { localStorage.removeItem(CLAVE_UBICACION_ANTIGUA) } catch { /* almacenamiento bloqueado */ }
				const b = await getWeatherAtescatempa()
				if (alive) setBundle(b)
			} catch (e: any) {
				console.error(e)
				if (alive) setError('No se pudo obtener el clima de Atescatempa')
			} finally {
				if (alive) setLoading(false)
			}
		}
		load()
		return () => { alive = false }
	}, [])



	const alerts = useMemo(() => (bundle ? deriveInsights(bundle) : []), [bundle])

	// Registra y notifica las alertas relevantes del clima consultado
	useEffect(() => {
		if (!alerts.length) return
		procesarAlertas(alerts).catch(console.error)
	}, [alerts])

	return (
		<div className="pb-16">
			<h1 className="text-3xl font-extrabold text-center mb-6">Clima y Alertas Agrícolas</h1>

			{loading && (
				<div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">Cargando…</div>
			)}
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
			)}

					{bundle && (
				<>
							{/* Ámbito del sistema: el municipio de estudio */}
							<div className="mb-4 text-sm text-gray-600">
								Condiciones y alertas de <span className="font-medium text-gray-900">{place}</span>,
								que es el municipio al que da servicio la aplicación.
							</div>
					<CurrentWeatherCard
						tempC={bundle.current.tempC}
						summary={bundle.current.summary}
						details={[
							{ label: 'Sensación', value: `${Math.round(bundle.current.feelsC || bundle.current.tempC)}°C`, icon: 'feels' },
							{ label: 'Humedad', value: `${bundle.current.humidity}%`, icon: 'humidity' },
							{ label: 'Viento', value: `${bundle.current.windKmh} km/h`, icon: 'wind' },
							{ label: 'Índice UV', value: bundle.current.uvi ? String(bundle.current.uvi) : '—', icon: 'uv' },
						]}
					/>

								<section className="mt-8">
						<h2 className="text-xl font-semibold mb-3">Alertas destacadas</h2>
						<AlertsList alerts={alerts} />
					</section>

								<section className="mt-8">
									<TodaySummaryCard bundle={bundle} />
								</section>

											<section className="mt-8">
												<h2 className="text-xl font-semibold mb-3">Mapa meteorológico</h2>
															<WeatherMap center={bundle.coords} />
											</section>

					<section className="mt-8">
						<h2 className="text-xl font-semibold mb-3">Pronóstico extendido (7 días)</h2>
						<div className="-mx-4 sm:mx-0 overflow-x-auto pb-2">
							<div className="px-4 sm:px-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 min-w-[540px] sm:min-w-0">
												{bundle.daily.map((d) => (
									<ForecastDayCard
										key={d.date}
										day={dayLabelFromDate(d.date).replace(/^./, c => c.toUpperCase())}
										min={Math.round(d.min)}
										max={Math.round(d.max)}
										note={d.description || (d.pop >= 0.6 ? 'Lluvias probables' : '—')}
										isToday={new Date(d.date).toDateString() === new Date().toDateString()}
									/>
								))}
							</div>
						</div>
					</section>
				</>
			)}
		</div>
	)
}
