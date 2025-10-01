import React from 'react'
import { FilePdf, Package } from '@phosphor-icons/react'
import type { CVInstance } from '../../../shared/types'

interface ExportPanelProps {
  cv: CVInstance | null
  onExport: (type: 'pdf' | 'web_package') => void
  disabled?: boolean
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  cv,
  onExport,
  disabled = false
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onExport('pdf')}
        disabled={disabled || !cv}
        className="flex items-center gap-1 px-4 py-2 text-sm border border-success rounded bg-success text-text-inverse cursor-pointer mr-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        <FilePdf size={16} />
        PDF
      </button>
      <button
        onClick={() => onExport('web_package')}
        disabled={disabled || !cv}
        className="flex items-center gap-1 px-4 py-2 text-sm border border-success rounded bg-success text-text-inverse cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        <Package size={16} />
        Web
      </button>
    </div>
  )
}