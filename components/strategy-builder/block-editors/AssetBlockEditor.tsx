'use client'

import { StrategyBlock } from '@/types/strategy-builder'
import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { SearchResult } from '@/types/stocks'

interface AssetBlockEditorProps {
  block: StrategyBlock
  onUpdate: (updates: Partial<StrategyBlock>) => void
}

export default function AssetBlockEditor({ block, onUpdate }: AssetBlockEditorProps) {
  const [query, setQuery] = useState(block.data.asset?.symbol || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; name: string } | null>(
    block.data.asset?.symbol ? { symbol: block.data.asset.symbol, name: block.data.asset.name || '' } : null
  )
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error('Error searching stocks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchStocks, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (stock: SearchResult) => {
    setSelectedAsset({ symbol: stock.symbol, name: stock.description || '' })
    setQuery(stock.symbol)
    setShowResults(false)
    onUpdate({
      data: {
        ...block.data,
        asset: { symbol: stock.symbol, name: stock.description || '' }
      }
    })
  }

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Search Asset
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search stocks or ETFs (e.g., SPY, GLD, META)"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 animate-spin" />
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto z-50">
            {results.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelect(stock)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedAsset?.symbol === stock.symbol 
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedAsset?.symbol === stock.symbol && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{stock.symbol}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stock.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedAsset && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-300">Selected:</div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              {selectedAsset.symbol} {selectedAsset.name && `- ${selectedAsset.name}`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

