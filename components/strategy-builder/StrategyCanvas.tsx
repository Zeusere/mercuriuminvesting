'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { StrategyTree, StrategyBlock, BlockType } from '@/types/strategy-builder'
import { Undo, Redo } from 'lucide-react'
import BlockNode from './BlockNode'

interface StrategyCanvasProps {
  strategy: StrategyTree
  selectedBlockId: string | null
  onBlockSelect: (blockId: string | null) => void
  onBlockAdd: (type: BlockType, parentId: string, conditionalBranch?: 'then' | 'else') => void
  onBlockUpdate: (blockId: string, updates: Partial<StrategyBlock>) => void
  onBlockDelete: (blockId: string) => void
}

export default function StrategyCanvas({
  strategy,
  selectedBlockId,
  onBlockSelect,
  onBlockAdd,
  onBlockUpdate,
  onBlockDelete
}: StrategyCanvasProps) {
  const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(null)
  const [dropZone, setDropZone] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate minimum height based on strategy depth
  const calculateMinHeight = useCallback(() => {
    const calculateDepth = (blockId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(blockId)) return 0
      visited.add(blockId)
      const block = strategy.blocks[blockId]
      if (!block || block.children.length === 0) return 1
      return 1 + Math.max(...block.children.map(childId => calculateDepth(childId, visited)))
    }
    const depth = calculateDepth(strategy.rootBlockId)
    return Math.max(window.innerHeight - 200, depth * 200)
  }, [strategy])

  const [minHeight, setMinHeight] = useState(calculateMinHeight())

  useEffect(() => {
    setMinHeight(calculateMinHeight())
  }, [strategy, calculateMinHeight])

  const handleDrop = useCallback((e: React.DragEvent, parentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const blockType = e.dataTransfer.getData('blockType') as BlockType
    if (blockType && parentId) {
      onBlockAdd(blockType, parentId)
    }
    setDropZone(null)
  }, [onBlockAdd])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDropZone(blockId)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone(null)
    }
  }, [])

  const renderBlock = (blockId: string, depth: number = 0, isConditionalBranch: 'then' | 'else' | null = null): JSX.Element | null => {
    const block = strategy.blocks[blockId]
    if (!block) return null

    const isConditional = block.type === 'conditional'
    const conditionalData = block.data.conditional
    const isWeight = block.type === 'weight'

    return (
      <div key={blockId} className="relative flex flex-col items-center">
        {/* Connection line from parent */}
        {depth > 0 && (
          <div className={`w-0.5 h-6 mb-1 ${
            isConditionalBranch === 'then' ? 'bg-green-500 dark:bg-green-400' :
            isConditionalBranch === 'else' ? 'bg-red-500 dark:bg-red-400' :
            'bg-gray-400 dark:bg-gray-600'
          }`} />
        )}

        {/* Block Node */}
        <div
          className="relative"
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, blockId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, blockId)}
        >
          <BlockNode
            block={block}
            isSelected={selectedBlockId === blockId}
            isDropZone={dropZone === blockId}
            depth={depth}
            isConditionalBranch={isConditionalBranch}
            onSelect={() => onBlockSelect(blockId)}
            onAddChild={(type, branch) => onBlockAdd(type, blockId, branch)}
            onUpdate={(updates) => onBlockUpdate(blockId, updates)}
            onDelete={() => onBlockDelete(blockId)}
          />
        </div>

        {/* Children rendering */}
        {(block.children.length > 0 || (isConditional && conditionalData && 'trueBlockId' in conditionalData)) && (
          <div className="mt-6 flex flex-col items-center">
            {isConditional && conditionalData && 'trueBlockId' in conditionalData ? (
              // Conditional blocks: render THEN and ELSE branches side by side
              <div className="flex gap-16 items-start">
                {/* THEN branch */}
                {conditionalData.trueBlockId && strategy.blocks[conditionalData.trueBlockId] && (
                  <div className="flex flex-col items-center min-w-[300px]">
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-bold uppercase">THEN</div>
                    <div className="w-0.5 h-4 bg-green-500 dark:bg-green-400 mb-1" />
                    {renderBlock(conditionalData.trueBlockId, depth + 1, 'then')}
                  </div>
                )}
                
                {/* ELSE branch */}
                {conditionalData.falseBlockId && strategy.blocks[conditionalData.falseBlockId] && (
                  <div className="flex flex-col items-center min-w-[300px]">
                    <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-bold uppercase">ELSE</div>
                    <div className="w-0.5 h-4 bg-red-500 dark:bg-red-400 mb-1" />
                    {renderBlock(conditionalData.falseBlockId, depth + 1, 'else')}
                  </div>
                )}
              </div>
            ) : isWeight ? (
              // Weight blocks: render children in a list format (like image 1)
              <div className="flex flex-col gap-2 items-center w-full min-w-[300px]">
                {block.children.map((childId) => {
                  const childBlock = strategy.blocks[childId]
                  if (!childBlock || childBlock.type !== 'asset') return null
                  
                  // Calculate weight percentage for this asset
                  const weightValue = block.data.weight?.value || 0
                  const totalChildren = block.children.length
                  const assetWeight = block.data.weight?.type === 'equal' 
                    ? 100 / totalChildren 
                    : weightValue / totalChildren
                  
                  return (
                    <div key={childId} className="flex items-center gap-3 w-full">
                      <div className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold min-w-[60px] text-center">
                        {assetWeight.toFixed(0)}%
                      </div>
                      <div className="flex-1">
                        {renderBlock(childId, depth + 1)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Regular blocks: render children vertically
              <div className="flex flex-col gap-4 items-center">
                {block.children.map((childId) => (
                  <div key={childId} className="flex flex-col items-center">
                    {renderBlock(childId, depth + 1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drop zone indicator */}
        {dropZone === blockId && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 pointer-events-none z-0" />
        )}
      </div>
    )
  }

  const rootBlock = strategy.blocks[strategy.rootBlockId]

  useEffect(() => {
    const updateGrid = () => {
      if (!canvasRef.current) return
      const isDark = document.documentElement.classList.contains('dark')
      canvasRef.current.style.backgroundImage = isDark
        ? `
          linear-gradient(to right, #374151 1px, transparent 1px),
          linear-gradient(to bottom, #374151 1px, transparent 1px)
        `
        : `
          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
        `
    }
    
    updateGrid()
    const observer = new MutationObserver(updateGrid)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={canvasRef}
      className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 relative"
      style={{
        backgroundSize: '20px 20px'
      }}
      onDrop={(e) => {
        if (rootBlock) {
          handleDrop(e, rootBlock.id)
        }
      }}
      onDragOver={handleDragOver}
    >
      {/* Undo/Redo buttons in top left corner */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          title="Undo"
        >
          <Undo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          title="Redo"
        >
          <Redo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="p-12 flex justify-center items-start"
        style={{ minHeight: `${minHeight}px` }}
      >
        {rootBlock ? (
          <div className="flex flex-col items-center">
            {renderBlock(strategy.rootBlockId)}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p className="text-lg mb-4">Start building your strategy</p>
            <p className="text-sm">Drag blocks from the left panel to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

