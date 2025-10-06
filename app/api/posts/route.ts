import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch posts with user profiles and check if current user has liked
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Fetch user profiles and portfolios separately
    const posts = await Promise.all(
      (postsData || []).map(async (post) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', post.user_id)
          .single()

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
      .eq('user_id', user.id)

    const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || [])

    const postsWithLikes = posts?.map((post: any) => ({
      ...post,
      user_profile: post.user_profiles,
      portfolio: post.portfolios,
      user_has_liked: likedPostIds.has(post.id),
    }))

    return NextResponse.json({ posts: postsWithLikes || [] })
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Error fetching posts', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, portfolio_id } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content too long (max 500 characters)' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        portfolio_id: portfolio_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Error creating post', details: error.message },
      { status: 500 }
    )
  }
}

