// Types for Stock Rooms System - Community chat per ticker

export interface StockRoom {
  id: string;
  symbol: string;
  
  // Cached stock metadata
  company_name: string | null;
  logo_url: string | null;
  current_price: number | null;
  price_change_pct: number | null;
  last_price_update: string | null;
  
  // Room statistics
  total_messages: number;
  total_members: number;
  active_members_24h: number;
  
  // Timestamps
  created_at: string;
  last_message_at: string | null;
  updated_at: string;
}

export interface StockRoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  
  // Content
  content: string;
  message_type: 'text' | 'image' | 'link';
  
  // Engagement
  likes_count: number;
  
  // Moderation
  is_edited: boolean;
  deleted_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string | null;
  
  // Joined data (from queries)
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url: string | null;
  };
  
  // User-specific data
  is_liked_by_me?: boolean;
}

export interface StockRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  
  // User preferences
  is_favorite: boolean;
  notifications_enabled: boolean;
  
  // Activity tracking
  last_read_message_id: string | null;
  last_seen_at: string;
  joined_at: string;
  
  // Moderation
  is_muted: boolean;
  is_banned: boolean;
  
  // Joined data (from queries)
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  room?: StockRoom;
}

export interface StockRoomMessageLike {
  message_id: string;
  user_id: string;
  created_at: string;
}

// Extended types with joined data
export interface StockRoomWithStats extends StockRoom {
  is_member: boolean;
  is_favorite: boolean;
  unread_count: number;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    user: {
      username: string;
    };
  };
}

export interface TrendingRoom {
  id: string;
  symbol: string;
  company_name: string | null;
  current_price: number | null;
  price_change_pct: number | null;
  total_messages: number;
  active_members_24h: number;
  last_message_at: string | null;
}

// Request/Response types for API
export interface CreateMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'link';
}

export interface GetMessagesRequest {
  limit?: number;
  before_id?: string; // For cursor-based pagination
  after_id?: string;
}

export interface GetMessagesResponse {
  messages: StockRoomMessage[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface JoinRoomRequest {
  notifications_enabled?: boolean;
}

export interface UpdateMembershipRequest {
  is_favorite?: boolean;
  notifications_enabled?: boolean;
}

