import type { AuthorRef } from './user'

export interface Post {
  id: string
  title: string
  excerpt?: string
  content?: string
  images?: string[]
  categories?: string[]
  badge?: string // p.ej. tiempo de lectura "8 min"
  commentsCount?: number
  author: AuthorRef
  status?: 'published' | 'draft'
  createdAt?: string
  updatedAt?: string
}
