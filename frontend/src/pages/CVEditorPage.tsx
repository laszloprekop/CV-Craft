/**
 * CV Editor Page
 * 
 * Main dual-pane editor interface as specified in SDD quickstart scenarios
 */

import React, { useState, useCallback, useTransition, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'
import { Editor } from '@monaco-editor/react'
import { CVPreview } from '../components/CVPreview'
import { TemplateSelector } from '../components/TemplateSelector'
import { AssetUploader } from '../components/AssetUploader'
import { ExportPanel } from '../components/ExportPanel'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EditorLeftHeader } from '../components/EditorLeftHeader'
import { EditorRightHeader } from '../components/EditorRightHeader'
import { TemplateConfigPanel } from '../components/TemplateConfigPanel'
import { cvApi, templateApi, assetApi } from '../services/api'
import { useCVEditor } from '../hooks/useCVEditor'
import { useTemplates } from '../hooks/useTemplates'
import {
  EditorContainer,
  EditorPane,
  PreviewPane,
  ResizeHandle,
  EditorHeader,
  HeaderButton,
  HeaderTitle,
  SaveStatus,
  ToolbarContainer
} from '../styles/EditorStyles'
import type { CVInstance, Template, TemplateSettings, TemplateConfig } from '../../../shared/types'
import { DEFAULT_TEMPLATE_CONFIG } from '../../../shared/types'

export const CVEditorPage: React.FC = () => {
  const instanceId = React.useRef(Math.random().toString(36).substr(2, 9))

  const { cvId } = useParams<{ cvId?: string }>()
  const navigate = useNavigate()

  // React 18 Concurrent Features for non-blocking updates
  const [isPending, startTransition] = useTransition()
  
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

  // Deep merge helper for nested config objects
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

  // Template config state - for live preview updates only
  // Tracks temporary changes before they're saved to database
  const [liveConfigChanges, setLiveConfigChanges] = useState<Partial<TemplateConfig> | null>(null)

  // Effective config combines saved config with live changes
  const baseConfig = savedConfig || activeTemplate?.default_config || DEFAULT_TEMPLATE_CONFIG
  const effectiveConfig = liveConfigChanges
    ? deepMergeConfig(baseConfig, liveConfigChanges)
    : baseConfig

  console.log('[CVEditorPage] 🎯 effectiveConfig:', {
    'accent': effectiveConfig.colors.accent,
    'baseFontSize': effectiveConfig.typography.baseFontSize,
    'hasLiveChanges': !!liveConfigChanges,
    'hasSavedConfig': !!savedConfig,
  })

  // Debounced preview update (300ms as specified in SDD)
  const debouncedPreviewUpdate = useCallback(
    debounce((newContent: string) => {
      startTransition(() => {
        updateContent(newContent)
      })
    }, 300),
    [updateContent]
  )

  // Handle content changes from Monaco editor
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      debouncedPreviewUpdate(value)
    }
  }, [debouncedPreviewUpdate])

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
  const handleConfigChangeComplete = useCallback((newConfig: Partial<TemplateConfig>) => {
    console.log(`[CVEditorPage] 💾 Committing change:`, {
      'colors.accent': newConfig.colors?.accent,
    })

    // Merge the partial change with base config
    const updated = deepMergeConfig(baseConfig, newConfig)

    console.log(`[CVEditorPage] 💾 After merge:`, {
      'accent': updated.colors.accent,
      'baseFontSize': updated.typography.baseFontSize,
    })

    // Update config in useCVEditor and save to database
    saveConfig(updated)
    setTimeout(() => {
      console.log(`[CVEditorPage] 💾 Saving to DB...`)
      saveCv()
      // Clear live changes after save
      setLiveConfigChanges(null)
    }, 100)
  }, [saveConfig, saveCv, baseConfig, deepMergeConfig])

  // New header handlers
  const handleImportMarkdown = useCallback((content: string, filename: string) => {
    updateContent(content)
    // Auto-save imported content
    setTimeout(() => saveCv(), 500)
  }, [updateContent, saveCv])

  const handleExportMarkdown = useCallback(() => {
    if (!cv) return
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cv.name}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [cv, content])

  const handleConfigToggle = useCallback(() => {
    setShowConfig(prev => {
      const newValue = !prev
      localStorage.setItem(CONFIG_PANEL_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Note: No need for sync effect anymore
  // baseConfig automatically uses savedConfig || activeTemplate?.default_config || DEFAULT_TEMPLATE_CONFIG

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

  // Handle pane resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = e.currentTarget as Element
      const newWidth = (e.clientX / window.innerWidth) * 100
      setPaneWidth(Math.min(Math.max(newWidth, 20), 80)) // Clamp between 20-80%
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Handle file import
  const handleImportFile = useCallback(async (file: File) => {
    try {
      const content = await file.text()
      updateContent(content)
      saveCv()
    } catch (error) {
      console.error('Failed to import file:', error)
    }
  }, [updateContent, saveCv])

  // Handle asset upload
  const handleAssetUpload = useCallback(async (file: File) => {
    if (!cv) return

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

      console.log('Photo uploaded and linked to CV:', assetId)
    } catch (error) {
      console.error('Failed to upload asset:', error)
    }
  }, [cv, reloadCv])

  // Handle photo upload specifically for header
  const handlePhotoUpload = useCallback(async (file: File) => {
    // Handle photo upload - integrates with AssetUploader
    await handleAssetUpload(file)
  }, [handleAssetUpload])

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

  // Error state
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
              />

              <Editor
                height="calc(100% - 44px)" // Account for header height
                defaultLanguage="markdown"
                value={content}
                onChange={handleContentChange}
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
            onTemplateChange={handleTemplateChange}
            onZoomChange={handleZoomChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPDFExport={() => exportCv('pdf')}
            onWebExport={() => exportCv('web_package')}
            onSave={saveCv}
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
          onClose={handleConfigToggle}
        />
      )}
    </EditorContainer>
  )
}