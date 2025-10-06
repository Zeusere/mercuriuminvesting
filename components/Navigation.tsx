'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LogOut, Settings, TrendingUp, ChevronDown, Moon, Sun, Bot, BarChart3, MessageSquare, User as UserIcon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Link from 'next/link'

interface NavigationProps {
  user: User
  currentPage: 'dashboard' | 'portfolios' | 'ai-investor' | 'stocks' | 'social'
}

export default function Navigation({ user, currentPage }: NavigationProps) {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const { theme, toggleTheme } = useTheme()
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [aiInvestorOpen, setAiInvestorOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center cursor-pointer">
                <TrendingUp className="text-white" size={24} />
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className={currentPage === 'dashboard' ? 'text-primary-600 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
              >
                Dashboard
              </Link>
              
              <Link
                href="/portfolios"
                className={currentPage === 'portfolios' ? 'text-primary-600 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
              >
                Portfolios
              </Link>

              <Link
                href="/social"
                className={currentPage === 'social' ? 'text-primary-600 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
              >
                Social
              </Link>

              {/* Resources Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Resources
                  <ChevronDown size={16} className={`transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {resourcesOpen && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      <Link
                        href="/stocks"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-semibold">Stocks Database</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Explore stock prices and charts</div>
                      </Link>
                      <Link
                        href="/community-portfolios"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-semibold">Community Portfolios</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">See top performing portfolios</div>
                      </Link>
                      <Link
                        href="/blog"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-semibold">Blog</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Investment tips and analysis</div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Investor Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setAiInvestorOpen(true)}
                onMouseLeave={() => setAiInvestorOpen(false)}
              >
                <button className={`flex items-center gap-1 ${currentPage === 'ai-investor' ? 'text-primary-600 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                  AI Investor
                  <ChevronDown size={16} className={`transition-transform ${aiInvestorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {aiInvestorOpen && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      <Link
                        href="/ai-investor/create-strategy"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Bot size={16} className="text-primary-600" />
                          <span className="font-semibold">Create Strategy</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">Build portfolios with AI or manually</div>
                      </Link>
                      <Link
                        href="/ai-investor/analyze-strategy"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 size={16} className="text-green-600" />
                          <span className="font-semibold">Analyze Strategy</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">Get AI insights on your portfolios</div>
                      </Link>
                      <Link
                        href="/ai-investor/broker-orders"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={16} className="text-blue-600" />
                          <span className="font-semibold">Talk with Broker</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">Natural language trading orders</div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <Link
              href={`/profile/${user.id}`}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="My Profile"
            >
              <UserIcon size={20} />
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
