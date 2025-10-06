'use client'

import { useState } from 'react'
import { Send, Image, TrendingUp } from 'lucide-react'

interface PostComposerProps {
  onPostCreated: () => void
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const maxLength = 500
  const remaining = maxLength - content.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isPosting) return

    setIsPosting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (response.ok) {
        setContent('')
        onPostCreated()
      } else {
        alert('Error creating post')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating post')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="card mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder="What's happening in your portfolio? 📈"
          className="w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none dark:bg-gray-800"
          rows={3}
          maxLength={maxLength}
        />
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {/* Future: Add image upload, attach portfolio, etc. */}
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
              title="Attach image (coming soon)"
              disabled
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
              title="Attach portfolio (coming soon)"
              disabled
            >
              <TrendingUp size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${remaining < 50 ? 'text-red-600' : 'text-gray-500'}`}>
              {remaining}
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isPosting}
              className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

