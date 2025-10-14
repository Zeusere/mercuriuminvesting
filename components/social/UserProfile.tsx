'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Loader2, TrendingUp, Calendar, Edit, ArrowLeft } from 'lucide-react'
import Navigation from '../Navigation'
import PostCard from './PostCard'
import Avatar from '../Avatar'
import { UserProfile as UserProfileType, Post } from '@/types/social'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Portfolio {
  id: string
  name: string
  stocks: any[]
  total_amount: number
  created_at: string
  is_public: boolean
  performance_1y?: number | null
}

interface UserProfileProps {
  user: User
  profileId: string
}

export default function UserProfile({ user, profileId }: UserProfileProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [mainStrategy, setMainStrategy] = useState<any>(null)
  const [mainStrategyPositions, setMainStrategyPositions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false)
  const [isLoadingMainStrategy, setIsLoadingMainStrategy] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'portfolios'>('posts')
  const [performanceLoaded, setPerformanceLoaded] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const isOwnProfile = user.id === profileId

  useEffect(() => {
    fetchProfileData()
    if (isOwnProfile) {
      fetchMainStrategy()
    }
  }, [profileId])

  const fetchProfileData = async () => {
    setIsLoading(true)
    try {
      // Fetch profile
      const profileRes = await fetch(`/api/users/${profileId}`)
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.profile)
        setPosts(profileData.posts || [])
        setPortfolios(profileData.portfolios || [])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMainStrategy = async () => {
    setIsLoadingMainStrategy(true)
    try {
      const response = await fetch('/api/strategies/main')
      if (response.ok) {
        const data = await response.json()
        setMainStrategy(data.mainStrategy)
        setMainStrategyPositions(data.positions || [])
      }
    } catch (error) {
      console.error('Error fetching main strategy:', error)
    } finally {
      setIsLoadingMainStrategy(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Actualizar el perfil local con la nueva URL del avatar
        if (profile) {
          setProfile({
            ...profile,
            avatar_url: data.avatar_url
          })
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Error uploading avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleLikeToggle = async (postId: string) => {
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
        setPosts(posts)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setPosts(posts)
    }
  }

  const loadPortfolioPerformance = async () => {
    if (performanceLoaded || portfolios.length === 0) return
    
    setIsLoadingPerformance(true)
    try {
      const portfoliosWithPerf = await Promise.all(
        portfolios.map(async (portfolio) => {
          try {
            const response = await fetch('/api/portfolios/backtest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stocks: portfolio.stocks,
                total_amount: portfolio.total_amount,
              }),
            })
            
            if (response.ok) {
              const data = await response.json()
              return {
                ...portfolio,
                performance_1y: data['1Y']?.total_return || null
              }
            }
          } catch (error) {
            console.error(`Error loading performance for ${portfolio.name}:`, error)
          }
          return portfolio
        })
      )
      
      setPortfolios(portfoliosWithPerf)
      setPerformanceLoaded(true)
    } catch (error) {
      console.error('Error loading portfolio performance:', error)
    } finally {
      setIsLoadingPerformance(false)
    }
  }

  const handleTabChange = (tab: 'posts' | 'portfolios') => {
    setActiveTab(tab)
    if (tab === 'portfolios' && !performanceLoaded) {
      loadPortfolioPerformance()
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="social" />
        <main className="container mx-auto px-4 py-24">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="social" />
        <main className="container mx-auto px-4 py-24">
          <div className="card text-center py-12">
            <h3 className="text-xl font-bold mb-2">Profile not found</h3>
            <button onClick={() => router.back()} className="btn-primary mt-4">
              Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="social" />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Back button - only show for other profiles */}
          {!isOwnProfile && (
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}

          {/* Profile Header */}
          <div className="card mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                size="xl"
                editable={isOwnProfile}
                onUpload={handleAvatarUpload}
                loading={isUploadingAvatar}
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name || 'User'}</h1>
                    <p className="text-gray-500">@{profile.username}</p>
                  </div>
                  {isOwnProfile && (
                    <Link href="/settings/profile" className="btn-outline px-4 py-2 flex items-center gap-2">
                      <Edit size={16} />
                      Edit Profile
                    </Link>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={16} />
                    {portfolios.filter(p => p.is_public).length} Public Portfolios
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Strategy (only for own profile) */}
          {isOwnProfile && (
            <div className="mb-6">
              {isLoadingMainStrategy ? (
                <div className="card animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ) : mainStrategy ? (
                <div className="card bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800">
                  {/* Strategy Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <Link 
                        href={`/strategies/${mainStrategy.id}`}
                        className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {mainStrategy.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Active Strategy
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${(mainStrategy.current_capital || mainStrategy.initial_capital).toLocaleString()}
                      </div>
                      <div className={`text-base font-semibold ${
                        (mainStrategy.total_return_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(mainStrategy.total_return_pct || 0) >= 0 ? '+' : ''}{(mainStrategy.total_return_pct || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Positions Summary */}
                  {mainStrategyPositions.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {mainStrategyPositions.slice(0, 8).map((position: any) => {
                        const isProfitable = (position.unrealized_pnl_pct || 0) >= 0;
                        return (
                          <div key={position.id} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-bold text-gray-900 dark:text-white mb-1">{position.symbol}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {position.weight_pct?.toFixed(1) || '0.0'}%
                            </div>
                            <div className={`text-sm font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                              {isProfitable ? '+' : ''}{position.unrealized_pnl_pct?.toFixed(2) || '0.00'}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View Full Strategy Button */}
                  <Link
                    href={`/strategies/${mainStrategy.id}`}
                    className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={18} />
                    View Full Strategy
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* Tabs */}
          <div className="card mb-6 p-0">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabChange('posts')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'posts'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Posts ({posts.length})
              </button>
              <button
                onClick={() => handleTabChange('portfolios')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'portfolios'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Portfolios ({portfolios.filter(p => p.is_public).length})
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'posts' ? (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingPerformance && !performanceLoaded ? (
                // Skeleton loaders while loading performance
                <>
                  {portfolios.filter(p => p.is_public).map((portfolio) => (
                    <div key={portfolio.id} className="card animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                      <div className="space-y-2 mb-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </>
              ) : portfolios.filter(p => p.is_public).length === 0 ? (
                <div className="card text-center py-12">
                  <TrendingUp size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-600 dark:text-gray-400">No public portfolios</p>
                </div>
              ) : (
                portfolios
                  .filter(p => p.is_public)
                  .map((portfolio) => (
                    <div 
                      key={portfolio.id} 
                      onClick={() => router.push(`/portfolios/${portfolio.id}`)}
                      className="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary-500 dark:hover:border-primary-400 hover:scale-[1.02] relative overflow-hidden"
                    >
                      {/* Performance badge destacado */}
                      {portfolio.performance_1y !== undefined && portfolio.performance_1y !== null && (
                        <div className="absolute top-3 right-3">
                          <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-md ${
                            portfolio.performance_1y >= 0
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          }`}>
                            {portfolio.performance_1y >= 0 ? '+' : ''}{portfolio.performance_1y.toFixed(2)}% 
                            <span className="text-xs opacity-90 ml-1">1Y</span>
                          </div>
                        </div>
                      )}
                      
                      <h3 className="font-bold text-lg mb-3 pr-24">{portfolio.name}</h3>
                      
                      {/* Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{portfolio.stocks.length} stocks</span>
                          <span className="font-semibold text-lg text-gray-900 dark:text-white">
                            ${portfolio.total_amount.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(portfolio.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      
                      {/* Stock tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {portfolio.stocks.slice(0, 6).map((stock: any) => (
                          <span
                            key={stock.symbol}
                            className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs font-medium"
                          >
                            {stock.symbol} ({stock.weight.toFixed(1)}%)
                          </span>
                        ))}
                        {portfolio.stocks.length > 6 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500">
                            +{portfolio.stocks.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

