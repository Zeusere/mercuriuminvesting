'use client'

import { BlockType } from '@/types/strategy-builder'
import { 
  Target, 
  Scale, 
  GitBranch, 
  Filter, 
  Folder,
  Sparkles,
  Save
} from 'lucide-react'

interface BlockPaletteProps {
  onBlockSelect: (type: BlockType) => void
  onSave?: () => void
}

const blockTypes: Array<{ type: BlockType; label: string; description: string; icon: any }> = [
  {
    type: 'asset',
    label: 'Asset',
    description: 'Add stocks or ETFs',
    icon: Target
  },
  {
    type: 'weight',
    label: 'Weight (Allocation)',
    description: 'Decide how funds are allocated',
    icon: Scale
  },
  {
    type: 'conditional',
    label: 'If/Else (Conditional)',
    description: 'Use technical indicators to create if/then logic',
    icon: GitBranch
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Sort and filter assets by attributes',
    icon: Filter
  },
  {
    type: 'group',
    label: 'Group',
    description: 'Organize blocks by placing them inside a named group',
    icon: Folder
  }
]

export default function BlockPalette({ onBlockSelect, onSave }: BlockPaletteProps) {
  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Save Button at the top */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save changes
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add Block</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Drag blocks to canvas or click to add</p>
        </div>

      <div className="space-y-2">
        {blockTypes.map(({ type, label, description, icon: Icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onClick={() => onBlockSelect(type)}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-move hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded-lg p-2 transition-colors">
                <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">Create with AI</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
            Describe your strategy in natural language and let AI build it for you
          </p>
          <button className="w-full bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
            Open AI Builder
          </button>
        </div>
      </div>
    </div>
  )
}

