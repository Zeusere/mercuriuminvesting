'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import { StockCandle } from '@/types/stocks'
import { subYears, format } from 'date-fns'

interface StockChartProps {
  symbol: string
  period?: '1M' | '3M' | '6M' | '1Y' | '5Y'
}

interface ChartDataPoint {
  date: string
  price: number
  timestamp: number
}

export default function StockChart({ symbol, period = '1Y' }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPositive, setIsPositive] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [symbol, period])

  const fetchChartData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Calcular fechas según el periodo
      const to = Math.floor(Date.now() / 1000)
      let from: number

      switch (period) {
        case '1M':
          from = Math.floor(subYears(new Date(), 1 / 12).getTime() / 1000)
          break
        case '3M':
          from = Math.floor(subYears(new Date(), 0.25).getTime() / 1000)
          break
        case '6M':
          from = Math.floor(subYears(new Date(), 0.5).getTime() / 1000)
          break
        case '5Y':
          from = Math.floor(subYears(new Date(), 5).getTime() / 1000)
          break
        default:
          from = Math.floor(subYears(new Date(), 1).getTime() / 1000)
      }

      const response = await fetch(
        `/api/stocks/candles?symbol=${symbol}&from=${from}&to=${to}&resolution=D`
      )

      if (!response.ok) {
        throw new Error('Error fetching chart data')
      }

      const data: StockCandle = await response.json()

      if (!data.t || data.t.length === 0) {
        throw new Error('No data available for this period')
      }

      // Convertir datos al formato para recharts
      const formattedData: ChartDataPoint[] = data.t.map((timestamp, index) => ({
        date: format(new Date(timestamp * 1000), 'MMM dd, yyyy'),
        price: data.c[index],
        timestamp,
      }))

      setChartData(formattedData)
      
      // Determinar color basado en la tendencia
      const firstPrice = formattedData[0]?.price || 0
      const lastPrice = formattedData[formattedData.length - 1]?.price || 0
      setIsPositive(lastPrice >= firstPrice)

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading chart data:', err)
      setError(err instanceof Error ? err.message : 'Error loading chart')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 rounded-lg">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {!isLoading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return format(date, 'MMM dd')
              }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Precio']}
              labelFormatter={(label) => label}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositive ? '#10B981' : '#EF4444'}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
