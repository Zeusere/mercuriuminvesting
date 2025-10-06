import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) throw profileError

    // Fetch user's posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (postsError) throw postsError

    // Fetch portfolios for posts
    const posts = await Promise.all(
      (postsData || []).map(async (post) => {
        let portfolio = null
        if (post.portfolio_id) {
          const { data: portfolioData } = await supabase
            .from('portfolios')
            .select('id, name, stocks, total_amount')
            .eq('id', post.portfolio_id)
            .single()
          portfolio = portfolioData
        }

        return {
          ...post,
          user_profiles: profile,
          portfolios: portfolio,
        }
      })
    )

    // Check which posts the current user has liked
    const { data: userLikes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUser.id)

    const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || [])

    const postsWithLikes = posts?.map((post: any) => ({
      ...post,
      user_profile: post.user_profiles,
      portfolio: post.portfolios,
      user_has_liked: likedPostIds.has(post.id),
    }))

    // Fetch user's public portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (portfoliosError) throw portfoliosError

    return NextResponse.json({
      profile,
      posts: postsWithLikes || [],
      portfolios: portfolios || [],
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Error fetching user profile', details: error.message },
      { status: 500 }
    )
  }
}

