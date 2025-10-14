'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import PortfolioList from './PortfolioList'
import Navigation from './Navigation'
import ConnectionsManager from './ConnectionsManager'
import RealPortfolioViewer from './RealPortfolioViewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface PortfoliosPageContentProps {
  user: User
}

export default function PortfoliosPageContent({ user }: PortfoliosPageContentProps) {
  const [activeTab, setActiveTab] = useState('strategies')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleConnectionChange = () => {
    // Forzar recarga del portfolio real
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Portfolios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your investment strategies and real brokerage accounts
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow">
            <TabsTrigger 
              value="strategies"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Strategies
            </TabsTrigger>
            <TabsTrigger 
              value="real-portfolio"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Real Portfolio
            </TabsTrigger>
            <TabsTrigger 
              value="connections"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategies">
            <PortfolioList />
          </TabsContent>

          <TabsContent value="real-portfolio" key={refreshKey}>
            <RealPortfolioViewer />
          </TabsContent>

          <TabsContent value="connections">
            <ConnectionsManager onConnectionChange={handleConnectionChange} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}