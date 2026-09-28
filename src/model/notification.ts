export type NotificationSeverity = 'low' | 'medium' | 'high'

export interface AppNotification {
  id: string
  userId: string
  title: string
  body?: string
  type?: string
  severity?: NotificationSeverity
  read: boolean
  createdAt: string
}
