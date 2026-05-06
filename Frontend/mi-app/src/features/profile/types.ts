export interface ProfileData {
  id: number
  email?: string
  full_name?: string
  interests?: string[]
  career?: string
  cycle?: number
  availability?: number
  followers_count: number
  following_count: number
  posts_count: number
  role_name?: string
}

export interface PostItem {
  id: number
  /** Autor del post (necesario para habilitar acciones en guardados). */
  user_id?: number
  /** Imagen principal (si backend la expone en listados). */
  image_url?: string
  /** Conteo de imágenes (si backend la expone en listados). */
  images_count?: number
  title?: string
  description: string
  post_type: string
  subtype?: string
  status: string
  time_status?: string
  tags?: string[]
  deadline_at?: string
  created_at: string
}

export interface FollowerItem {
  user_id: number
  full_name?: string
  email: string
  followed_at: string
}

export type ProfileTab = 'posts' | 'saved' | 'archived'
