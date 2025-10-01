/**
 * Right Header for CV Preview
 * Contains: Template Selector, Settings, Zoom Controls, Preview Mode, Export
 */

import React from 'react'
import { 
  Gear, 
  ArrowsHorizontal, 
  ArrowsVertical, 
  MagnifyingGlass,
  Globe,
  FilePdf,
  FloppyDisk,
  Package,
  Minus,
  Plus
} from '@phosphor-icons/react'


type PreviewMode = 'web' | 'pdf'
type ZoomLevel = 'fit-width' | 'fit-height' | 'actual-size' | 'custom'

interface EditorRightHeaderProps {
  templateId?: string
  templates?: Array<{ id: string; name: string }>
  previewMode?: PreviewMode
  zoomLevel?: ZoomLevel
  zoomPercentage?: number
  isSaving?: boolean
  lastSaved?: string
  onTemplateChange?: (templateId: string) => void
  onSettingsClick?: () => void
  onPreviewModeChange?: (mode: PreviewMode) => void
  onZoomChange?: (level: ZoomLevel) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onPDFExport?: () => void
  onWebExport?: () => void
  onSave?: () => void
}

export const EditorRightHeader: React.FC<EditorRightHeaderProps> = ({
  templateId,
  templates = [],
  previewMode = 'web',
  zoomLevel = 'fit-width',
  zoomPercentage = 100,
  isSaving = false,
  lastSaved,
  onTemplateChange,
  onSettingsClick,
  onPreviewModeChange,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onPDFExport,
  onWebExport,
  onSave
}) => {
  const formatLastSaved = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    if (diffMs < 60000) return 'Just now'
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface gap-3">
      {/* Left Section: Template & Settings */}
      <div className="flex items-center gap-1">
        <select 
          value={templateId || ""} 
          onChange={(e) => onTemplateChange?.(e.target.value)}
          className="px-1.5 py-1 text-xs border border-border rounded bg-background text-text-primary cursor-pointer focus:outline-none focus:border-primary"
        >
          <option value="">Select Template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>

        <button 
          onClick={onSettingsClick} 
          title="Template settings"
          className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <Gear size={14} />
          Settings
        </button>
      </div>

      {/* Center Section: Zoom & Preview Mode */}
      <div className="flex items-center gap-1">
        {/* Zoom Controls */}
        <button 
          onClick={onZoomOut}
          title="Zoom out"
          className="flex items-center px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <Minus size={14} />
        </button>

        <span className="px-2 py-1 text-xs text-text-primary min-w-[45px] text-center">
          {Math.round(zoomPercentage)}%
        </span>

        <button 
          onClick={onZoomIn}
          title="Zoom in"
          className="flex items-center px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <Plus size={14} />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Fit Controls */}
        <button 
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            zoomLevel === 'fit-height' 
              ? 'bg-primary text-text-inverse border-primary' 
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
          onClick={() => onZoomChange?.('fit-height')}
          title="Fit to height"
        >
          <ArrowsVertical size={14} />
        </button>

        <button 
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            zoomLevel === 'fit-width' 
              ? 'bg-primary text-text-inverse border-primary' 
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
          onClick={() => onZoomChange?.('fit-width')}
          title="Fit to width"
        >
          <ArrowsHorizontal size={14} />
        </button>

        <button 
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            zoomLevel === 'actual-size' 
              ? 'bg-primary text-text-inverse border-primary' 
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
          onClick={() => onZoomChange?.('actual-size')}
          title="1:1 (approximate print size)"
        >
          <MagnifyingGlass size={14} />
          1:1
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <button
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            previewMode === 'web'
              ? 'bg-primary text-text-inverse border-primary'
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
          onClick={() => onPreviewModeChange?.('web')}
          title="Web preview (continuous)"
        >
          <Globe size={14} />
          Web
        </button>

        <button
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            previewMode === 'pdf'
              ? 'bg-primary text-text-inverse border-primary'
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
          onClick={() => onPreviewModeChange?.('pdf')}
          title="PDF preview (paginated)"
        >
          <FilePdf size={14} />
          PDF
        </button>
      </div>

      {/* Right Section: Save & Export */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSave}
          title="Save CV"
          disabled={isSaving}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border-none rounded bg-primary text-text-inverse hover:bg-primary-hover transition-all duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FloppyDisk size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onPDFExport}
          title="Export as PDF"
          className="flex items-center gap-0.5 px-1.5 py-1 text-xs border border-success rounded bg-success text-text-inverse hover:opacity-90 transition-all duration-150"
        >
          <FilePdf size={14} />
          PDF
        </button>

        <button
          onClick={onWebExport}
          title="Export web package"
          className="flex items-center gap-0.5 px-1.5 py-1 text-xs border border-success rounded bg-success text-text-inverse hover:opacity-90 transition-all duration-150"
        >
          <Package size={14} />
          Web
        </button>
      </div>
    </div>
  )
}