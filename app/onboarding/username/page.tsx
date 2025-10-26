'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function UsernameOnboardingPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(async () => {
      const u = username.trim().toLowerCase()
      if (!u) { setStatus('idle'); return }
      if (!/^([a-z0-9_]{3,20})$/.test(u)) { setStatus('invalid'); return }
      setStatus('checking')
      const res = await fetch(`/api/users/check-username?u=${encodeURIComponent(u)}`)
      const data = await res.json()
      setStatus(res.ok && data.available ? 'available' : 'taken')
    }, 300)
    return () => clearTimeout(t)
  }, [username])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const u = username.trim().toLowerCase()
    try {
      const res = await fetch('/api/users/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Choose your username</h1>
        <p className="text-sm text-gray-600 mb-6">
          This will be your public name across the app.
        </p>
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        <form onSubmit={save} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_nickname"
            className="input-field"
            required
          />
          <p className="text-xs">
            {status === 'checking' && <span className="text-gray-500">Checking…</span>}
            {status === 'available' && <span className="text-green-600">Available</span>}
            {status === 'taken' && <span className="text-red-600">Not available</span>}
            {status === 'invalid' && <span className="text-red-600">3-20 chars, letters/numbers/_</span>}
          </p>
          <button
            type="submit"
            disabled={saving || status !== 'available'}
            className="btn-primary w-full"
          >
            Save
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
          <Link href="/dashboard" className="underline">Skip for now</Link>
        </p>
      </div>
    </div>
  )
}


