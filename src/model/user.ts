export type UserId = string

export interface UserProfile {
  id: UserId
  email?: string
  name: string
  avatarUrl?: string
  location?: string
  role?: 'admin' | 'editor' | 'user'
  createdAt?: string
  updatedAt?: string
}

export type AuthorRef = Pick<UserProfile, 'id' | 'name' | 'avatarUrl'>
