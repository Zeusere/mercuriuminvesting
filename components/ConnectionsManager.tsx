'use client'

import { useState, useEffect } from 'react'
import { Building2, CheckCircle, AlertCircle, XCircle, Trash2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import PlaidLinkButton from './PlaidLinkButton'

interface Connection {
  id: string
  institution_name: string
  institution_id: string | null
  account_type: string
  status: 'active' | 'error' | 'disconnected' | 'reauth_required'
  last_synced_at: string | null
  error_message: string | null
  created_at: string
  stats: {
    total_accounts: number
    total_balance: number
    total_holdings: number
    total_holdings_value: number
  }
}

interface ConnectionsManagerProps {
  onConnectionChange?: () => void
}

export default function ConnectionsManager({ onConnectionChange }: ConnectionsManagerProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const loadConnections = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/plaid/connections')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to load connections')
      }

      setConnections(data.connections || [])
    } catch (err: any) {
      console.error('Error loading connections:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId)

    try {
      const response = await fetch('/api/plaid/sync-holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to sync holdings')
      }

      console.log('Holdings synced successfully:', data)
      
      // Recargar conexiones para mostrar los nuevos holdings
      await loadConnections()
      
      if (onConnectionChange) {
        onConnectionChange()
      }
    } catch (err: any) {
      console.error('Error syncing holdings:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this account? All data will be deleted.')) {
      return
    }

    setDeletingId(connectionId)

    try {
      const response = await fetch('/api/plaid/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to disconnect')
      }

      // Recargar conexiones
      await loadConnections()
      
      if (onConnectionChange) {
        onConnectionChange()
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-green-500" size={20} />
      case 'error':
        return <XCircle className="text-red-500" size={20} />
      case 'reauth_required':
        return <AlertCircle className="text-yellow-500" size={20} />
      default:
        return <AlertCircle className="text-gray-500" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'error':
        return 'Error'
      case 'reauth_required':
        return 'Re-auth Required'
      case 'disconnected':
        return 'Disconnected'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Connected Accounts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your connected brokerage accounts
          </p>
        </div>
        <PlaidLinkButton 
          onSuccess={() => {
            loadConnections()
            if (onConnectionChange) onConnectionChange()
          }}
        >
          Connect New Account
        </PlaidLinkButton>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Building2 className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Connected Accounts
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Use the "Connect New Account" button above to get started
          </p>
        </div>
      )}
      
      {connections.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {connection.institution_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                        <span className={`text-sm font-medium ${
                          connection.status === 'active' 
                            ? 'text-green-600 dark:text-green-400'
                            : connection.status === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {getStatusText(connection.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accounts</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {connection.stats.total_accounts}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Holdings</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {connection.stats.total_holdings}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${connection.stats.total_holdings_value.toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Sync</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {connection.last_synced_at 
                            ? formatDistanceToNow(new Date(connection.last_synced_at), { 
                                addSuffix: true,
                                locale: es 
                              })
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {connection.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {connection.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(connection.id)}
                    disabled={syncingId === connection.id}
                    className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Sync holdings now"
                  >
                    <RefreshCw className={syncingId === connection.id ? "animate-spin" : ""} size={20} />
                  </button>
                  
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    disabled={deletingId === connection.id}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Disconnect account"
                  >
                    {deletingId === connection.id ? (
                      <RefreshCw className="animate-spin" size={20} />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

