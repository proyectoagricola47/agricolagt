/** Calidad con que se clasifica el producto cosechado. */
export type HarvestQuality = 'primera' | 'segunda' | 'tercera'

export interface Harvest {
  id: string
  cropId: string
  cropName?: string
  userId: string
  season: string
  harvestDate: string
  quantity: number
  unit: string
  quality?: HarvestQuality
  income?: number
  notes?: string
  createdAt: string
}

export type HarvestInput = Omit<Harvest, 'id' | 'userId' | 'cropName' | 'createdAt'>

export const QUALITY_LABEL: Record<HarvestQuality, string> = {
  primera: 'Primera',
  segunda: 'Segunda',
  tercera: 'Tercera',
}

/** Unidades con que se pesa o cuenta la cosecha. */
export const HARVEST_UNITS: string[] = ['qq', 'kg', 'lb', 'cajas', 'sacos', 'redes', 'docenas', 'unidades']

/**
 * Nombre de temporada sugerido a partir de una fecha.
 * En Guatemala la primera va de mayo a agosto y la segunda,
 * llamada de postrera, de septiembre a diciembre.
 */
export function temporadaSugerida(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear()
  const mes = fecha.getMonth() + 1
  if (mes >= 5 && mes <= 8) return `Primera ${anio}`
  if (mes >= 9 && mes <= 12) return `Postrera ${anio}`
  return `Verano ${anio}`
}
