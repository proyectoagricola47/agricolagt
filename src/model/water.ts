/** Clase de fuente de agua que el agricultor señala en el mapa. */
export type WaterSourceType =
  | 'rio'
  | 'laguna'
  | 'pozo'
  | 'nacimiento'
  | 'deposito'
  | 'canal'
  | 'otro'

export interface WaterSource {
  id: string
  userId: string
  name: string
  sourceType: WaterSourceType
  lat: number
  lng: number
  createdAt: string
  updatedAt: string
}

export type WaterSourceInput = Omit<
  WaterSource,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>

export const WATER_TYPE_LABEL: Record<WaterSourceType, string> = {
  rio: 'Río',
  laguna: 'Laguna',
  pozo: 'Pozo',
  nacimiento: 'Nacimiento',
  deposito: 'Depósito o pila',
  canal: 'Canal de riego',
  otro: 'Otra fuente',
}

export const WATER_TYPE_ICON: Record<WaterSourceType, string> = {
  rio: '🏞️',
  laguna: '🌊',
  pozo: '🪣',
  nacimiento: '💧',
  deposito: '🛢️',
  canal: '🚧',
  otro: '📍',
}

/** Azul con el que se dibujan estos puntos en el mapa. */
export const WATER_COLOR = '#2563eb'
