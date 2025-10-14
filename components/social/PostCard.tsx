'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'
import { Post } from '@/types/social'
import Avatar from '../Avatar'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: Post
  onLikeToggle: (postId: string) => void
}

export default function PostCard({ post, onLikeToggle }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    try {
      await onLikeToggle(post.id)
    } finally {
      setIsLiking(false)
    }
  }


  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.user_profile?.user_id || post.user_id}`}>
          <Avatar
            src={post.user_profile?.avatar_url}
            alt={post.user_profile?.display_name || 'User'}
            size="md"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/profile/${post.user_profile?.user_id || post.user_id}`}
              className="font-bold hover:underline"
            >
              {post.user_profile?.display_name || 'User'}
            </Link>
            <span className="text-gray-500 text-sm">
              @{post.user_profile?.username || 'user'}
            </span>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Post content */}
          <p className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Attached portfolio */}
          {post.portfolio && (
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="font-semibold">{post.portfolio.name}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {post.portfolio.stocks.slice(0, 5).map((stock) => (
                  <span
                    key={stock.symbol}
                    className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium"
                  >
                    {stock.symbol}
                  </span>
                ))}
                {post.portfolio.stocks.length > 5 && (
                  <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
                    +{post.portfolio.stocks.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 text-gray-500">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 hover:text-red-600 transition-colors group ${
                post.user_has_liked ? 'text-red-600' : ''
              }`}
            >
              <Heart
                size={18}
                className={`group-hover:scale-110 transition-transform ${
                  post.user_has_liked ? 'fill-current' : ''
                }`}
              />
              <span className="text-sm">{post.likes_count}</span>
            </button>

            <button className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
              <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm">{post.comments_count}</span>
            </button>

            <button className="flex items-center gap-2 hover:text-green-600 transition-colors group">
              <Share2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

