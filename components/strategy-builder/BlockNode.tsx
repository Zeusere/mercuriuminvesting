'use client'

import { StrategyBlock, BlockType } from '@/types/strategy-builder'
import { Target, Scale, GitBranch, Filter, Folder, Plus, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface BlockNodeProps {
  block: StrategyBlock
  isSelected: boolean
  isDropZone?: boolean
  depth: number
  isConditionalBranch?: 'then' | 'else' | null
  onSelect: () => void
  onAddChild: (type: BlockType, conditionalBranch?: 'then' | 'else') => void
  onUpdate: (updates: Partial<StrategyBlock>) => void
  onDelete: () => void
}

const blockIcons = {
  asset: Target,
  weight: Scale,
  conditional: GitBranch,
  filter: Filter,
  group: Folder
}

const blockColors = {
  asset: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
  weight: 'bg-green-600 dark:bg-green-500 text-white',
  conditional: 'bg-blue-500 dark:bg-blue-600 text-white',
  filter: 'bg-pink-500 dark:bg-pink-600 text-white',
  group: 'bg-gray-700 dark:bg-gray-600 text-white'
}

export default function BlockNode({
  block,
  isSelected,
  isDropZone = false,
  depth,
  isConditionalBranch = null,
  onSelect,
  onAddChild,
  onUpdate,
  onDelete
}: BlockNodeProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const Icon = blockIcons[block.type]
  const colorClass = blockColors[block.type]

  const getBlockLabel = () => {
    switch (block.type) {
      case 'asset':
        const asset = block.data.asset
        if (asset?.symbol) {
          return asset.symbol
        }
        return 'Add Asset'
      case 'weight':
        if (block.data.weight?.type === 'specified') {
          return `WEIGHT Specified`
        } else if (block.data.weight?.type === 'equal') {
          return 'WEIGHT Equal'
        } else if (block.data.weight?.type === 'inverse_volatility') {
          return `WEIGHT Inverse Volatility ${block.data.weight.period}d`
        }
        return 'WEIGHT'
      case 'conditional':
        const condition = block.data.conditional?.condition
        if (condition) {
          const symbol = condition.leftOperand.symbol || 'SPY'
          const left = condition.leftOperand.indicator === 'price' 
            ? 'current price' 
            : `${condition.leftOperand.indicator?.toUpperCase()} ${condition.leftOperand.period || 20}d`
          const op = condition.operator === 'greater_than' ? 'is greater than' :
                     condition.operator === 'less_than' ? 'is less than' :
                     condition.operator === 'equal' ? 'equals' :
                     condition.operator === 'greater_equal' ? 'is greater than or equal to' :
                     'is less than or equal to'
          const right = condition.rightOperand.type === 'value' 
            ? condition.rightOperand.value 
            : `${condition.rightOperand.indicator?.toUpperCase()} ${condition.rightOperand.period || 50}d`
          return `IF current price of ${symbol} ${left} ${op} the ${right} of price of ${symbol}`
        }
        return 'IF Condition'
      case 'filter':
        return 'SORT & FILTER'
      case 'group':
        return block.data.group?.name || 'My Strategy'
      default:
        return 'Block'
    }
  }

  const getWeightValue = () => {
    if (block.type === 'weight' && block.data.weight?.type === 'specified') {
      return block.data.weight.value
    }
    return null
  }

  const renderAssetContent = () => {
    if (block.type !== 'asset') return null
    const asset = block.data.asset
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="w-4 h-4 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center">
          {asset?.symbol && <div className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-300" />}
        </div>
        <div className="flex-1 text-left">
          {asset?.symbol ? (
            <div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</span>
              {asset.name && <span className="text-gray-600 dark:text-gray-400 ml-2">{asset.name}</span>}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Select asset...</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        onClick={onSelect}
        className={`
          relative min-w-[280px] rounded-lg cursor-pointer transition-all
          ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-xl scale-105' : 'shadow-md'}
          ${isDropZone ? 'ring-2 ring-dashed ring-blue-400 dark:ring-blue-500' : ''}
          ${colorClass}
          ${block.type === 'asset' ? 'hover:border-blue-500 dark:hover:border-blue-400' : ''}
        `}
      >
        {block.type === 'weight' && getWeightValue() !== null ? (
          // Weight block with percentage badge
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm flex-1">{getBlockLabel()}</span>
              <div className="bg-white/20 dark:bg-white/30 px-3 py-1 rounded-full text-sm font-bold">
                {getWeightValue()}%
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-70" />
            </div>
          </div>
        ) : block.type === 'asset' ? (
          // Asset block with radio button style
          <div className="px-4 py-3">
            {renderAssetContent()}
          </div>
        ) : (
          // Other blocks
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 w-full">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm flex-1">{getBlockLabel()}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-70" />
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="ml-2 hover:bg-black/10 dark:hover:bg-white/10 rounded p-1 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isSelected && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAddMenu(!showAddMenu)
            }}
            className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-600 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
          
          {showAddMenu && (
            <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 min-w-[220px]">
              {block.type === 'conditional' && block.data.conditional && 'trueBlockId' in block.data.conditional ? (
                // For conditional blocks, show THEN/ELSE options
                <>
                  {!block.data.conditional.trueBlockId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddChild('asset', 'then')
                        setShowAddMenu(false)
                      }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 text-sm transition-colors border-l-2 border-green-500 dark:border-green-400 text-gray-900 dark:text-gray-100"
                  >
                    <Target className="w-4 h-4" />
                    <span>Add THEN (Asset)</span>
                  </button>
                  )}
                  {!block.data.conditional.falseBlockId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddChild('asset', 'else')
                        setShowAddMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm transition-colors border-l-2 border-red-500 dark:border-red-400 mt-1 text-gray-900 dark:text-gray-100"
                    >
                      <Target className="w-4 h-4" />
                      <span>Add ELSE (Asset)</span>
                    </button>
                  )}
                </>
              ) : (
                // For other blocks, show all block types
                (['asset', 'weight', 'conditional', 'filter', 'group'] as BlockType[]).map((type) => {
                  const TypeIcon = blockIcons[type]
                  return (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddChild(type)
                        setShowAddMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors text-gray-900 dark:text-gray-100"
                    >
                      <TypeIcon className="w-4 h-4" />
                      <span className="capitalize">{type}</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Conditional branch labels */}
      {isConditionalBranch && (
        <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold ${
          isConditionalBranch === 'then' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isConditionalBranch === 'then' ? 'THEN' : 'ELSE'}
        </div>
      )}
    </div>
  )
}

