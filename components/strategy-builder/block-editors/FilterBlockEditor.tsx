'use client'

import { StrategyBlock } from '@/types/strategy-builder'

interface FilterBlockEditorProps {
  block: StrategyBlock
  onUpdate: (updates: Partial<StrategyBlock>) => void
}

export default function FilterBlockEditor({ block, onUpdate }: FilterBlockEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Filter block editor coming soon...
      </p>
    </div>
  )
}

