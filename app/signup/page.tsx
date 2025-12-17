'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import HeaderLanding from '@/components/HeaderLanding'
import FooterLanding from '@/components/FooterLanding'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const uname = username.trim().toLowerCase()
      // quick client validation
      if (!/^([a-z0-9_]{3,20})$/.test(uname)) {
        throw new Error('Username must be 3-20 chars, letters/numbers/underscore')
      }

      // check uniqueness server-side
      setUsernameStatus('checking')
      const chk = await fetch(`/api/users/check-username?u=${encodeURIComponent(uname)}`)
      const chkData = await chk.json()
      if (!chk.ok || !chkData.available) {
        setUsernameStatus('taken')
        throw new Error('Username not available')
      }
      setUsernameStatus('available')

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: uname,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Show success message
      alert('Check your email to confirm your account!')
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  // Debounced availability check as user types
  useEffect(() => {
    const uname = username.trim().toLowerCase()
    if (!uname) { setUsernameStatus('idle'); return }
    if (!/^([a-z0-9_]{3,20})$/.test(uname)) { setUsernameStatus('invalid'); return }
    const t = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const res = await fetch(`/api/users/check-username?u=${encodeURIComponent(uname)}`)
        const data = await res.json()
        setUsernameStatus(res.ok && data.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [username])

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google signup')
      setLoading(false)
    }
  }

  return (
    <div className="brutalist-landing bg-white min-h-screen flex flex-col">
      <HeaderLanding />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-impact text-5xl md:text-6xl uppercase tracking-tighter text-black mb-4">
              CREATE ACCOUNT
            </h1>
            <p className="font-anton text-lg text-gray-600">
              Start building amazing strategies today
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border-4 border-black p-8">
            {error && (
              <div className="bg-red-100 border-4 border-red-600 text-red-900 p-4 mb-6 font-anton text-sm uppercase">
                {error}
              </div>
            )}

            {/* Google Signup */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 border-4 border-black bg-white text-black hover:bg-black hover:text-white px-6 py-4 font-impact uppercase tracking-tighter transition-all mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-black"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white font-anton text-xs uppercase text-gray-600">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignup} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block font-impact text-sm uppercase tracking-tighter text-black mb-2">
                  USERNAME
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                    size={20}
                  />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-4 border-black bg-white text-black font-anton focus:outline-none focus:ring-0"
                    placeholder="your_nickname"
                    required
                  />
                </div>
                <p className="text-xs mt-2 font-anton uppercase">
                  {usernameStatus === 'checking' && <span className="text-gray-600">CHECKING...</span>}
                  {usernameStatus === 'available' && <span className="text-green-700">AVAILABLE</span>}
                  {usernameStatus === 'taken' && <span className="text-red-700">NOT AVAILABLE</span>}
                  {usernameStatus === 'invalid' && <span className="text-red-700">3-20 CHARS, LETTERS/NUMBERS/_</span>}
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block font-impact text-sm uppercase tracking-tighter text-black mb-2">
                  FULL NAME
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                    size={20}
                  />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-4 border-black bg-white text-black font-anton focus:outline-none focus:ring-0"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block font-impact text-sm uppercase tracking-tighter text-black mb-2">
                  EMAIL
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                    size={20}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-4 border-black bg-white text-black font-anton focus:outline-none focus:ring-0"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block font-impact text-sm uppercase tracking-tighter text-black mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                    size={20}
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-4 border-black bg-white text-black font-anton focus:outline-none focus:ring-0"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-anton uppercase">
                  MUST BE AT LEAST 6 CHARACTERS
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="brutalist-button w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>

            <p className="mt-8 text-center font-anton text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-impact uppercase text-black hover:underline">
                SIGN IN
              </Link>
            </p>

            <p className="mt-4 text-center font-anton text-xs text-gray-600">
              By signing up, you agree to our{' '}
              <Link href="#" className="font-impact uppercase text-black hover:underline">
                TERMS
              </Link>{' '}
              and{' '}
              <Link href="#" className="font-impact uppercase text-black hover:underline">
                PRIVACY POLICY
              </Link>
            </p>
          </div>
        </div>
      </main>

      <FooterLanding />
    </div>
  )
}

