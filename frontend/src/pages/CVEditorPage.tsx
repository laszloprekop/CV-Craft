/**
 * CV Editor Page
 * 
 * Main dual-pane editor interface as specified in SDD quickstart scenarios
 */

import React, { useState, useCallback, useTransition, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'
import { Editor, type OnMount } from '@monaco-editor/react'
import { CVPreview } from '../components/CVPreview'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EditorLeftHeader } from '../components/EditorLeftHeader'
import { EditorRightHeader } from '../components/EditorRightHeader'
import { TemplateConfigPanel } from '../components/TemplateConfigPanel'
import { cvApi, assetApi } from '../services/api'
import { useCVEditor } from '../hooks/useCVEditor'
import { useTemplates } from '../hooks/useTemplates'
import { useSavedThemes } from '../hooks/useSavedThemes'
import {
  EditorContainer,
  EditorPane,
  PreviewPane,
  ResizeHandle,
  HeaderButton
} from '../styles/EditorStyles'
import type { TemplateSettings, TemplateConfig, SavedTheme } from '../../../shared/types'
import { DEFAULT_TEMPLATE_CONFIG } from '../../../shared/types'

// How long typing has to settle before the content is committed to the server.
// Each commit costs a markdown re-parse plus a DB write, so this trades preview
// latency against write volume.
const CONTENT_SAVE_DEBOUNCE_MS = 800

// Deep merge helper for nested config objects. Pure, so it lives at module
// scope - defining it in the component body gave it a new identity every render
// and invalidated every useCallback that depends on it.
const deepMergeConfig = (prev: TemplateConfig, partial: Partial<TemplateConfig>): TemplateConfig => {
  return {
    colors: partial.colors ? { ...prev.colors, ...partial.colors } : prev.colors,
    typography: partial.typography ? { ...prev.typography, ...partial.typography } : prev.typography,
    layout: partial.layout ? { ...prev.layout, ...partial.layout } : prev.layout,
    components: partial.components ? { ...prev.components, ...partial.components } : prev.components,
    pdf: partial.pdf ? { ...prev.pdf, ...partial.pdf } : prev.pdf,
    advanced: partial.advanced ? { ...prev.advanced, ...partial.advanced } : prev.advanced,
  }
}

export const CVEditorPage: React.FC = () => {
  const { cvId } = useParams<{ cvId?: string }>()
  const navigate = useNavigate()

  // React 18 Concurrent Features for non-blocking updates
  const [isPending] = useTransition()
  
  // localStorage key for config panel visibility
  const CONFIG_PANEL_KEY = 'cv-craft-config-panel-visible'

  const getInitialConfigPanelVisible = (): boolean => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(CONFIG_PANEL_KEY)
    if (saved === 'true' || saved === 'false') {
      return saved === 'true'
    }
    return true // Default to open
  }

  // State
  const [paneWidth, setPaneWidth] = useState(35) // Left pane percentage
  const [isResizing, setIsResizing] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<'fit-width' | 'fit-height' | 'actual-size' | 'custom'>('fit-width')
  const [zoomPercentage, setZoomPercentage] = useState(100)
  const [showConfig, setShowConfig] = useState(getInitialConfigPanelVisible)
  const [showEditor, setShowEditor] = useState(true)

  // Custom hooks
  const {
    cv,
    content,
    settings,
    config: savedConfig,
    loading,
    error,
    actionError,
    dismissActionError,
    saveStatus,
    updateContent,
    updateSettings,
    updateConfig: saveConfig,
    saveCv,
    reloadCv,
    exportCv
  } = useCVEditor(cvId)

  const {
    templates,
    activeTemplate,
    loadTemplate,
    templatesLoading
  } = useTemplates()

  const {
    themes: savedThemes,
    saveTheme,
    updateTheme,
    deleteTheme,
    renameTheme,
  } = useSavedThemes()

  const [activeThemeId, setActiveThemeId] = useState<string | null>(null)

  // Restore active theme ID from CV metadata on load
  useEffect(() => {
    if (cv?.metadata?.active_theme_id) {
      setActiveThemeId(cv.metadata.active_theme_id)
    }
  }, [cv?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist active theme ID to CV metadata
  const persistThemeId = useCallback(async (themeId: string | null) => {
    if (!cv) return
    try {
      await cvApi.update(cv.id, {
        metadata: { ...cv.metadata, active_theme_id: themeId }
      })
    } catch (error) {
      console.error('Failed to persist theme ID:', error)
    }
  }, [cv])

  // Template config state - for live preview updates only
  // Tracks temporary changes before they're saved to database
  const [liveConfigChanges, setLiveConfigChanges] = useState<Partial<TemplateConfig> | null>(null)

  // Effective config combines saved config with live changes
  const baseConfig = savedConfig || activeTemplate?.default_config || DEFAULT_TEMPLATE_CONFIG
  const effectiveConfig = liveConfigChanges
    ? deepMergeConfig(baseConfig, liveConfigChanges)
    : baseConfig

  // Debounced content commit. Saving is what refreshes the preview: the
  // backend re-parses the markdown and CVPreview renders from parsed_content,
  // so the preview and the exported PDF always come from the same renderer.
  // Use refs to avoid recreating the debounce when the callbacks change.
  const updateContentRef = useRef(updateContent)
  updateContentRef.current = updateContent
  const saveCvRef = useRef(saveCv)
  saveCvRef.current = saveCv

  const debouncedPreviewUpdate = useMemo(
    () => debounce((newContent: string) => {
      // updateContent sets the hook's content ref synchronously, so the save
      // below picks up this exact text rather than the previous keystroke's.
      updateContentRef.current(newContent)
      void saveCvRef.current()
    }, CONTENT_SAVE_DEBOUNCE_MS),
    [] // Stable - never recreated
  )

  useEffect(() => {
    return () => { debouncedPreviewUpdate.cancel() }
  }, [debouncedPreviewUpdate])

  // The editor is deliberately uncontrolled. Feeding the debounced `content`
  // state back in as a `value` prop makes Monaco replace the whole document
  // (executeEdits over the full range with forceMoveMarkers), which drops the
  // caret at EOF whenever the debounce lands behind what has been typed since.
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  // Text the editor itself last produced. Lets us tell edits that originated in
  // the editor apart from content loaded from elsewhere (CV load, import).
  const editorTextRef = useRef(content)

  // Set while we push loaded content in, so the resulting change event is not
  // mistaken for typing and saved straight back to the server it came from.
  const applyingExternalRef = useRef(false)

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
    editorTextRef.current = editor.getValue()
  }, [])

  // Handle content changes from Monaco editor
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value === undefined) return
    editorTextRef.current = value
    if (applyingExternalRef.current) return
    debouncedPreviewUpdate(value)
  }, [debouncedPreviewUpdate])

  // Push content into the editor only when it changed outside the editor.
  // The debounce always trails with the newest text, so content that came from
  // typing already matches editorTextRef and is skipped here.
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || content === editorTextRef.current) return
    // A disposed editor (pane toggled, CV switched) has no model; the remount
    // picks the new content up via defaultValue instead.
    if (!editor.getModel()) return

    // Drop any keystrokes queued against the text we are about to replace.
    debouncedPreviewUpdate.cancel()
    editorTextRef.current = content
    applyingExternalRef.current = true
    try {
      editor.setValue(content)
    } finally {
      applyingExternalRef.current = false
    }
  }, [content, debouncedPreviewUpdate])

  // Handle template selection
  const handleTemplateChange = useCallback(async (templateId: string) => {
    if (cv) {
      await loadTemplate(templateId)
      // Auto-save when template changes
      saveCv()
    }
  }, [cv, loadTemplate, saveCv])

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings: Partial<TemplateSettings>) => {
    updateSettings(newSettings)
    // Auto-save settings changes
    setTimeout(() => saveCv(), 500)
  }, [updateSettings, saveCv])

  // Handle template config changes (live preview, no save)
  const handleConfigChange = useCallback((newConfig: Partial<TemplateConfig>) => {
    setLiveConfigChanges(prev => prev ? { ...prev, ...newConfig } : newConfig)
  }, [])

  // Handle config change complete (save to database)
  const handleConfigChangeComplete = useCallback(async (newConfig: Partial<TemplateConfig>) => {
    // Merge the partial change with base config
    const updated = deepMergeConfig(baseConfig, newConfig)

    // Update config in useCVEditor and save to database
    saveConfig(updated)
    await saveCv(updated)
    // Clear live changes after save
    setLiveConfigChanges(null)
  }, [saveConfig, saveCv, baseConfig])

  // Theme handlers
  const handleLoadTheme = useCallback(async (theme: SavedTheme) => {
    saveConfig(theme.config)
    setLiveConfigChanges(null)
    setActiveThemeId(theme.id)
    await saveCv(theme.config)
    persistThemeId(theme.id)
  }, [saveConfig, saveCv, persistThemeId])

  const handleSaveTheme = useCallback(async (name: string) => {
    const templateId = activeTemplate?.id || 'default-modern'
    const result = await saveTheme(name, effectiveConfig, templateId)
    if (result) {
      setActiveThemeId(result.id)
      persistThemeId(result.id)
    }
  }, [saveTheme, effectiveConfig, activeTemplate, persistThemeId])

  const handleUpdateTheme = useCallback(async (id: string) => {
    await updateTheme(id, { config: effectiveConfig })
  }, [updateTheme, effectiveConfig])

  const handleDeleteTheme = useCallback(async (id: string) => {
    const success = await deleteTheme(id)
    if (success && activeThemeId === id) {
      setActiveThemeId(null)
      persistThemeId(null)
    }
  }, [deleteTheme, activeThemeId, persistThemeId])

  const handleRenameTheme = useCallback(async (id: string, newName: string) => {
    await renameTheme(id, newName)
  }, [renameTheme])

  const handleResetToDefault = useCallback(() => {
    saveConfig(DEFAULT_TEMPLATE_CONFIG)
    setLiveConfigChanges(null)
    setActiveThemeId(null)
    persistThemeId(null)
    setTimeout(() => saveCv(DEFAULT_TEMPLATE_CONFIG), 100)
  }, [saveConfig, saveCv, persistThemeId])

  // New header handlers
  const handleImportMarkdown = useCallback((content: string, _filename: string) => {
    updateContent(content)
    // Auto-save imported content
    setTimeout(() => saveCv(), 500)
  }, [updateContent, saveCv])

  const handleExportMarkdown = useCallback(() => {
    if (!cv) return
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    try {
      link.href = url
      link.download = `${cv.name}.md`
      document.body.appendChild(link)
      link.click()
    } finally {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }, [cv, content])

  const handleConfigToggle = useCallback(() => {
    setShowConfig(prev => {
      const newValue = !prev
      localStorage.setItem(CONFIG_PANEL_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Ctrl+S / Cmd+S to save and re-parse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCv()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveCv])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomPercentage(prev => Math.min(prev + 25, 300))
    setZoomLevel('custom')
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomPercentage(prev => Math.max(prev - 25, 25))
    setZoomLevel('custom')
  }, [])

  const handleZoomChange = useCallback((level: 'fit-width' | 'fit-height' | 'actual-size' | 'custom') => {
    setZoomLevel(level)
    // Set appropriate zoom percentages for different modes
    switch (level) {
      case 'actual-size':
        setZoomPercentage(100)
        break
      case 'fit-width':
        setZoomPercentage(85) // Approximate fit-width percentage
        break
      case 'fit-height':
        setZoomPercentage(75) // Approximate fit-height percentage  
        break
      default:
        // Keep current percentage for custom
        break
    }
  }, [])

  // Handle pane resizing - track cleanup to prevent event listener leaks
  const resizeCleanupRef = useRef<(() => void) | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100
      setPaneWidth(Math.min(Math.max(newWidth, 20), 80)) // Clamp between 20-80%
    }

    const cleanup = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', cleanup)
      resizeCleanupRef.current = null
    }

    // Clean up any previous listeners
    resizeCleanupRef.current?.()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', cleanup)
    resizeCleanupRef.current = cleanup
  }, [])

  useEffect(() => {
    return () => { resizeCleanupRef.current?.() }
  }, [])

  // Handle asset upload
  const handleAssetUpload = useCallback(async (file: File) => {
    if (!cv) return

    // Client-side validation before upload
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`File type not allowed: ${file.type}`)
      return
    }
    if (file.size > MAX_SIZE) {
      console.error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`)
      return
    }

    try {
      // Upload the image asset
      const result = await assetApi.uploadImage(file, cv.id)
      const assetId = result.data.id

      // Update CV with photo_asset_id (NOT in markdown content)
      await cvApi.update(cv.id, {
        photo_asset_id: assetId
      })

      // Reload CV to get updated photo_asset_id
      await reloadCv()

    } catch (error) {
      console.error('Failed to upload asset:', error)
    }
  }, [cv, reloadCv])

  // Handle photo upload specifically for header
  const handlePhotoUpload = useCallback(async (file: File) => {
    // Handle photo upload - integrates with AssetUploader
    await handleAssetUpload(file)
  }, [handleAssetUpload])

  // Handle selecting an existing photo or unlinking
  const handlePhotoSelect = useCallback(async (assetId: string | null) => {
    if (!cv) return
    try {
      await cvApi.update(cv.id, { photo_asset_id: assetId })
      await reloadCv()
    } catch (error) {
      console.error('Failed to update photo:', error)
    }
  }, [cv, reloadCv])

  // Loading state
  if (loading || templatesLoading) {
    return (
      <EditorContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <LoadingSpinner size="large" />
        </div>
      </EditorContainer>
    )
  }

  // Fatal error state. Only reached when the CV could not be loaded at all —
  // a failed save or export must never unmount the editor, or the unsaved work
  // inside it goes with it.
  if (error) {
    return (
      <EditorContainer>
        <ErrorMessage
          title="Failed to load CV"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </EditorContainer>
    )
  }

  // No CV loaded - show empty state
  if (!cv && !cvId) {
    return (
      <EditorContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Create a New CV</h2>
            <p>Start by creating a new CV or importing an existing one.</p>
            <HeaderButton onClick={() => navigate('/')}>
              Go to CV Manager
            </HeaderButton>
          </div>
        </div>
      </EditorContainer>
    )
  }

  // Calculate config panel width (in pixels)
  const configPanelWidth = 280

  return (
    <EditorContainer>
      {/* Recoverable save/export failure - the editor stays usable underneath */}
      {actionError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '13px'
          }}
        >
          <span style={{ flex: 1 }}>{actionError}</span>
          <HeaderButton onClick={() => saveCv()}>Retry save</HeaderButton>
          <HeaderButton onClick={dismissActionError} aria-label="Dismiss error">
            Dismiss
          </HeaderButton>
        </div>
      )}

      {/* Dual-pane layout with individual headers */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        marginRight: showConfig ? `${configPanelWidth}px` : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Left Pane - Markdown Editor */}
        {showEditor && (
          <>
            <EditorPane
              width={paneWidth}
              $isResizing={isResizing}
            >
              {/* Left Header: CV Manager Icon, Import/Export, Photo Upload */}
              <EditorLeftHeader
                cvName={cv?.name}
                onImportMarkdown={handleImportMarkdown}
                onExportMarkdown={handleExportMarkdown}
                onPhotoUpload={handlePhotoUpload}
                onPhotoSelect={handlePhotoSelect}
                currentPhotoAssetId={cv?.photo_asset_id}
              />

              <Editor
                height="calc(100% - 44px)" // Account for header height
                defaultLanguage="markdown"
                defaultValue={content}
                onChange={handleContentChange}
                onMount={handleEditorMount}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: 'Fira Code, Monaco, monospace',
                  tabSize: 2,
                  insertSpaces: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true
                }}
              />
            </EditorPane>

            {/* Resize Handle */}
            <ResizeHandle
              onMouseDown={handleMouseDown}
              $isResizing={isResizing}
            />
          </>
        )}

        {/* Right Pane - CV Preview */}
        <PreviewPane
          width={showEditor ? 100 - paneWidth : 100}
          $isResizing={isResizing}
        >
          {/* Right Header: Template Selector, Settings, Zoom Controls, Export */}
          <EditorRightHeader
            templateId={activeTemplate?.id}
            templates={templates.map(t => ({ id: t.id, name: t.name }))}
            zoomLevel={zoomLevel}
            zoomPercentage={zoomPercentage}
            isSaving={saveStatus === 'saving'}
            showEditor={showEditor}
            showConfig={showConfig}
            savedThemes={savedThemes}
            activeThemeId={activeThemeId}
            onLoadTheme={handleLoadTheme}
            onSaveTheme={handleSaveTheme}
            onUpdateTheme={handleUpdateTheme}
            onDeleteTheme={handleDeleteTheme}
            onRenameTheme={handleRenameTheme}
            onResetToDefault={handleResetToDefault}
            onTemplateChange={handleTemplateChange}
            onZoomChange={handleZoomChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPDFExport={() => exportCv('pdf')}
            onWebExport={() => exportCv('web_package')}
            onSave={() => saveCv()}
            onToggleEditor={() => setShowEditor(!showEditor)}
            onToggleConfig={handleConfigToggle}
          />

          <div style={{ height: 'calc(100% - 44px)', overflow: 'hidden' }}>
            <CVPreview
              cv={cv}
              template={activeTemplate}
              settings={settings}
              config={effectiveConfig}
              isPending={isPending}
              liveContent={content}
              zoomLevel={zoomLevel}
              zoomPercentage={zoomPercentage}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </PreviewPane>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <TemplateConfigPanel
          config={effectiveConfig}
          onChange={handleConfigChange}
          onChangeComplete={handleConfigChangeComplete}
        />
      )}
    </EditorContainer>
  )
}