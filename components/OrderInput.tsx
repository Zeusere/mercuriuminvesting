'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { OrderParseResult } from '@/types/trading'

interface OrderInputProps {
  onOrderCreated: () => void
}

export default function OrderInput({ onOrderCreated }: OrderInputProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<OrderParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Inicializar Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'es-ES'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setError('Error en el reconocimiento de voz')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Reconocimiento de voz no disponible en este navegador')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setError(null)
      setResult(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      // 1. Parsear la orden con AI
      const parseResponse = await fetch('/api/orders/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })

      if (!parseResponse.ok) {
        throw new Error('Error al procesar la orden')
      }

      const parseResult: OrderParseResult = await parseResponse.json()
      setResult(parseResult)

      if (!parseResult.success) {
        setError(parseResult.error || 'No se pudo procesar la orden')
        return
      }

      // 2. Crear la orden en la base de datos
      const createResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parseResult.order),
      })

      if (!createResponse.ok) {
        throw new Error('Error al crear la orden')
      }

      // Limpiar y notificar éxito
      setInput('')
      setTimeout(() => {
        setResult(null)
        onOrderCreated()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Nueva Orden de Trading</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ejemplo: Comprar Palantir pero si pierdo 1000 euros cerrar la operación"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={isProcessing || isListening}
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Escuchando...</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={toggleListening}
            className={`px-4 py-3 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            type="submit"
            className="btn-primary px-6 py-3 flex items-center gap-2"
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Send size={20} />
                Crear Orden
              </>
            )}
          </button>
        </div>

        {/* Ejemplos */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Ejemplos:</span>
          <button
            type="button"
            onClick={() => setInput('Comprar 100 acciones de Apple a 175 dólares')}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Orden límite
          </button>
          <button
            type="button"
            onClick={() => setInput('Comprar Palantir por 5000 euros con stop loss del 10%')}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Con stop loss
          </button>
          <button
            type="button"
            onClick={() => setInput('Vender 50 Tesla y tomar beneficios al 15%')}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Con take profit
          </button>
        </div>
      </form>

      {/* Resultado del parsing */}
      {result && result.success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-200 mb-1">
                Orden creada exitosamente
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                {result.interpretation}
              </p>
              <div className="text-xs space-y-1 text-green-600 dark:text-green-400">
                <p>• Símbolo: <strong>{result.order?.symbol}</strong></p>
                <p>• Tipo: <strong>{result.order?.side}</strong> - {result.order?.type}</p>
                {result.order?.quantity && <p>• Cantidad: <strong>{result.order.quantity}</strong> acciones</p>}
                {result.order?.amount && <p>• Importe: <strong>{result.order.amount}</strong> EUR</p>}
                {result.order?.stop_loss && (
                  <p>• Stop Loss: <strong>{result.order.stop_loss.value}</strong> {result.order.stop_loss.type === 'PERCENTAGE' ? '%' : 'EUR'}</p>
                )}
                {result.order?.take_profit && (
                  <p>• Take Profit: <strong>{result.order.take_profit.value}</strong> {result.order.take_profit.type === 'PERCENTAGE' ? '%' : 'EUR'}</p>
                )}
                <p className="mt-2">• Confianza: <strong>{result.confidence}%</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

