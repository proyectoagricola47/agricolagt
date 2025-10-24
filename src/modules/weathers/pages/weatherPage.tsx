import { useEffect, useMemo, useState } from 'react'
import CurrentWeatherCard from '../components/CurrentWeatherCard'
import ForecastDayCard from '../components/ForecastDayCard'
import AlertsList from '../components/AlertsList'
import TodaySummaryCard from '../components/TodaySummaryCard'
import WeatherMap from '../components/WeatherMap'
import { deriveInsights, geocodeCity, getWeatherAtescatempa, getWeatherByCoords, type WeatherBundle } from '../services/openWeatherService'

const STORAGE_KEY = 'weather:lastLocation'

function dayLabelFromDate(dateISO: string) {
	const d = new Date(dateISO)
	return d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
}

export default function WeatherPage() {
		const [bundle, setBundle] = useState<WeatherBundle | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
		const [place, setPlace] = useState('Atescatempa, GT')
		const [search, setSearch] = useState('')

	useEffect(() => {
		let alive = true
					async function load() {
			try {
				setLoading(true)
									// Restaurar última ubicación si existe
									const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
									if (saved) {
											try {
													const parsed = JSON.parse(saved) as { lat: number; lon: number; name: string }
													const b = await getWeatherByCoords(parsed.lat, parsed.lon)
													if (alive) { setBundle(b); setPlace(parsed.name) }
											} catch {
													const b = await getWeatherAtescatempa()
													if (alive) { setBundle(b); setPlace('Atescatempa, GT') }
											}
									} else {
											const b = await getWeatherAtescatempa()
											if (alive) { setBundle(b); setPlace('Atescatempa, GT') }
									}
			} catch (e: any) {
				console.error(e)
				if (alive) setError('No se pudo obtener el clima de OpenWeather')
			} finally {
				if (alive) setLoading(false)
			}
		}
		load()
		return () => { alive = false }
	}, [])

			async function changeLocationByCoords(lat: number, lon: number) {
			try {
				setLoading(true)
				const b = await getWeatherByCoords(lat, lon)
				setBundle(b)
									const name = `${lat.toFixed(3)}, ${lon.toFixed(3)}`
									setPlace(name)
									// Persistir ubicación
									try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lon, name })) } catch {}
				setError(null)
			} catch (e) {
				console.error(e)
				setError('No se pudo cambiar la ubicación')
			} finally {
				setLoading(false)
			}
		}

			async function changeLocationBySearch() {
			if (!search.trim()) return
			try {
				setLoading(true)
				const g = await geocodeCity(search.trim())
				if (!g) { setError('No se encontró la ubicación'); setLoading(false); return }
				const b = await getWeatherByCoords(g.lat, g.lon)
				setBundle(b)
									setPlace(g.name)
									// Persistir ubicación
									try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: g.lat, lon: g.lon, name: g.name })) } catch {}
				setError(null)
			} catch (e) {
				console.error(e)
				setError('No se pudo cambiar la ubicación')
			} finally {
				setLoading(false)
			}
		}

	const alerts = useMemo(() => (bundle ? deriveInsights(bundle) : []), [bundle])

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
							{/* Selector de ubicación */}
							<div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
								<div className="text-sm text-gray-600">Ubicación actual: <span className="font-medium text-gray-900">{place}</span></div>
								<div className="flex items-center gap-2">
									<input
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Buscar ciudad (ej. Jutiapa, GT)"
										className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm"
									/>
									<button onClick={changeLocationBySearch} className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 text-sm">Cambiar</button>
								</div>
								<div className="text-xs text-gray-500">Sugerencia: también puedes hacer clic en el mapa para cambiar temporalmente.</div>
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
															<WeatherMap center={bundle.coords} onSelectLocation={(c) => changeLocationByCoords(c.lat, c.lon)} />
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
