'use client'

import { StrategyBlock, StrategyTree } from '@/types/strategy-builder'
import { Play, Loader2 } from 'lucide-react'
import AssetBlockEditor from './block-editors/AssetBlockEditor'
import WeightBlockEditor from './block-editors/WeightBlockEditor'
import ConditionalBlockEditor from './block-editors/ConditionalBlockEditor'
import FilterBlockEditor from './block-editors/FilterBlockEditor'
import GroupBlockEditor from './block-editors/GroupBlockEditor'

interface StrategySidebarProps {
  block: StrategyBlock | null
  strategy?: StrategyTree
  onUpdate: (updates: Partial<StrategyBlock>) => void
  onBacktest?: () => void
  isLoadingBacktest?: boolean
}

export default function StrategySidebar({ block, strategy, onUpdate, onBacktest, isLoadingBacktest }: StrategySidebarProps) {
  if (!block) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* Run Backtest Button at the top */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onBacktest}
            disabled={isLoadingBacktest}
            className="w-full flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingBacktest ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Backtest
              </>
            )}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Select a block to edit</p>
          </div>
        </div>
      </div>
    )
  }

  const renderEditor = () => {
    switch (block.type) {
      case 'asset':
        return <AssetBlockEditor block={block} onUpdate={onUpdate} />
      case 'weight':
        return <WeightBlockEditor block={block} onUpdate={onUpdate} />
      case 'conditional':
        return <ConditionalBlockEditor block={block} strategy={strategy} onUpdate={onUpdate} />
      case 'filter':
        return <FilterBlockEditor block={block} onUpdate={onUpdate} />
      case 'group':
        return <GroupBlockEditor block={block} onUpdate={onUpdate} />
      default:
        return <div>Unknown block type</div>
    }
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Run Backtest Button at the top */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBacktest}
          disabled={isLoadingBacktest}
          className="w-full flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingBacktest ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Backtest
            </>
          )}
        </button>
      </div>

      {/* Scrollable editor content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Block Details
          </h2>
          {renderEditor()}
        </div>
      </div>
    </div>
  )
}

