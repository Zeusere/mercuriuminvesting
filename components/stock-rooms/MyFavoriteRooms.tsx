'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface FavoriteRoom {
  id: string;
  room_id: string;
  is_favorite: boolean;
  last_seen_at: string;
  room: {
    id: string;
    symbol: string;
    company_name: string | null;
    logo_url: string | null;
    current_price: number | null;
    price_change_pct: number | null;
    total_messages: number;
    total_members: number;
    last_message_at: string | null;
  };
  unread_count: number;
}

interface MyFavoriteRoomsProps {
  user: User | null;
}

export default function MyFavoriteRooms({ user }: MyFavoriteRoomsProps) {
  const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Lightweight refresh when window gets focus (to clear unread badges after reading)
  useEffect(() => {
    const onFocus = () => {
      if (user) fetchFavorites();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  async function fetchFavorites() {
    try {
      const res = await fetch('/api/stock-rooms/my-favorites');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="card sticky top-4">
        <div className="flex items-center space-x-2 mb-4">
          <Star size={20} className="text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            My Rooms
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login
          </Link>{' '}
          to save favorite rooms
        </p>
      </div>
    );
  }

  return (
    <div className="card sticky top-4">
      <div className="flex items-center space-x-2 mb-4">
        <Star size={20} className="text-yellow-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          My Rooms
        </h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </div>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No favorite rooms yet. Star a room to add it here!
        </p>
      ) : (
        <div className="space-y-2">
          {favorites.map((favorite) => {
            const priceChangeColor = (favorite.room.price_change_pct || 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400';

            return (
              <Link
                key={favorite.id}
                href={`/stock-rooms/${favorite.room.symbol}`}
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 relative"
              >
                {/* Unread badge */}
                {favorite.unread_count > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {favorite.unread_count > 99 ? '99+' : favorite.unread_count}
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  {/* Logo */}
                  {favorite.room.logo_url ? (
                    <img
                      src={favorite.room.logo_url}
                      alt={favorite.room.symbol}
                      className="w-8 h-8 rounded object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {favorite.room.symbol.charAt(0)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {favorite.room.symbol}
                    </div>
                    
                    {favorite.room.current_price && (
                      <div className="flex items-center space-x-2 text-xs mt-0.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          ${favorite.room.current_price.toFixed(2)}
                        </span>
                        <span className={priceChangeColor}>
                          {(favorite.room.price_change_pct || 0) >= 0 ? '+' : ''}
                          {favorite.room.price_change_pct?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Browse Link */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/stocks"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Browse stocks →
        </Link>
      </div>
    </div>
  );
}

