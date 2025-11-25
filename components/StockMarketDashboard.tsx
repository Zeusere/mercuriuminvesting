'use client'

import { useEffect, useState } from 'react'

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  trend: number[] // Array of prices for line graph
}

const generateStockData = (): StockData[] => {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
  return symbols.map(symbol => {
    const basePrice = Math.random() * 500 + 50
    const change = (Math.random() - 0.5) * 20
    const changePercent = (change / basePrice) * 100
    const trend = Array.from({ length: 20 }, () => basePrice + (Math.random() - 0.5) * 30)
    return {
      symbol,
      price: basePrice,
      change,
      changePercent,
      trend
    }
  })
}

export default function StockMarketDashboard() {
  const [stocks, setStocks] = useState<StockData[]>(generateStockData())

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const volatility = 0.02
          const change = (Math.random() - 0.5) * stock.price * volatility
          const newPrice = Math.max(10, stock.price + change)
          const newChange = stock.change + change
          const newChangePercent = (newChange / (newPrice - newChange)) * 100
          
          // Update trend array (shift and add new value)
          const newTrend = [...stock.trend.slice(1), newPrice]
          
          return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            trend: newTrend
          }
        })
      )
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [])

  const renderLineGraph = (trend: number[]) => {
    const width = 80
    const height = 30
    const min = Math.min(...trend)
    const max = Math.max(...trend)
    const range = max - min || 1
    
    const points = trend.map((price, index) => {
      const x = (index / (trend.length - 1)) * width
      const y = height - ((price - min) / range) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="block">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <div className="relative bg-white border-4 border-black">
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10 p-4 space-y-0 border-b-4 border-black">
        <div className="text-black font-impact text-2xl tracking-tight mb-4">
          MARKET DATA
        </div>
        
        <div className="space-y-0 relative z-10">
          {stocks.map((stock, index) => {
            const isPositive = stock.change >= 0
            const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
            
            return (
              <div 
                key={stock.symbol}
                className={`grid grid-cols-4 gap-4 items-center py-3 border-b-2 border-black last:border-b-0 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                }`}
              >
                <div className="font-impact text-lg tracking-tighter text-black">
                  {stock.symbol}
                </div>
                
                <div className="font-impact text-base text-black">
                  ${stock.price.toFixed(2)}
                </div>
                
                <div className={`font-impact text-base ${colorClass}`}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div>
                
                <div className={colorClass}>
                  {renderLineGraph(stock.trend)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

