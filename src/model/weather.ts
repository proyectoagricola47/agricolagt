export type Alert = {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  tags?: string[]
}

export type WeatherDetail = {
  label: string
  value: string
  icon?: 'feels' | 'humidity' | 'wind' | 'uv'
}
