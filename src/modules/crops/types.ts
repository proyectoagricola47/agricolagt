export type AreaUnit = 'ha' | 'mz' | 'm2'

export type CropStatus = 'Sembrado' | 'En crecimiento' | 'Cosechado' | 'Pausado'

export interface Crop {
  id: string
  userId: string
  name: string // Nombre o alias del lote/cultivo
  type: string // Tipo de cultivo registrado (ej. Grano, Hortaliza)
  speciesId?: string
  speciesName?: string
  area: number
  areaUnit: AreaUnit
  status: CropStatus
  sowingDate?: string // ISO date
  expectedHarvestDate?: string // ISO date
  location?: string
  notes?: string
  createdAt: string // ISO date
  updatedAt: string // ISO date
}

export type CropInput = Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>

export const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  ha: 'ha',
  mz: 'mz',
  m2: 'm²',
}

export const STATUS_LABEL: Record<CropStatus, string> = {
  'Sembrado': 'Sembrado',
  'En crecimiento': 'En crecimiento',
  'Cosechado': 'Cosechado',
  'Pausado': 'Pausado',
}
