import type { AuthorRef } from './user'

export interface Article {
  id: string
  title: string
  slug?: string
  excerpt?: string
  contentHtml: string
  images?: string[]
  categories?: string[]
  status?: 'published' | 'draft'
  commentsCount?: number
  author: AuthorRef
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}
