'use client'

import { useState } from 'react'
import OrderInput from '../OrderInput'
import OrdersList from '../OrdersList'
import { Activity, TrendingUp, DollarSign } from 'lucide-react'

export default function BrokerOrdersMode() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOrderCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="card bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <div className="flex items-center gap-4">
          <Activity size={32} className="opacity-90" />
          <div>
            <h3 className="text-lg font-bold mb-1">Natural Language Trading</h3>
            <p className="text-sm text-green-50">
              Create trading orders using voice or text. The AI will parse your intent and structure the order.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-blue-500" size={24} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Orders</p>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-500" size={24} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Executed Orders</p>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-purple-500" size={24} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Value in Positions</p>
          </div>
          <p className="text-3xl font-bold">0 EUR</p>
        </div>
      </div>

      {/* Order Input */}
      <div>
        <OrderInput onOrderCreated={handleOrderCreated} />
      </div>

      {/* Orders List */}
      <div>
        <OrdersList refreshTrigger={refreshTrigger} />
      </div>

      {/* Info Section */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-100">
          💡 Usage Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• You can use text or voice to create orders</li>
          <li>• The system supports market, limit, stop loss, and take profit orders</li>
          <li>• Orders are created as PENDING and must be executed manually</li>
          <li>• Currently the broker is in simulated mode for testing</li>
        </ul>
      </div>
    </div>
  )
}
