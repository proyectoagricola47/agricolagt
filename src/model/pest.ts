/** Severidad con la que el agricultor califica la presencia de la plaga. */
export type PestSeverity = 'baja' | 'media' | 'alta'

/** Situación en que se encuentra el reporte. */
export type PestStatus = 'activa' | 'controlada' | 'erradicada'

export interface PestReport {
  id: string
  userId: string
  cropId?: string
  cropName?: string
  pestType: string
  severity: PestSeverity
  detectedAt: string
  status: PestStatus
  location?: string
  lat?: number
  lng?: number
  photoUrl?: string
  treatment?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type PestReportInput = Omit<
  PestReport,
  'id' | 'userId' | 'cropName' | 'createdAt' | 'updatedAt'
>

export const SEVERITY_LABEL: Record<PestSeverity, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const STATUS_LABEL: Record<PestStatus, string> = {
  activa: 'Activa',
  controlada: 'Controlada',
  erradicada: 'Erradicada',
}

/** Color con que se representa cada severidad, en la lista y en el mapa. */
export const SEVERITY_COLOR: Record<PestSeverity, string> = {
  baja: '#16a34a',
  media: '#d97706',
  alta: '#dc2626',
}

/**
 * Plagas y enfermedades frecuentes en los cultivos del municipio.
 * El formulario permite escribir una distinta si no aparece en la lista.
 */
export const PEST_OPTIONS: string[] = [
  'Gusano cogollero',
  'Gallina ciega',
  'Mosca blanca',
  'Pulgón',
  'Ácaro rojo',
  'Trips',
  'Picudo del chile',
  'Barrenador del tallo',
  'Chinche salivosa',
  'Langosta',
  'Hormiga arriera',
  'Nematodos',
  'Roya',
  'Mildiu',
  'Antracnosis',
  'Tizón tardío',
]
