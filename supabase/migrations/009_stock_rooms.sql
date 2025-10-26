-- Stock Rooms System - Community chat rooms for stocks/tickers
-- This migration creates the infrastructure for per-stock community discussions

-- 1. Stock Rooms (chat rooms per ticker - created on-demand)
CREATE TABLE stock_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  
  -- Cached stock metadata (updated periodically)
  company_name TEXT,
  logo_url TEXT,
  current_price DECIMAL(15, 4),
  price_change_pct DECIMAL(10, 4),
  last_price_update TIMESTAMP WITH TIME ZONE,
  
  -- Room statistics
  total_messages INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  active_members_24h INTEGER DEFAULT 0, -- For trending calculation
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stock Room Messages (messages within rooms)
CREATE TABLE stock_room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.stock_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'link')),
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_edited BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Stock Room Members (user memberships in rooms)
CREATE TABLE stock_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.stock_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- User preferences
  is_favorite BOOLEAN DEFAULT FALSE, -- Show in user's sidebar
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Activity tracking
  last_read_message_id UUID,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Moderation (for future)
  is_muted BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  
  UNIQUE(room_id, user_id)
);

-- 4. Stock Room Message Likes (likes on messages)
CREATE TABLE stock_room_message_likes (
  message_id UUID REFERENCES public.stock_room_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_stock_rooms_symbol ON stock_rooms(symbol);
CREATE INDEX idx_stock_rooms_trending ON stock_rooms(active_members_24h DESC, total_messages DESC);
CREATE INDEX idx_stock_rooms_last_message ON stock_rooms(last_message_at DESC NULLS LAST);

CREATE INDEX idx_messages_room_date ON stock_room_messages(room_id, created_at DESC);
CREATE INDEX idx_messages_user ON stock_room_messages(user_id, created_at DESC);
CREATE INDEX idx_messages_not_deleted ON stock_room_messages(room_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_members_room ON stock_room_members(room_id);
CREATE INDEX idx_members_user ON stock_room_members(user_id);
CREATE INDEX idx_members_favorites ON stock_room_members(user_id, is_favorite, last_seen_at DESC) WHERE is_favorite = true;
CREATE INDEX idx_members_active ON stock_room_members(room_id, last_seen_at DESC);

CREATE INDEX idx_likes_message ON stock_room_message_likes(message_id);
CREATE INDEX idx_likes_user ON stock_room_message_likes(user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE stock_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_room_message_likes ENABLE ROW LEVEL SECURITY;

-- Policies for stock_rooms (public read, authenticated can see all)
CREATE POLICY "Anyone can view stock rooms."
ON stock_rooms FOR SELECT
USING (true);

CREATE POLICY "System can create stock rooms."
ON stock_rooms FOR INSERT
WITH CHECK (true); -- Will be controlled by API

CREATE POLICY "System can update stock rooms."
ON stock_rooms FOR UPDATE
USING (true);

-- Policies for stock_room_messages
CREATE POLICY "Anyone can view non-deleted messages."
ON stock_room_messages FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create messages."
ON stock_room_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages."
ON stock_room_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages."
ON stock_room_messages FOR DELETE
USING (auth.uid() = user_id);

-- Policies for stock_room_members
CREATE POLICY "Anyone can view room members."
ON stock_room_members FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can join rooms."
ON stock_room_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership."
ON stock_room_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own membership."
ON stock_room_members FOR DELETE
USING (auth.uid() = user_id);

-- Policies for stock_room_message_likes
CREATE POLICY "Anyone can view likes."
ON stock_room_message_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like messages."
ON stock_room_message_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike messages."
ON stock_room_message_likes FOR DELETE
USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update room statistics when a message is posted
CREATE OR REPLACE FUNCTION update_room_stats_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update room stats
    UPDATE stock_rooms
    SET 
      total_messages = total_messages + 1,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.room_id;
    
    -- Update member's last_seen_at
    UPDATE stock_room_members
    SET last_seen_at = NEW.created_at
    WHERE room_id = NEW.room_id AND user_id = NEW.user_id;
    
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL) THEN
    -- Decrement message count on delete/soft delete
    UPDATE stock_rooms
    SET total_messages = GREATEST(0, total_messages - 1)
    WHERE id = COALESCE(NEW.room_id, OLD.room_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_room_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON stock_room_messages
FOR EACH ROW
EXECUTE FUNCTION update_room_stats_on_message();

-- Function to update member count when someone joins/leaves
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stock_rooms
    SET total_members = total_members + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stock_rooms
    SET total_members = GREATEST(0, total_members - 1)
    WHERE id = OLD.room_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR DELETE ON stock_room_members
FOR EACH ROW
EXECUTE FUNCTION update_room_member_count();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_message_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stock_room_messages
    SET likes_count = likes_count + 1
    WHERE id = NEW.message_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stock_room_messages
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.message_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON stock_room_message_likes
FOR EACH ROW
EXECUTE FUNCTION update_message_likes_count();

-- Function to calculate active members in last 24h (run periodically via cron or manual)
CREATE OR REPLACE FUNCTION update_active_members_24h()
RETURNS void AS $$
BEGIN
  UPDATE stock_rooms sr
  SET active_members_24h = (
    SELECT COUNT(DISTINCT user_id)
    FROM stock_room_members
    WHERE room_id = sr.id
      AND last_seen_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE stock_rooms IS 'Chat rooms for individual stocks/tickers, created on-demand when first message is sent';
COMMENT ON TABLE stock_room_messages IS 'Messages posted in stock rooms, ordered chronologically';
COMMENT ON TABLE stock_room_members IS 'User memberships in stock rooms, tracks favorites and activity';
COMMENT ON TABLE stock_room_message_likes IS 'Likes/reactions on messages';

COMMENT ON COLUMN stock_rooms.active_members_24h IS 'Number of users who interacted in last 24h - used for trending';
COMMENT ON COLUMN stock_room_messages.deleted_at IS 'Soft delete timestamp - message still exists but hidden from users';
COMMENT ON COLUMN stock_room_members.is_favorite IS 'User has favorited this room - shows in sidebar';

