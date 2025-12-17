'use client'

import { StrategyBlock, WeightType } from '@/types/strategy-builder'
import { useState } from 'react'

interface WeightBlockEditorProps {
  block: StrategyBlock
  onUpdate: (updates: Partial<StrategyBlock>) => void
}

export default function WeightBlockEditor({ block, onUpdate }: WeightBlockEditorProps) {
  const [type, setType] = useState<WeightType>(block.data.weight?.type || 'specified')
  const [value, setValue] = useState(block.data.weight?.value || 0)
  const [period, setPeriod] = useState(block.data.weight?.period || 30)

  const handleSave = () => {
    onUpdate({
      data: {
        ...block.data,
        weight: {
          type,
          value: type === 'specified' ? value : undefined,
          period: type === 'inverse_volatility' ? period : undefined
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Weight Type
        </label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as WeightType)
            handleSave()
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="specified">Specified (Fixed %)</option>
          <option value="equal">Equal Weight</option>
          <option value="inverse_volatility">Inverse Volatility</option>
          <option value="market_cap">Market Cap Weighted</option>
        </select>
      </div>

      {type === 'specified' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Percentage (%)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            onBlur={handleSave}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {type === 'inverse_volatility' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Period (days)
          </label>
          <input
            type="number"
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value) || 30)}
            onBlur={handleSave}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}
    </div>
  )
}

