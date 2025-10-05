'use client'

import { useState, useEffect } from 'react'
import { TradingOrder } from '@/types/trading'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play,
  Loader2,
  Shield,
  Target
} from 'lucide-react'

interface OrdersListProps {
  refreshTrigger?: number
}

export default function OrdersList({ refreshTrigger }: OrdersListProps) {
  const [orders, setOrders] = useState<TradingOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'FILLED'>('ALL')
  const [executingOrderId, setExecutingOrderId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [refreshTrigger])

  const executeOrder = async (orderId: string) => {
    try {
      setExecutingOrderId(orderId)
      const response = await fetch('/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        await fetchOrders()
      }
    } catch (error) {
      console.error('Error executing order:', error)
    } finally {
      setExecutingOrderId(null)
    }
  }

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusIcon = (status: TradingOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={20} />
      case 'ACTIVE':
        return <Play className="text-blue-500" size={20} />
      case 'FILLED':
        return <CheckCircle2 className="text-green-500" size={20} />
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="text-red-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  const getStatusColor = (status: TradingOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      case 'ACTIVE':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      case 'FILLED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mis Órdenes</h2>
        
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'FILLED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendientes' : 'Ejecutadas'}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No hay órdenes {filter === 'ALL' ? '' : filter.toLowerCase()}</p>
          <p className="text-sm">Crea tu primera orden usando el formulario de arriba</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {order.side === 'BUY' ? (
                    <TrendingUp className="text-green-500" size={24} />
                  ) : (
                    <TrendingDown className="text-red-500" size={24} />
                  )}
                  <div>
                    <h3 className="text-lg font-bold">{order.symbol}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.side} • {order.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {getStatusIcon(order.status)}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  &quot;{order.raw_input}&quot;
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {order.parsed_intent}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                {order.quantity && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cantidad</p>
                    <p className="font-semibold">{order.quantity} acciones</p>
                  </div>
                )}
                {order.amount && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Importe</p>
                    <p className="font-semibold">{order.amount} EUR</p>
                  </div>
                )}
                {order.price && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Precio Límite</p>
                    <p className="font-semibold">{order.price.toFixed(2)} USD</p>
                  </div>
                )}
                {order.execution_price && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Precio Ejecución</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {order.execution_price.toFixed(2)} USD
                    </p>
                  </div>
                )}
              </div>

              {(order.stop_loss || order.take_profit) && (
                <div className="flex gap-4 mb-3">
                  {order.stop_loss && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="text-red-500" size={16} />
                      <span className="text-gray-600 dark:text-gray-400">
                        Stop Loss: 
                      </span>
                      <span className="font-semibold">
                        {order.stop_loss.value} {order.stop_loss.type === 'PERCENTAGE' ? '%' : 'EUR'}
                      </span>
                    </div>
                  )}
                  {order.take_profit && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="text-green-500" size={16} />
                      <span className="text-gray-600 dark:text-gray-400">
                        Take Profit:
                      </span>
                      <span className="font-semibold">
                        {order.take_profit.value} {order.take_profit.type === 'PERCENTAGE' ? '%' : 'EUR'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Creada: {new Date(order.created_at).toLocaleString('es-ES')}
                  {order.executed_at && (
                    <> • Ejecutada: {new Date(order.executed_at).toLocaleString('es-ES')}</>
                  )}
                </div>

                {order.status === 'PENDING' && (
                  <button
                    onClick={() => executeOrder(order.id)}
                    disabled={executingOrderId === order.id}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                  >
                    {executingOrderId === order.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Ejecutar Orden
                      </>
                    )}
                  </button>
                )}

                {order.broker_order_id && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID Broker: {order.broker_order_id}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

