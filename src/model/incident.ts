/** Situación en que se encuentra la incidencia. */
export type IncidentStatus = 'abierta' | 'en_proceso' | 'cerrada'

export interface Incident {
  id: string
  userId: string
  authorName?: string
  authorPhone?: string
  cropId?: string
  cropName?: string
  type: string
  subject: string
  description: string
  status: IncidentStatus
  assignedTo?: string
  assignedName?: string
  response?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export type IncidentInput = {
  cropId?: string
  type: string
  subject: string
  description: string
}

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  cerrada: 'Cerrada',
}

export const INCIDENT_STATUS_STYLE: Record<IncidentStatus, string> = {
  abierta: 'bg-amber-50 text-amber-800 border-amber-200',
  en_proceso: 'bg-blue-50 text-blue-800 border-blue-200',
  cerrada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

/** Motivos por los que un agricultor pide asistencia técnica. */
export const INCIDENT_TYPES: string[] = [
  'Plaga o enfermedad',
  'Riego y agua',
  'Suelo y fertilización',
  'Semilla y siembra',
  'Cosecha y almacenamiento',
  'Comercialización',
  'Uso de la aplicación',
  'Otro',
]
