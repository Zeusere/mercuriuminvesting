'use client'

import React, { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Loader2, Link as LinkIcon } from 'lucide-react'

interface PlaidLinkButtonProps {
  onSuccess?: () => void
  onExit?: () => void
  className?: string
  children?: React.ReactNode
}

export default function PlaidLinkButton({ 
  onSuccess, 
  onExit,
  className = '',
  children 
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Configuración de Plaid Link
  const config = {
    token: linkToken,
    onSuccess: useCallback(async (public_token: string, metadata: any) => {
      console.log('Plaid Link success:', metadata)
      setIsLoading(true)
      setError(null)

      try {
        // Intercambiar public_token por access_token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token, metadata }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to connect account')
        }

        console.log('Token exchanged successfully:', data)
        
        // Callback de éxito
        if (onSuccess) {
          onSuccess()
        }
      } catch (err: any) {
        console.error('Error exchanging token:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }, [onSuccess]),
    onExit: useCallback((err: any, metadata: any) => {
      console.log('Plaid Link exit:', err, metadata)
      if (onExit) {
        onExit()
      }
      if (err) {
        setError(err.error_message || 'Connection cancelled')
      }
    }, [onExit]),
    // Configuración para evitar detección automática de extensiones
    receivedRedirectUri: undefined,
  }

  const { open, ready } = usePlaidLink(config)

  // Crear link token cuando se hace click
  const handleClick = async () => {
    if (isLoading) return // Prevenir múltiples clicks
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create link token')
      }

      console.log('Link token created:', data.link_token)
      setLinkToken(data.link_token)
      
      // Abrir Plaid Link inmediatamente después de crear el token
      // Usar requestAnimationFrame para asegurar que el estado se actualice
      requestAnimationFrame(() => {
        if (ready) {
          open()
        }
      })
    } catch (err: any) {
      console.error('Error creating link token:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Abrir Plaid Link cuando el token esté listo
  React.useEffect(() => {
    if (linkToken && ready && !isLoading) {
      open()
    }
  }, [linkToken, ready, isLoading, open])

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading || (linkToken !== null && !ready)}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 
          bg-gradient-to-r from-purple-600 to-blue-600 
          text-white font-semibold rounded-lg
          hover:from-purple-700 hover:to-blue-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          shadow-lg hover:shadow-xl
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <LinkIcon size={20} />
            <span>{children || 'Connect Broker Account'}</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

