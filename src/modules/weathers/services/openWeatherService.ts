const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string

// Control de capacidad: desactivar One Call 3.0 si no hay suscripción
const LS_ONECALL = 'ow:onecall'
let ONECALL_ENABLED = true
try {
  if (typeof window !== 'undefined') {
    const v = localStorage.getItem(LS_ONECALL)
    if (v === '0') ONECALL_ENABLED = false
  }
} catch {}
function disableOneCall() {
  ONECALL_ENABLED = false
  try { if (typeof window !== 'undefined') localStorage.setItem(LS_ONECALL, '0') } catch {}
}

export type CurrentWeather = {
  tempC: number
  summary: string
  humidity: number
  windKmh: number
  uvi?: number
  feelsC?: number
}

export type DailyForecast = {
  date: string // ISO
  min: number
  max: number
  pop: number // probabilidad de precipitación 0..1
  description?: string
  icon?: string
  rainMm?: number
  uvi?: number
}

export type HourlyForecast = {
  date: string // ISO
  tempC: number
  pop: number
  rainMm?: number
  windKmh?: number
  gustKmh?: number
  humidity?: number
}

export type WeatherBundle = {
  current: CurrentWeather
  daily: DailyForecast[]
  hourly?: HourlyForecast[]
  coords: { lat: number; lon: number }
}

const CITY_ID_ATESCATEMPA = 3599633

function kToC(k: number) { return Math.round((k - 273.15) * 10) / 10 }
function mpsToKmh(mps: number) { return Math.round(mps * 3.6) }

export async function fetchCurrentByCityId(cityId = CITY_ID_ATESCATEMPA): Promise<{
  lat: number; lon: number; current: CurrentWeather
}> {
  if (!API_KEY) throw new Error('Falta VITE_OPENWEATHER_KEY')
  const url = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather current request failed')
  const json = await res.json()
  const tempC = kToC(json.main.temp)
  const feelsC = kToC(json.main.feels_like)
  const humidity = json.main.humidity
  const windKmh = mpsToKmh(json.wind.speed)
  const summary = (json.weather?.[0]?.description || '').replace(/^./, (c: string) => c.toUpperCase())
  const lat = json.coord.lat
  const lon = json.coord.lon
  return { lat, lon, current: { tempC, summary, humidity, windKmh, feelsC } }
}

export async function fetchOneCallDaily(lat: number, lon: number): Promise<DailyForecast[]> {
  if (!ONECALL_ENABLED) throw new Error('ONECALL_DISABLED')
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (res.status === 401 || res.status === 403) { disableOneCall(); throw new Error('ONECALL_UNAUTHORIZED') }
  if (!res.ok) throw new Error('OneCall request failed')
  const json = await res.json()
  const daily: DailyForecast[] = (json.daily || []).slice(0, 7).map((d: any) => ({
    date: new Date(d.dt * 1000).toISOString(),
    min: kToC(d.temp.min),
    max: kToC(d.temp.max),
    pop: typeof d.pop === 'number' ? d.pop : 0,
    description: d.weather?.[0]?.description,
    icon: d.weather?.[0]?.icon,
    rainMm: d.rain,
    uvi: d.uvi,
  }))
  return daily
}

export async function fetchOneCallHourly(lat: number, lon: number): Promise<HourlyForecast[]> {
  if (!ONECALL_ENABLED) throw new Error('ONECALL_DISABLED')
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (res.status === 401 || res.status === 403) { disableOneCall(); throw new Error('ONECALL_UNAUTHORIZED') }
  if (!res.ok) throw new Error('OneCall hourly request failed')
  const json = await res.json()
  const hourly: HourlyForecast[] = (json.hourly || []).slice(0, 24).map((h: any) => ({
    date: new Date(h.dt * 1000).toISOString(),
    tempC: kToC(h.temp),
    pop: typeof h.pop === 'number' ? h.pop : 0,
    rainMm: h.rain?.['1h'],
    windKmh: mpsToKmh(h.wind_speed || 0),
    gustKmh: mpsToKmh(h.wind_gust || 0),
    humidity: h.humidity,
  }))
  return hourly
}

async function fetchOneCallBundle(lat: number, lon: number): Promise<WeatherBundle> {
  if (!ONECALL_ENABLED) throw new Error('ONECALL_DISABLED')
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (res.status === 401 || res.status === 403) { disableOneCall(); throw new Error('ONECALL_UNAUTHORIZED') }
  if (!res.ok) throw new Error('OneCall bundle request failed')
  const json = await res.json()
  const current: CurrentWeather = {
    tempC: kToC(json.current?.temp),
    summary: (json.current?.weather?.[0]?.description || 'Condición actual').replace(/^./, (c: string) => c.toUpperCase()),
    humidity: json.current?.humidity ?? 0,
    windKmh: mpsToKmh(json.current?.wind_speed || 0),
    uvi: json.current?.uvi,
    feelsC: json.current?.feels_like ? kToC(json.current.feels_like) : undefined,
  }
  const daily: DailyForecast[] = (json.daily || []).slice(0, 7).map((d: any) => ({
    date: new Date(d.dt * 1000).toISOString(),
    min: kToC(d.temp.min),
    max: kToC(d.temp.max),
    pop: typeof d.pop === 'number' ? d.pop : 0,
    description: d.weather?.[0]?.description,
    icon: d.weather?.[0]?.icon,
    rainMm: d.rain,
    uvi: d.uvi,
  }))
  const hourly: HourlyForecast[] = (json.hourly || []).slice(0, 24).map((h: any) => ({
    date: new Date(h.dt * 1000).toISOString(),
    tempC: kToC(h.temp),
    pop: typeof h.pop === 'number' ? h.pop : 0,
    rainMm: h.rain?.['1h'],
    windKmh: mpsToKmh(h.wind_speed || 0),
    gustKmh: mpsToKmh(h.wind_gust || 0),
    humidity: h.humidity,
  }))
  return { current, daily, hourly, coords: { lat, lon } }
}

export async function fetchForecast5dDailyApprox(cityId = CITY_ID_ATESCATEMPA): Promise<DailyForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Forecast request failed')
  const json = await res.json()
  // Agrupar por día
  const byDate: Record<string, { min: number; max: number; popMax: number; desc?: string; icon?: string }> = {}
  for (const it of json.list || []) {
    const date = new Date(it.dt * 1000)
    const dayKey = date.toISOString().slice(0, 10)
    const tempC = kToC(it.main.temp)
    const pop = it.pop || 0
    const desc = it.weather?.[0]?.description
    const icon = it.weather?.[0]?.icon
    if (!byDate[dayKey]) byDate[dayKey] = { min: tempC, max: tempC, popMax: pop, desc, icon }
    else {
      byDate[dayKey].min = Math.min(byDate[dayKey].min, tempC)
      byDate[dayKey].max = Math.max(byDate[dayKey].max, tempC)
      byDate[dayKey].popMax = Math.max(byDate[dayKey].popMax, pop)
      if (!byDate[dayKey].desc && desc) byDate[dayKey].desc = desc
      if (!byDate[dayKey].icon && icon) byDate[dayKey].icon = icon
    }
  }
  const days = Object.entries(byDate)
    .slice(0, 7)
    .map(([day, v]) => ({ date: day + 'T12:00:00.000Z', min: v.min, max: v.max, pop: v.popMax, description: v.desc, icon: v.icon }))
  return days
}

export async function fetchForecast5dHourlyApprox(cityId = CITY_ID_ATESCATEMPA): Promise<HourlyForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Forecast request failed')
  const json = await res.json()
  const out: HourlyForecast[] = (json.list || []).slice(0, 8).map((it: any) => ({
    date: new Date(it.dt * 1000).toISOString(),
    tempC: kToC(it.main.temp),
    pop: it.pop || 0,
    rainMm: it.rain?.['3h'],
    windKmh: mpsToKmh(it.wind?.speed || 0),
    gustKmh: mpsToKmh(it.wind?.gust || 0),
    humidity: it.main.humidity,
  }))
  return out
}

// Versiones por coordenadas (gratuitas)
export async function fetchForecast5dDailyApproxByCoords(lat: number, lon: number): Promise<DailyForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Forecast request failed')
  const json = await res.json()
  const byDate: Record<string, { min: number; max: number; popMax: number; desc?: string; icon?: string }> = {}
  for (const it of json.list || []) {
    const date = new Date(it.dt * 1000)
    const dayKey = date.toISOString().slice(0, 10)
    const tempC = kToC(it.main.temp)
    const pop = it.pop || 0
    const desc = it.weather?.[0]?.description
    const icon = it.weather?.[0]?.icon
    if (!byDate[dayKey]) byDate[dayKey] = { min: tempC, max: tempC, popMax: pop, desc, icon }
    else {
      byDate[dayKey].min = Math.min(byDate[dayKey].min, tempC)
      byDate[dayKey].max = Math.max(byDate[dayKey].max, tempC)
      byDate[dayKey].popMax = Math.max(byDate[dayKey].popMax, pop)
      if (!byDate[dayKey].desc && desc) byDate[dayKey].desc = desc
      if (!byDate[dayKey].icon && icon) byDate[dayKey].icon = icon
    }
  }
  const days = Object.entries(byDate)
    .slice(0, 7)
    .map(([day, v]) => ({ date: day + 'T12:00:00.000Z', min: v.min, max: v.max, pop: v.popMax, description: v.desc, icon: v.icon }))
  return days
}

export async function fetchForecast5dHourlyApproxByCoords(lat: number, lon: number): Promise<HourlyForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=es`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Forecast request failed')
  const json = await res.json()
  const out: HourlyForecast[] = (json.list || []).slice(0, 8).map((it: any) => ({
    date: new Date(it.dt * 1000).toISOString(),
    tempC: kToC(it.main.temp),
    pop: it.pop || 0,
    rainMm: it.rain?.['3h'],
    windKmh: mpsToKmh(it.wind?.speed || 0),
    gustKmh: mpsToKmh(it.wind?.gust || 0),
    humidity: it.main.humidity,
  }))
  return out
}

export async function getWeatherAtescatempa(): Promise<WeatherBundle> {
  const { lat, lon, current } = await fetchCurrentByCityId(CITY_ID_ATESCATEMPA)
  try {
    if (ONECALL_ENABLED) {
      const [daily, hourly] = await Promise.all([
        fetchOneCallDaily(lat, lon),
        fetchOneCallHourly(lat, lon).catch(() => fetchForecast5dHourlyApproxByCoords(lat, lon)),
      ])
      return { current, daily, hourly, coords: { lat, lon } }
    }
    throw new Error('ONECALL_DISABLED')
  } catch (e) {
    // Fallback si OneCall no está habilitado en el plan
    const [daily, hourly] = await Promise.all([
      fetchForecast5dDailyApproxByCoords(lat, lon),
      fetchForecast5dHourlyApproxByCoords(lat, lon),
    ])
    return { current, daily, hourly, coords: { lat, lon } }
  }
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherBundle> {
  try {
    if (ONECALL_ENABLED) return await fetchOneCallBundle(lat, lon)
    throw new Error('ONECALL_DISABLED')
  } catch (e) {
    // Fallback: usar Forecast para daily/hourly y current básico desde weather por coords
    const urlCur = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=es`
    const res = await fetch(urlCur)
    if (!res.ok) throw new Error('Weather current by coords failed')
    const j = await res.json()
    const current: CurrentWeather = {
      tempC: kToC(j.main.temp),
      summary: (j.weather?.[0]?.description || '').replace(/^./, (c: string) => c.toUpperCase()),
      humidity: j.main.humidity,
      windKmh: mpsToKmh(j.wind.speed || 0),
      feelsC: kToC(j.main.feels_like),
    }
    const [daily, hourly] = await Promise.all([
      fetchForecast5dDailyApproxByCoords(lat, lon),
      fetchForecast5dHourlyApproxByCoords(lat, lon),
    ])
    return { current, daily, hourly, coords: { lat, lon } }
  }
}

export async function geocodeCity(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  if (!query || !query.trim()) return null
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const arr = await res.json()
  const it = arr?.[0]
  if (!it) return null
  return { lat: it.lat, lon: it.lon, name: [it.name, it.state, it.country].filter(Boolean).join(', ') }
}

export type Insight = { title: string; description: string; severity: 'low' | 'medium' | 'high'; tags?: string[] }

export function deriveInsights(bundle: WeatherBundle): Insight[] {
  const out: Insight[] = []
  const next3 = bundle.daily.slice(0, 3)
  const popMax = Math.max(...next3.map(d => d.pop || 0), 0)
  const rainMmNext = bundle.daily.slice(0, 2).reduce((sum, d) => sum + (d.rainMm || 0), 0)
  if (popMax >= 0.7 || rainMmNext >= 20) {
    out.push({
      title: 'Riesgo de lluvias intensas',
      description: 'Alta probabilidad de lluvias en los próximos días. Considera proteger cultivos y revisar drenajes.',
      severity: popMax >= 0.85 || rainMmNext >= 35 ? 'high' : 'medium',
      tags: ['Maíz', 'Frijol']
    })
  }
  const hotMax = Math.max(...bundle.daily.slice(0, 5).map(d => d.max || 0), bundle.current.tempC)
  if (hotMax >= 32) {
    out.push({
      title: 'Ola de calor probable',
      description: 'Temperaturas elevadas previstas. Vigila riego y estrés hídrico; evitar labores en horas de máximo sol.',
      severity: hotMax >= 36 ? 'high' : 'medium',
      tags: ['Hortalizas']
    })
  }
  const uviMax = Math.max(...bundle.daily.map(d => d.uvi || 0), bundle.current.uvi || 0)
  if (uviMax >= 7) {
    out.push({
      title: 'Índice UV alto',
      description: 'Radiación alta. Usa protección en campo y evita exposición prolongada al mediodía.',
      severity: 'medium',
    })
  }
  // Viento/rachas para tratamientos (evitar aspersiones)
  const gustMax = Math.max(...(bundle.hourly || []).map(h => h.gustKmh || 0), 0)
  if (gustMax >= 35) {
    out.push({
      title: 'Rachas de viento',
      description: 'Rachas considerables previstas. Evita aspersiones y labores que dependan de baja deriva.',
      severity: gustMax >= 50 ? 'high' : 'medium',
    })
  }
  // Humedad baja (sequedad ambiental)
  const minHumidity = Math.min(...(bundle.hourly || []).map(h => h.humidity ?? 100))
  if (minHumidity <= 35) {
    out.push({
      title: 'Humedad ambiental baja',
      description: 'Ambiente seco. Refuerza riego y monitorea estrés hídrico en cultivos sensibles.',
      severity: 'medium',
    })
  }
  // Sequía prolongada: próximos 7 días con poca o nula lluvia
  const noRainDays = bundle.daily.slice(0, 7).filter(d => (d.rainMm || 0) < 1 && (d.pop || 0) < 0.2).length
  if (noRainDays >= 5) {
    out.push({
      title: 'Sequía probable',
      description: 'Poca o nula precipitación en los próximos días. Planifica riego y conserva humedad del suelo.',
      severity: 'medium',
    })
  }
  return out
}

// Cálculo de punto de rocío (Magnus-Tetens aprox.)
export function dewPointC(tempC: number, humidityPct: number): number {
  const a = 17.27
  const b = 237.7
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidityPct / 100)
  const dp = (b * alpha) / (a - alpha)
  return Math.round(dp * 10) / 10
}

// Ventana sugerida para fertilización/aplicación (baja deriva):
// criterios: viento < 15 km/h, humedad 50-85%, baja probabilidad de lluvia (<40%) en próximas 6h
export function suggestOperationWindows(hourly?: HourlyForecast[]): { start: string; end: string }[] {
  if (!hourly?.length) return []
  const ok = hourly.slice(0, 12).map(h => {
    const windOk = (h.windKmh || 0) < 15
    const humOk = (h.humidity ?? 60) >= 50 && (h.humidity ?? 60) <= 85
    const rainOk = (h.pop || 0) < 0.4
    return windOk && humOk && rainOk
  })
  const res: { start: string; end: string }[] = []
  let i = 0
  while (i < ok.length) {
    if (!ok[i]) { i++; continue }
    const start = i
    while (i < ok.length && ok[i]) i++
    const end = i - 1
    res.push({ start: hourly[start].date, end: hourly[end].date })
  }
  return res
}
