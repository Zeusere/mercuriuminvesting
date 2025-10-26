'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Bell, BellOff, Loader2, Users, 
  MessageSquare, TrendingUp, TrendingDown 
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import StockRoomMessageComponent from './StockRoomMessage';
import MessageInput from './MessageInput';
import type { StockRoom, StockRoomMessage } from '@/types/stock-rooms';

interface StockRoomChatProps {
  user: User | null;
  symbol: string;
}

export default function StockRoomChat({ user, symbol }: StockRoomChatProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [room, setRoom] = useState<StockRoom | null>(null);
  const [messages, setMessages] = useState<StockRoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch room and initial messages
  useEffect(() => {
    fetchRoomData();
  }, [symbol]);

  // Real-time subscription
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload: any) => {
          // Fetch the new message
          const { data: newMessage } = await supabase
            .from('stock_room_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id, username, display_name, avatar_url')
              .eq('user_id', newMessage.user_id)
              .single();

            const formattedMessage = {
              ...newMessage,
              user: {
                id: newMessage.user_id,
                username: profile?.username || null,
                display_name: profile?.display_name || 'Anonymous',
                avatar_url: profile?.avatar_url || null,
              },
              is_liked_by_me: false,
            } as any;

            setMessages((prev) => [...prev, formattedMessage]);
            
            // Scroll to bottom if user is near bottom
            if (messagesContainerRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
              if (isNearBottom) {
                setTimeout(scrollToBottom, 100);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && isLoading === false) {
      scrollToBottom();
    }
  }, [messages.length, isLoading]);

  async function fetchRoomData() {
    setIsLoading(true);
    setError(null);

    try {
      // Get room info
      const roomRes = await fetch(`/api/stock-rooms/${symbol}`);
      if (!roomRes.ok) throw new Error('Failed to fetch room');
      const roomData = await roomRes.json();

      setRoom(roomData.room);
      setIsMember(roomData.is_member);
      setIsFavorite(roomData.is_favorite);

      // Get messages
      const messagesRes = await fetch(`/api/stock-rooms/${symbol}/messages?limit=50`);
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const messagesData = await messagesRes.json();

      setMessages(messagesData.messages || []);
      setHasMore(messagesData.has_more || false);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }

  // Mark room as read when user reaches bottom or opens
  useEffect(() => {
    if (!user || !room) return;
    // On open, mark as read
    markAsRead();

    const handler = () => {
      if (!messagesContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 10;
      if (atBottom) markAsRead();
    };
    messagesContainerRef.current?.addEventListener('scroll', handler);
    return () => messagesContainerRef.current?.removeEventListener('scroll', handler);
  }, [user?.id, room?.id, messages.length]);

  async function markAsRead() {
    try {
      await fetch(`/api/stock-rooms/${symbol}/read`, { method: 'POST' });
    } catch {}
  }

  async function handleJoinRoom() {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/stock-rooms/${symbol}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: true }),
      });

      if (!res.ok) throw new Error('Failed to join room');

      setIsMember(true);
    } catch (err) {
      console.error('Error joining room:', err);
      alert('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user) return;

    try {
      const res = await fetch(`/api/stock-rooms/${symbol}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to toggle favorite');

      const data = await res.json();
      setIsFavorite(data.is_favorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }

  async function handleSendMessage(content: string) {
    if (!user) {
      router.push('/login');
      return;
    }

    const res = await fetch(`/api/stock-rooms/${symbol}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      throw new Error('Failed to send message');
    }

    // Optimistic append with server response to avoid waiting for Realtime
    try {
      const data = await res.json();
      const newMessage = data.message as StockRoomMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev; // avoid dupe with realtime
        return [...prev, newMessage];
      });
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      // ignore formatting issues, realtime will still deliver
      console.warn('Could not parse message response, relying on realtime');
    }

    // Update membership status if needed
    if (!isMember) {
      setIsMember(true);
    }
  }

  async function handleLikeMessage(messageId: string) {
    if (!user) {
      router.push('/login');
      return;
    }

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              is_liked_by_me: !msg.is_liked_by_me,
              likes_count: msg.is_liked_by_me
                ? msg.likes_count - 1
                : msg.likes_count + 1,
            }
          : msg
      )
    );

    // TODO: Call API to toggle like
    // For now we'll leave this as optimistic only
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      const res = await fetch(`/api/stock-rooms/${symbol}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete message');

      // Remove from UI
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={48} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-red-600 dark:text-red-400">
          {error || 'Room not found'}
        </div>
        <Link href="/social" className="btn-secondary">
          Back to Social
        </Link>
      </div>
    );
  }

  const priceChangeColor = (room.price_change_pct || 0) >= 0
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  const priceChangeIcon = (room.price_change_pct || 0) >= 0
    ? <TrendingUp size={16} />
    : <TrendingDown size={16} />;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Stock Info */}
          <div className="flex items-center space-x-4">
            <Link
              href="/social"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={24} />
            </Link>

            <div className="flex items-center space-x-3">
              {room.logo_url && (
                <img
                  src={room.logo_url}
                  alt={room.symbol}
                  className="w-10 h-10 rounded object-contain"
                />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {room.symbol}
                  </h1>
                  {room.company_name && room.company_name !== room.symbol && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {room.company_name}
                    </span>
                  )}
                </div>
                {room.current_price && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${room.current_price.toFixed(2)}
                    </span>
                    <span className={`flex items-center space-x-1 ${priceChangeColor}`}>
                      {priceChangeIcon}
                      <span>{Math.abs(room.price_change_pct || 0).toFixed(2)}%</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>{room.total_members}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare size={16} />
                <span>{room.total_messages}</span>
              </div>
            </div>

            {/* Favorite Button */}
            {isMember && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={20} className={isFavorite ? 'fill-current' : ''} />
              </button>
            )}

            {/* Join Button */}
            {!isMember && user && (
              <button
                onClick={handleJoinRoom}
                disabled={isJoining}
                className="btn-primary"
              >
                {isJoining ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Community'
                )}
              </button>
            )}

            {!user && (
              <Link href="/login" className="btn-primary">
                Login to Join
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500 dark:text-gray-400">
            <MessageSquare size={64} className="opacity-50" />
            <div className="text-center">
              <p className="text-lg font-semibold">No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <StockRoomMessageComponent
                key={message.id}
                message={message}
                currentUserId={user?.id || null}
                onLike={handleLikeMessage}
                onDelete={handleDeleteMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {user ? (
        <div className="max-w-4xl mx-auto w-full">
          <MessageInput
            onSend={handleSendMessage}
            placeholder={`Message ${room.symbol} community...`}
          />
        </div>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login to join the conversation
          </Link>
        </div>
      )}
    </div>
  );
}

