import type { AuthorRef } from './user'

export interface Comment {
  id: string
  postId: string
  author: AuthorRef
  text: string
  createdAt: string
}
