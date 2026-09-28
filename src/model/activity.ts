/** Tipo de labor agrícola realizada sobre un cultivo. */
export type ActivityType =
  | 'siembra'
  | 'fertilizacion'
  | 'riego'
  | 'control_plagas'
  | 'poda'
  | 'cosecha'
  | 'otro'

export interface CropActivity {
  id: string
  cropId: string
  userId: string
  activityType: ActivityType
  performedAt: string
  inputName?: string
  quantity?: number
  unit?: string
  cost?: number
  notes?: string
  createdAt: string
}

export type CropActivityInput = Omit<CropActivity, 'id' | 'userId' | 'createdAt'>

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  siembra: 'Siembra',
  fertilizacion: 'Fertilización',
  riego: 'Riego',
  control_plagas: 'Control de plagas',
  poda: 'Poda',
  cosecha: 'Cosecha',
  otro: 'Otra labor',
}

export const ACTIVITY_ICON: Record<ActivityType, string> = {
  siembra: '🌱',
  fertilizacion: '🧪',
  riego: '💧',
  control_plagas: '🐛',
  poda: '✂️',
  cosecha: '🌾',
  otro: '📌',
}

/** Unidades de medida usadas al registrar insumos y volúmenes de riego. */
export const UNIT_OPTIONS: string[] = ['kg', 'qq', 'lb', 'g', 'l', 'ml', 'galones', 'bombadas', 'horas']
