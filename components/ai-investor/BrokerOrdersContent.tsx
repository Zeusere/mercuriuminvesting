'use client'

import { User } from '@supabase/supabase-js'
import { ShoppingCart, MessageSquare } from 'lucide-react'
import Navigation from '../Navigation'
import BrokerOrdersMode from './BrokerOrdersMode'

interface BrokerOrdersContentProps {
  user: User
}

export default function BrokerOrdersContent({ user }: BrokerOrdersContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="ai-investor" />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <MessageSquare className="text-primary-600" size={32} />
              Talk with Your Broker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create trading orders using natural language or voice commands
            </p>
          </div>

          {/* Info Card */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-2">Natural Language Trading</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Create orders by simply describing what you want to do. Examples:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>"Buy 100 shares of Apple at market price"</li>
                  <li>"Sell my Tesla position when it reaches $300"</li>
                  <li>"Place a limit order for 50 NVDA at $800"</li>
                  <li>"Set a stop loss for my Microsoft shares at $350"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Broker Orders Component */}
          <BrokerOrdersMode />
        </div>
      </main>
    </div>
  )
}

