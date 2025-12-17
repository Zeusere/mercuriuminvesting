'use client'

import { StrategyBlock, ConditionalOperator, TechnicalIndicator, StrategyTree } from '@/types/strategy-builder'
import { useState } from 'react'

interface ConditionalBlockEditorProps {
  block: StrategyBlock
  strategy?: StrategyTree
  onUpdate: (updates: Partial<StrategyBlock>) => void
}

export default function ConditionalBlockEditor({ block, strategy, onUpdate }: ConditionalBlockEditorProps) {
  const condition = block.data.conditional?.condition || {
    leftOperand: { type: 'technical' as const, indicator: 'ema' as TechnicalIndicator, period: 20 },
    operator: 'greater_than' as ConditionalOperator,
    rightOperand: { type: 'indicator' as const, indicator: 'ema' as TechnicalIndicator, period: 50 }
  }

  const leftInd = condition.leftOperand.indicator
  const rightInd = condition.rightOperand.indicator
  
  const [leftIndicator, setLeftIndicator] = useState<TechnicalIndicator>(
    (leftInd && ['sma', 'ema', 'rsi', 'macd', 'bollinger_upper', 'bollinger_lower', 'volume', 'price', 'change_pct', 'volatility'].includes(leftInd))
      ? leftInd as TechnicalIndicator
      : 'ema'
  )
  const [leftPeriod, setLeftPeriod] = useState(condition.leftOperand.period || 20)
  const [leftSymbol, setLeftSymbol] = useState(condition.leftOperand.symbol || 'SPY')
  const [operator, setOperator] = useState(condition.operator)
  const [rightType, setRightType] = useState<'value' | 'indicator'>(condition.rightOperand.type === 'value' ? 'value' : 'indicator')
  const [rightValue, setRightValue] = useState(condition.rightOperand.value || 0)
  const [rightIndicator, setRightIndicator] = useState<TechnicalIndicator>(
    (rightInd && ['sma', 'ema', 'rsi', 'macd', 'bollinger_upper', 'bollinger_lower', 'volume', 'price', 'change_pct', 'volatility'].includes(rightInd))
      ? rightInd as TechnicalIndicator
      : 'ema'
  )
  const [rightPeriod, setRightPeriod] = useState(condition.rightOperand.period || 50)

  const handleSave = () => {
    onUpdate({
      data: {
        ...block.data,
        conditional: {
          condition: {
            leftOperand: {
              type: 'technical',
              indicator: leftIndicator as TechnicalIndicator,
              period: leftPeriod,
              symbol: leftSymbol
            },
            operator: operator as ConditionalOperator,
            rightOperand: rightType === 'value'
              ? { type: 'value', value: rightValue }
              : {
                  type: 'indicator',
                  indicator: rightIndicator as TechnicalIndicator,
                  period: rightPeriod
                }
          }
        }
      }
    })
  }

  const getConditionText = () => {
    const left = leftIndicator === 'price' ? 'current price' : `${leftIndicator.toUpperCase()} ${leftPeriod}d`
    const op = operator === 'greater_than' ? 'is greater than' : 
               operator === 'less_than' ? 'is less than' :
               operator === 'equal' ? 'equals' :
               operator === 'greater_equal' ? 'is greater than or equal to' :
               'is less than or equal to'
    const right = rightType === 'value' ? rightValue : `${rightIndicator.toUpperCase()} ${rightPeriod}d`
    return `${leftSymbol} ${left} ${op} ${right}`
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Condition Preview:</div>
        <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
          IF {getConditionText()}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Symbol
        </label>
        <input
          type="text"
          value={leftSymbol}
          onChange={(e) => setLeftSymbol(e.target.value.toUpperCase())}
          onBlur={handleSave}
          placeholder="Symbol (e.g., SPY)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Left Side (Indicator)
        </label>
        <div className="grid grid-cols-2 gap-2">
            <select
              value={leftIndicator}
              onChange={(e) => {
                setLeftIndicator(e.target.value as TechnicalIndicator)
                handleSave()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="price">Current Price</option>
              <option value="ema">EMA</option>
              <option value="sma">SMA</option>
              <option value="rsi">RSI</option>
              <option value="change_pct">Change %</option>
            </select>
          {leftIndicator !== 'price' && leftIndicator !== 'change_pct' && (
            <input
              type="number"
              value={leftPeriod}
              onChange={(e) => setLeftPeriod(parseInt(e.target.value) || 20)}
              onBlur={handleSave}
              placeholder="Period"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Operator
        </label>
        <select
          value={operator}
          onChange={(e) => {
            setOperator(e.target.value as ConditionalOperator)
            handleSave()
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="greater_than">is greater than (&gt;)</option>
          <option value="less_than">is less than (&lt;)</option>
          <option value="equal">equals (=)</option>
          <option value="greater_equal">is greater than or equal to (&gt;=)</option>
          <option value="less_equal">is less than or equal to (&lt;=)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Right Side (Compare To)
        </label>
        <select
          value={rightType}
          onChange={(e) => {
            setRightType(e.target.value as 'value' | 'indicator')
            handleSave()
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="value">Fixed Value</option>
          <option value="indicator">Another Indicator</option>
        </select>

        {rightType === 'value' ? (
          <input
            type="number"
            value={rightValue}
            onChange={(e) => setRightValue(parseFloat(e.target.value) || 0)}
            onBlur={handleSave}
            step="0.01"
            placeholder="Value"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={rightIndicator}
              onChange={(e) => {
                setRightIndicator(e.target.value as TechnicalIndicator)
                handleSave()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="ema">EMA</option>
              <option value="sma">SMA</option>
              <option value="rsi">RSI</option>
              <option value="price">Price</option>
            </select>
            <input
              type="number"
              value={rightPeriod}
              onChange={(e) => setRightPeriod(parseInt(e.target.value) || 50)}
              onBlur={handleSave}
              placeholder="Period"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Branches:</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <span className="text-sm text-green-700 dark:text-green-400">THEN:</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {block.data.conditional && 'trueBlockId' in block.data.conditional && block.data.conditional.trueBlockId && strategy
                ? strategy.blocks[block.data.conditional.trueBlockId]?.data.asset?.symbol || 'Configured'
                : 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <span className="text-sm text-red-700 dark:text-red-400">ELSE:</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {block.data.conditional && 'falseBlockId' in block.data.conditional && block.data.conditional.falseBlockId && strategy
                ? strategy.blocks[block.data.conditional.falseBlockId]?.data.asset?.symbol || 'Configured'
                : 'Not set'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

