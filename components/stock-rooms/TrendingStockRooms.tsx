'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, MessageSquare, Users, Flame } from 'lucide-react';
import Link from 'next/link';
import type { TrendingRoom } from '@/types/stock-rooms';

export default function TrendingStockRooms() {
  const [rooms, setRooms] = useState<TrendingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingRooms();
  }, []);

  async function fetchTrendingRooms() {
    try {
      const res = await fetch('/api/stock-rooms/trending?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching trending rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card sticky top-4">
      <div className="flex items-center space-x-2 mb-4">
        <Flame size={20} className="text-orange-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Trending Rooms
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No active rooms yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, index) => {
            const priceChangeColor = (room.price_change_pct || 0) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400';

            return (
              <Link
                key={room.id}
                href={`/stock-rooms/${room.symbol}`}
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Symbol + Rank */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {room.symbol}
                      </span>
                    </div>

                    {/* Company Name */}
                    {room.company_name && room.company_name !== room.symbol && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                        {room.company_name}
                      </p>
                    )}

                    {/* Price + Change */}
                    {room.current_price && (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${room.current_price.toFixed(2)}
                        </span>
                        <span className={priceChangeColor}>
                          {(room.price_change_pct || 0) >= 0 ? '+' : ''}
                          {room.price_change_pct?.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MessageSquare size={12} />
                        <span>{room.total_messages}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users size={12} />
                        <span>{room.active_members_24h}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {rooms.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/stock-rooms"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all rooms →
          </Link>
        </div>
      )}
    </div>
  );
}

