'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Bot, Activity, TrendingUp, DollarSign } from 'lucide-react'
import OrderInput from './OrderInput'
import OrdersList from './OrdersList'
import Navigation from './Navigation'

interface AIInvestorContentProps {
  user: User
}

export default function AIInvestorContent({ user }: AIInvestorContentProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOrderCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="ai-investor" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="card mb-8 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <Bot size={48} className="opacity-90" />
            <div>
              <h2 className="text-2xl font-bold mb-1">
                AI Investor Assistant
              </h2>
              <p className="text-green-50">
                Crea órdenes mediante texto o voz. La IA interpretará tus instrucciones y te ayudará en tus decisiones de inversión.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-blue-500" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes Activas</p>
            </div>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-green-500" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes Ejecutadas</p>
            </div>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-purple-500" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Posiciones</p>
            </div>
            <p className="text-3xl font-bold">0 EUR</p>
          </div>
        </div>

        {/* Order Input */}
        <div className="mb-8">
          <OrderInput onOrderCreated={handleOrderCreated} />
        </div>

        {/* Orders List */}
        <OrdersList refreshTrigger={refreshTrigger} />

        {/* Info Section */}
        <div className="card mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-100">
            💡 Consejos de Uso
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Puedes usar texto o voz para crear órdenes</li>
            <li>• El sistema soporta órdenes de mercado, límite, stop loss y take profit</li>
            <li>• Las órdenes se crean como PENDIENTES y debes ejecutarlas manualmente</li>
            <li>• Actualmente el broker está en modo simulado para pruebas</li>
            <li>• Próximamente: creación de carteras con IA, análisis y recomendaciones</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
