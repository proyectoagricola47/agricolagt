export type AreaUnit = 'ha' | 'mz' | 'm2'

export type CropStatus = 'Sembrado' | 'En crecimiento' | 'Cosechado' | 'Pausado'

export interface Crop {
  id: string
  userId: string
  name: string
  type: string
  speciesId?: string
  speciesName?: string
  area: number
  areaUnit: AreaUnit
  status: CropStatus
  sowingDate?: string
  expectedHarvestDate?: string
  location?: string
  notes?: string
  createdAt: string
  updatedAt: string
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
