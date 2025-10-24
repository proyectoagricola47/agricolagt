type Props = {
  day: string
  icon?: string
  min: number
  max: number
  note?: string
  isToday?: boolean
}

export default function ForecastDayCard({ day, icon = '☀️', min, max, note, isToday = false }: Props) {
  const wrapper = isToday
    ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
    : 'border-gray-200 hover:shadow-sm'

  const dayCls = isToday ? 'text-primary-700 font-semibold' : 'text-gray-700'

  return (
    <div className={`relative rounded-xl border ${wrapper} p-3 text-center transition-shadow`}> 
      {/* Badge Hoy */}
      {isToday && (
        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-primary-600 text-white shadow-sm">Hoy</span>
      )}
      <p className={`text-sm ${dayCls} mb-1`}>{day}</p>
      <div className="text-2xl mb-0.5">{icon}</div>
      <p className="font-semibold text-gray-900">{max}°C <span className="text-gray-400">/ {min}°C</span></p>
      {note && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{note}</p>}
    </div>
  )
}
