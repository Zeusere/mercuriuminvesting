'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import StockSearch from './StockSearch'
import StockDetail from './StockDetail'
import { SearchResult } from '@/types/stocks'
import Navigation from './Navigation'

interface StocksPageContentProps {
  user: User
}

export default function StocksPageContent({ user }: StocksPageContentProps) {
  const [selectedStock, setSelectedStock] = useState<string | null>(null)

  const handleSelectStock = (stock: SearchResult) => {
    setSelectedStock(stock.symbol)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="stocks" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stocks Database</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore detailed information about any stock in the market
          </p>
        </div>

        {/* Búsqueda */}
        <div className="mb-8">
          <StockSearch
            onSelectStock={handleSelectStock}
            placeholder="Search by symbol or name (e.g. AAPL, Tesla, Microsoft...)"
          />
        </div>

        {/* Acciones populares */}
        {!selectedStock && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-4">Popular Stocks</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSelectedStock(symbol)}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <p className="font-bold text-lg">{symbol}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detalle de acción */}
        {selectedStock && (
          <div>
            <button
              onClick={() => setSelectedStock(null)}
              className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to search
            </button>
            <StockDetail symbol={selectedStock} />
          </div>
        )}
      </main>
    </div>
  )
}