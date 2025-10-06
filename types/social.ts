export interface UserProfile {
  id: string
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  portfolio_id: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // Joined data
  user_profile?: UserProfile
  portfolio?: {
    id: string
    name: string
    stocks: Array<{ symbol: string; weight: number }>
    total_amount: number
  }
  user_has_liked?: boolean
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user_profile?: UserProfile
}

