'use client';

import { useState } from 'react';
import { Heart, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { StockRoomMessage } from '@/types/stock-rooms';

interface StockRoomMessageProps {
  message: StockRoomMessage;
  currentUserId: string | null;
  onLike?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function StockRoomMessageComponent({
  message,
  currentUserId,
  onLike,
  onDelete,
}: StockRoomMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwnMessage = currentUserId === message.user_id;
  const isLiked = message.is_liked_by_me;

  const handleLike = () => {
    if (onLike) {
      onLike(message.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('¿Borrar este mensaje?')) {
      onDelete(message.id);
      setShowMenu(false);
    }
  };

  return (
    <div className="group relative py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {message.user?.avatar_url ? (
            <img
              src={message.user.avatar_url}
              alt={message.user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
              {message.user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">
              {message.user?.display_name || message.user?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {message.is_edited && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                (edited)
              </span>
            )}
          </div>

          {/* Message Text */}
          <div className="text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                isLiked
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              }`}
              disabled={!currentUserId}
            >
              <Heart
                size={16}
                className={isLiked ? 'fill-current' : ''}
              />
              {message.likes_count > 0 && (
                <span className="font-medium">{message.likes_count}</span>
              )}
            </button>

            {/* Reply (future) */}
            {/* <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
              Reply
            </button> */}
          </div>
        </div>

        {/* More Menu */}
        {isOwnMessage && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <MoreVertical size={16} className="text-gray-500" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

