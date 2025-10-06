'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Loader2, Users } from 'lucide-react'
import Navigation from '../Navigation'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import { Post } from '@/types/social'

interface SocialFeedProps {
  user: User
}

export default function SocialFeed({ user }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeToggle = async (postId: string) => {
    // Optimistic update
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const wasLiked = post.user_has_liked
    const newPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            user_has_liked: !wasLiked,
            likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1,
          }
        : p
    )
    setPosts(newPosts)

    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })

      if (!response.ok) {
        // Revert on error
        setPosts(posts)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setPosts(posts)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="social" />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users size={32} className="text-primary-600" />
              Social Feed
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share your portfolio insights and connect with other investors
            </p>
          </div>

          {/* Post Composer */}
          <PostComposer onPostCreated={fetchPosts} />

          {/* Feed */}
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loaders
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </>
            ) : posts.length === 0 ? (
              <div className="card text-center py-12">
                <Users size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Be the first to share something!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

