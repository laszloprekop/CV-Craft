/**
 * Right Header for CV Preview
 * Contains: Editor Toggle, Theme Selector, Zoom Controls, Export, Config Toggle
 * Note: Preview Mode is now managed within CVPreview component
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowsHorizontal,
  ArrowsVertical,
  MagnifyingGlass,
  FilePdf,
  FloppyDisk,
  Package,
  Minus,
  Plus,
  Sidebar,
  SidebarSimple,
  CircleNotch,
  CaretDown,
  PencilSimple,
  Trash,
  Check,
  X,
  ArrowCounterClockwise
} from '@phosphor-icons/react'
import type { SavedTheme } from '../../../shared/types'


type ZoomLevel = 'fit-width' | 'fit-height' | 'actual-size' | 'custom'

interface EditorRightHeaderProps {
  templateId?: string
  templates?: Array<{ id: string; name: string }>
  zoomLevel?: ZoomLevel
  zoomPercentage?: number
  isSaving?: boolean
  showEditor?: boolean
  showConfig?: boolean
  // Theme management
  savedThemes?: SavedTheme[]
  activeThemeId?: string | null
  onLoadTheme?: (theme: SavedTheme) => void
  onSaveTheme?: (name: string) => void
  onUpdateTheme?: (id: string) => void
  onDeleteTheme?: (id: string) => void
  onRenameTheme?: (id: string, newName: string) => void
  onResetToDefault?: () => void
  // Existing handlers
  onTemplateChange?: (templateId: string) => void
  onZoomChange?: (level: ZoomLevel) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onPDFExport?: () => void
  onWebExport?: () => void
  onSave?: () => void
  onToggleEditor?: () => void
  onToggleConfig?: () => void
}

export const EditorRightHeader: React.FC<EditorRightHeaderProps> = ({
  zoomLevel = 'fit-width',
  zoomPercentage = 100,
  isSaving = false,
  showEditor = true,
  showConfig = true,
  savedThemes = [],
  activeThemeId = null,
  onLoadTheme,
  onSaveTheme,
  onUpdateTheme,
  onDeleteTheme,
  onRenameTheme,
  onResetToDefault,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onPDFExport,
  onWebExport,
  onSave,
  onToggleEditor,
  onToggleConfig
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [saveMode, setSaveMode] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSaveMode(false)
        setRenamingId(null)
        setConfirmDeleteId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus inputs when modes activate
  useEffect(() => {
    if (saveMode && saveInputRef.current) saveInputRef.current.focus()
  }, [saveMode])
  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus()
  }, [renamingId])

  const activeTheme = savedThemes.find(t => t.id === activeThemeId)
  const displayLabel = activeTheme ? activeTheme.name : 'Default'

  const handleSaveSubmit = () => {
    const name = saveName.trim()
    if (name) {
      onSaveTheme?.(name)
      setSaveName('')
      setSaveMode(false)
      setDropdownOpen(false)
    }
  }

  const handleRenameSubmit = () => {
    const name = renameValue.trim()
    if (name && renamingId) {
      onRenameTheme?.(renamingId, name)
      setRenamingId(null)
      setRenameValue('')
    }
  }

  const handleDelete = (id: string) => {
    onDeleteTheme?.(id)
    setConfirmDeleteId(null)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface gap-3">
      {/* Left Section: Toggle Editor, Theme Selector */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleEditor}
          title={showEditor ? "Hide editor" : "Show editor"}
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            showEditor
              ? 'bg-primary text-text-inverse border-primary'
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
        >
          <Sidebar size={18} weight="bold" />
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Theme Selector Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-background text-text-primary cursor-pointer hover:border-primary transition-all duration-150"
          >
            <span className="max-w-[120px] truncate">{displayLabel}</span>
            <CaretDown size={12} weight="bold" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded shadow-lg z-50 overflow-hidden">
              {/* Default option */}
              <button
                onClick={() => {
                  onResetToDefault?.()
                  setDropdownOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors ${
                  !activeThemeId ? 'bg-background font-semibold' : ''
                }`}
              >
                <span className="flex-1">Modern Professional (Default)</span>
                {!activeThemeId && <Check size={14} weight="bold" className="text-primary" />}
              </button>

              {/* Saved themes */}
              {savedThemes.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  {savedThemes.map(theme => (
                    <div
                      key={theme.id}
                      className={`flex items-center gap-1 px-3 py-2 text-xs hover:bg-background transition-colors ${
                        activeThemeId === theme.id ? 'bg-background' : ''
                      }`}
                    >
                      {renamingId === theme.id ? (
                        /* Rename mode */
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit()
                              if (e.key === 'Escape') setRenamingId(null)
                            }}
                            className="flex-1 px-1.5 py-0.5 text-xs border border-primary rounded bg-background text-text-primary focus:outline-none"
                            maxLength={100}
                          />
                          <button
                            onClick={handleRenameSubmit}
                            className="p-0.5 text-primary hover:bg-background rounded"
                            title="Confirm rename"
                          >
                            <Check size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="p-0.5 text-text-secondary hover:bg-background rounded"
                            title="Cancel"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        </div>
                      ) : confirmDeleteId === theme.id ? (
                        /* Delete confirmation */
                        <div className="flex items-center gap-1 flex-1">
                          <span className="flex-1 text-error">Delete "{theme.name}"?</span>
                          <button
                            onClick={() => handleDelete(theme.id)}
                            className="px-1.5 py-0.5 text-xs bg-error text-text-inverse rounded hover:opacity-90"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 text-xs border border-border rounded hover:bg-background"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        /* Normal display */
                        <>
                          <button
                            onClick={() => {
                              onLoadTheme?.(theme)
                              setDropdownOpen(false)
                            }}
                            className="flex-1 text-left truncate"
                          >
                            {theme.name}
                          </button>
                          {activeThemeId === theme.id && (
                            <Check size={14} weight="bold" className="text-primary shrink-0" />
                          )}
                          <button
                            onClick={() => {
                              setRenamingId(theme.id)
                              setRenameValue(theme.name)
                            }}
                            className="p-0.5 text-text-secondary hover:text-text-primary rounded shrink-0"
                            title="Rename"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(theme.id)}
                            className="p-0.5 text-text-secondary hover:text-error rounded shrink-0"
                            title="Delete"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Actions */}
              <div className="h-px bg-border" />

              {/* Update active theme */}
              {activeTheme && (
                <button
                  onClick={() => {
                    onUpdateTheme?.(activeTheme.id)
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors text-primary"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>Update "{activeTheme.name}"</span>
                </button>
              )}

              {/* Save as new theme */}
              {saveMode ? (
                <div className="flex items-center gap-1 px-3 py-2">
                  <input
                    ref={saveInputRef}
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSubmit()
                      if (e.key === 'Escape') setSaveMode(false)
                    }}
                    placeholder="Theme name..."
                    className="flex-1 px-1.5 py-0.5 text-xs border border-primary rounded bg-background text-text-primary focus:outline-none"
                    maxLength={100}
                  />
                  <button
                    onClick={handleSaveSubmit}
                    disabled={!saveName.trim()}
                    className="p-0.5 text-primary hover:bg-background rounded disabled:opacity-40"
                    title="Save"
                  >
                    <Check size={14} weight="bold" />
                  </button>
                  <button
                    onClick={() => { setSaveMode(false); setSaveName('') }}
                    className="p-0.5 text-text-secondary hover:bg-background rounded"
                    title="Cancel"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSaveMode(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors text-primary"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>Save as Theme...</span>
                </button>
              )}

              {/* Reset to default */}
              {activeThemeId && (
                <button
                  onClick={() => {
                    onResetToDefault?.()
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors text-text-secondary"
                >
                  <ArrowCounterClockwise size={14} weight="bold" />
                  <span>Reset to Default</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Zoom & Preview Mode */}
      <div className="flex items-center gap-1">
        {/* Zoom Controls */}
        <button
          onClick={onZoomOut}
          title="Zoom out"
          className="flex items-center px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <Minus size={18} weight="bold" />
        </button>

        <span className="px-2 py-1 text-xs text-text-primary min-w-[45px] text-center">
          {Math.round(zoomPercentage)}%
        </span>

        <button
          onClick={onZoomIn}
          title="Zoom in"
          className="flex items-center px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <Plus size={18} weight="bold" />
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
          <ArrowsVertical size={18} weight="bold" />
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
          <ArrowsHorizontal size={18} weight="bold" />
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
          <MagnifyingGlass size={18} weight="bold" />
          1:1
        </button>
      </div>

      {/* Right Section: Save, Export & Config Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSave}
          title="Save CV"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-none rounded bg-primary text-text-inverse hover:bg-primary-hover transition-all duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center"
        >
          {isSaving ? (
            <CircleNotch size={20} weight="bold" className="animate-spin" />
          ) : (
            <FloppyDisk size={20} weight="bold" />
          )}
          Save
        </button>

        <button
          onClick={onPDFExport}
          title="Export as PDF"
          className="flex items-center gap-0.5 px-1.5 py-1 text-xs border border-success rounded bg-success text-text-inverse hover:opacity-90 transition-all duration-150"
        >
          <FilePdf size={18} weight="bold" />
          PDF
        </button>

        <button
          onClick={onWebExport}
          title="Export web package"
          className="flex items-center gap-0.5 px-1.5 py-1 text-xs border border-success rounded bg-success text-text-inverse hover:opacity-90 transition-all duration-150"
        >
          <Package size={18} weight="bold" />
          Web
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <button
          onClick={onToggleConfig}
          title={showConfig ? "Hide config panel" : "Show config panel"}
          className={`flex items-center gap-0.5 px-1.5 py-1 text-xs border rounded transition-all duration-150 ${
            showConfig
              ? 'bg-primary text-text-inverse border-primary'
              : 'bg-transparent text-text-primary border-border hover:bg-background hover:border-primary'
          }`}
        >
          <SidebarSimple size={18} weight="bold" style={{ transform: 'scaleX(-1)' }} />
        </button>
      </div>
    </div>
  )
}
