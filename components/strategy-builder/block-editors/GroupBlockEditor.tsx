'use client'

import { StrategyBlock } from '@/types/strategy-builder'
import { useState } from 'react'

interface GroupBlockEditorProps {
  block: StrategyBlock
  onUpdate: (updates: Partial<StrategyBlock>) => void
}

export default function GroupBlockEditor({ block, onUpdate }: GroupBlockEditorProps) {
  const [name, setName] = useState(block.data.group?.name || '')

  const handleSave = () => {
    onUpdate({
      data: {
        ...block.data,
        group: { name }
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Group Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          placeholder="e.g., Core Holdings, Satellite"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
    </div>
  )
}

