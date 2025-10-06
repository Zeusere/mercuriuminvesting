import { NextRequest, NextResponse } from 'next/server'
import { getAlpacaClient, hasAlpacaKey } from '@/lib/alpaca/client'
import { PortfolioStock, BacktestResult, StockPerformance, MultiPeriodBacktest } from '@/types/stocks'
import { subYears, subMonths, startOfYear, format } from 'date-fns'

interface StockHistoricalData {
  dates: number[]
  closes: number[]
}

async function fetchStockHistory(
  symbol: string,
  from: number,
  to: number
): Promise<StockHistoricalData> {
  const client = getAlpacaClient()
  
  // Convertir timestamps unix a formato ISO
  const startDate = new Date(from * 1000).toISOString()
  const endDate = new Date(to * 1000).toISOString()

  // Obtener datos históricos de Alpaca usando el feed IEX (gratuito)
  const bars = await client.getBarsV2(symbol, {
    start: startDate,
    end: endDate,
    timeframe: '1Day',
    limit: 10000,
    feed: 'iex' // Usar feed IEX para plan gratuito
  })

  const dates: number[] = []
  const closes: number[] = []

  for await (const bar of bars) {
    dates.push(Math.floor(new Date(bar.Timestamp).getTime() / 1000))
    closes.push(bar.ClosePrice)
  }
  
  return {
    dates,
    closes,
  }
}

function calculatePortfolioBacktest(
  stocks: PortfolioStock[],
  historicalData: Map<string, StockHistoricalData>,
  totalAmount: number,
  periodLabel: string
): BacktestResult {
  // Obtener todas las fechas comunes a todas las acciones
  const allDates = Array.from(historicalData.values())
    .map(data => data.dates)
    .reduce((acc, dates) => {
      if (acc.length === 0) return dates
      return acc.filter(date => dates.includes(date))
    }, [] as number[])
    .sort()

  if (allDates.length === 0) {
    throw new Error('No hay datos históricos comunes para las acciones seleccionadas')
  }

  const historicalValues: Array<{ date: string; value: number; return: number }> = []
  let initialValue = totalAmount

  allDates.forEach((timestamp, index) => {
    let portfolioValue = 0

    stocks.forEach(stock => {
      const data = historicalData.get(stock.symbol)
      if (!data) return

      const priceIndex = data.dates.indexOf(timestamp)
      if (priceIndex === -1) return

      const price = data.closes[priceIndex]
      const allocation = (stock.weight / 100) * totalAmount
      
      // Si es el primer día, calculamos las shares que compramos
      if (index === 0) {
        const shares = allocation / price
        portfolioValue += shares * price
      } else {
        // Para días subsiguientes, usamos el precio inicial para calcular shares
        const initialPrice = data.closes[data.dates.indexOf(allDates[0])]
        const shares = allocation / initialPrice
        portfolioValue += shares * price
      }
    })

    const returnPercent = index === 0 ? 0 : ((portfolioValue - initialValue) / initialValue) * 100

    historicalValues.push({
      date: format(new Date(timestamp * 1000), 'yyyy-MM-dd'),
      value: portfolioValue,
      return: returnPercent,
    })
  })

  const finalValue = historicalValues[historicalValues.length - 1].value
  const totalReturn = ((finalValue - initialValue) / initialValue) * 100

  // Calcular retorno anualizado
  const years = historicalValues.length / 252 // 252 trading days per year
  const annualizedReturn = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100

  // Calcular volatilidad (desviación estándar de retornos diarios)
  const dailyReturns = historicalValues.slice(1).map((val, i) => {
    return (val.value - historicalValues[i].value) / historicalValues[i].value
  })
  
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
  const variance = dailyReturns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized

  // Calcular Sharpe Ratio (asumiendo risk-free rate de 2%)
  const riskFreeRate = 2
  const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility

  // Calcular Max Drawdown
  let maxDrawdown = 0
  let peak = initialValue
  
  historicalValues.forEach(point => {
    if (point.value > peak) {
      peak = point.value
    }
    const drawdown = ((peak - point.value) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })

  // Calcular rendimiento individual de cada acción
  const stockPerformance: StockPerformance[] = stocks.map(stock => {
    const data = historicalData.get(stock.symbol)
    if (!data || data.closes.length === 0) {
      return {
        symbol: stock.symbol,
        name: stock.name,
        weight: stock.weight,
        initial_price: 0,
        final_price: 0,
        return_percent: 0,
        contribution_to_portfolio: 0,
      }
    }

    const initialPrice = data.closes[0]
    const finalPrice = data.closes[data.closes.length - 1]
    const returnPercent = ((finalPrice - initialPrice) / initialPrice) * 100
    
    // Contribución al retorno total del portfolio (ponderado por peso)
    const contributionToPortfolio = (stock.weight / 100) * returnPercent

    return {
      symbol: stock.symbol,
      name: stock.name,
      weight: stock.weight,
      initial_price: initialPrice,
      final_price: finalPrice,
      return_percent: returnPercent,
      contribution_to_portfolio: contributionToPortfolio,
    }
  })

  return {
    initial_value: initialValue,
    final_value: finalValue,
    total_return: totalReturn,
    annualized_return: annualizedReturn,
    volatility,
    sharpe_ratio: sharpeRatio,
    max_drawdown: maxDrawdown,
    period_label: periodLabel,
    historical_values: historicalValues,
    stock_performance: stockPerformance,
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAlpacaKey()) {
      return NextResponse.json(
        { error: 'Alpaca API keys not configured. Please set ALPACA_API_KEY and ALPACA_API_SECRET in your .env.local file' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { stocks, totalAmount, total_amount } = body
    const amount = totalAmount || total_amount || 10000

    if (!stocks || stocks.length === 0) {
      return NextResponse.json(
        { error: 'Stocks array is required' },
        { status: 400 }
      )
    }

    // Validar que los pesos sumen 100%
    const totalWeight = stocks.reduce((sum: number, stock: PortfolioStock) => sum + stock.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Stock weights must sum to 100%' },
        { status: 400 }
      )
    }

    const now = new Date()
    const to = Math.floor(now.getTime() / 1000)

    // Definir todos los períodos
    const periods = [
      { key: '1M', from: Math.floor(subMonths(now, 1).getTime() / 1000), label: 'Último Mes' },
      { key: '3M', from: Math.floor(subMonths(now, 3).getTime() / 1000), label: 'Últimos 3 Meses' },
      { key: 'YTD', from: Math.floor(startOfYear(now).getTime() / 1000), label: 'Año en Curso (YTD)' },
      { key: '1Y', from: Math.floor(subYears(now, 1).getTime() / 1000), label: 'Último Año' },
      { key: '3Y', from: Math.floor(subYears(now, 3).getTime() / 1000), label: 'Últimos 3 Años' },
      { key: '5Y', from: Math.floor(subYears(now, 5).getTime() / 1000), label: 'Últimos 5 Años' },
    ]

    // Obtener datos para el período más largo (5 años)
    const from5Y = Math.floor(subYears(now, 5).getTime() / 1000)
    const allHistoricalData = new Map<string, StockHistoricalData>()
    
    await Promise.all(
      stocks.map(async (stock: PortfolioStock) => {
        try {
          const data = await fetchStockHistory(stock.symbol, from5Y, to)
          allHistoricalData.set(stock.symbol, data)
        } catch (error) {
          console.error(`Error fetching history for ${stock.symbol}:`, error)
        }
      })
    )

    if (allHistoricalData.size === 0) {
      return NextResponse.json(
        { error: 'No se pudieron obtener datos históricos' },
        { status: 500 }
      )
    }

    // Calcular backtest para cada período
    const results: any = {}

    for (const period of periods) {
      // Filtrar datos históricos para este período
      const periodData = new Map<string, StockHistoricalData>()
      
      allHistoricalData.forEach((data, symbol) => {
        const filteredDates: number[] = []
        const filteredCloses: number[] = []
        
        data.dates.forEach((date, index) => {
          if (date >= period.from && date <= to) {
            filteredDates.push(date)
            filteredCloses.push(data.closes[index])
          }
        })
        
        if (filteredDates.length > 0) {
          periodData.set(symbol, {
            dates: filteredDates,
            closes: filteredCloses,
          })
        }
      })

      // Calcular backtest para este período
      if (periodData.size > 0) {
        try {
          results[period.key] = calculatePortfolioBacktest(
            stocks,
            periodData,
            amount,
            period.label
          )
        } catch (error) {
          console.error(`Error calculating backtest for ${period.key}:`, error)
          // Continuar con otros períodos
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in backtest:', error)
    return NextResponse.json(
      { 
        error: 'Error calculating backtest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
