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

// Default template configuration
const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
    },
    borders: '#e2e8f0',
    links: {
      default: '#2563eb',
      hover: '#1d4ed8',
    },
  },
  typography: {
    fontFamily: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Georgia, serif',
      monospace: 'monospace',
    },
    fontSize: {
      h1: '32px',
      h2: '24px',
      h3: '20px',
      body: '16px',
      small: '14px',
      tiny: '12px',
    },
    fontWeight: {
      heading: 700,
      subheading: 600,
      body: 400,
      bold: 600,
    },
    lineHeight: {
      heading: 1.2,
      body: 1.6,
      compact: 1.4,
    },
  },
  layout: {
    pageWidth: '210mm',
    pageMargin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    sectionSpacing: '24px',
    paragraphSpacing: '12px',
  },
  components: {
    header: {
      padding: '0 0 16px 0',
      borderBottom: '2px solid #e2e8f0',
      alignment: 'left',
    },
    section: {
      marginBottom: '24px',
    },
    tags: {
      backgroundColor: '#e0e7ff',
      textColor: '#3730a3',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '14px',
      gap: '8px',
    },
    dateLine: {
      color: '#64748b',
      fontStyle: 'italic',
      fontSize: '14px',
      alignment: 'right',
    },
    list: {
      bulletStyle: 'disc',
      indent: '20px',
      spacing: '8px',
    },
    links: {
      underline: true,
    },
    divider: {
      style: 'solid',
    },
  },
  pdf: {
    pageSize: 'A4',
    orientation: 'portrait',
    printColorAdjust: true,
    pageNumbers: {
      enabled: false,
      position: 'bottom-center',
    },
  },
};

export const CVEditorPage: React.FC = () => {
  const { cvId } = useParams<{ cvId?: string }>()
  const navigate = useNavigate()
  
  // React 18 Concurrent Features for non-blocking updates
  const [isPending, startTransition] = useTransition()
  
  // State
  const [paneWidth, setPaneWidth] = useState(35) // Left pane percentage
  const [isResizing, setIsResizing] = useState(false)
  const [previewMode, setPreviewMode] = useState<'web' | 'pdf'>('web')
  const [zoomLevel, setZoomLevel] = useState<'fit-width' | 'fit-height' | 'actual-size' | 'custom'>('fit-width')
  const [zoomPercentage, setZoomPercentage] = useState(100)
  const [showSettings, setShowSettings] = useState(false)
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
    exportCv
  } = useCVEditor(cvId)

  const {
    templates,
    activeTemplate,
    loadTemplate,
    templatesLoading
  } = useTemplates()

  // Template config state - use saved config or default
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(
    savedConfig || activeTemplate?.default_config || DEFAULT_TEMPLATE_CONFIG
  )

  // Sync templateConfig with savedConfig when it changes
  useEffect(() => {
    if (savedConfig) {
      setTemplateConfig(savedConfig)
    } else if (activeTemplate?.default_config) {
      setTemplateConfig(activeTemplate.default_config)
    }
  }, [savedConfig, activeTemplate])

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

  // Handle template config changes
  const handleConfigChange = useCallback((newConfig: Partial<TemplateConfig>) => {
    setTemplateConfig(prev => {
      const updated = {
        ...prev,
        ...newConfig
      }

      // Save the full config
      saveConfig(updated)

      // Also convert TemplateConfig to TemplateSettings for legacy support
      if (newConfig.colors) {
        updateSettings({
          primaryColor: newConfig.colors.primary || updated.colors.primary,
          accentColor: newConfig.colors.accent || updated.colors.accent,
          backgroundColor: newConfig.colors.background || updated.colors.background,
          surfaceColor: newConfig.colors.secondary || updated.colors.secondary,
        })
      }

      if (newConfig.typography?.fontFamily) {
        updateSettings({
          fontFamily: newConfig.typography.fontFamily.body || updated.typography.fontFamily.body
        })
      }

      return updated
    })
    // Auto-save config changes
    setTimeout(() => saveCv(), 500)
  }, [saveConfig, updateSettings, saveCv])

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

  const handleSettingsToggle = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

  // Sync template config when active template changes
  useEffect(() => {
    if (activeTemplate?.default_config) {
      setTemplateConfig(activeTemplate.default_config)
    }
  }, [activeTemplate])

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
      const updatedCVResponse = await cvApi.update(cv.id, {
        photo_asset_id: assetId
      })

      // Update local CV state to trigger photo reload
      setCv(updatedCVResponse.data)

      console.log('Photo uploaded and linked to CV:', assetId)
    } catch (error) {
      console.error('Failed to upload asset:', error)
    }
  }, [cv])

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

  // Calculate settings panel width (in pixels)
  const settingsPanelWidth = 280 // Compact width

  return (
    <EditorContainer>
      {/* Dual-pane layout with individual headers */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        marginRight: showSettings ? `${settingsPanelWidth}px` : '0',
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
            previewMode={previewMode}
            zoomLevel={zoomLevel}
            zoomPercentage={zoomPercentage}
            isSaving={saveStatus === 'saving'}
            lastSaved={cv?.updated_at}
            onTemplateChange={handleTemplateChange}
            onSettingsClick={handleSettingsToggle}
            onPreviewModeChange={setPreviewMode}
            onZoomChange={handleZoomChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPDFExport={() => exportCv('pdf')}
            onWebExport={() => exportCv('web_package')}
            onSave={saveCv}
            onToggleEditor={() => setShowEditor(!showEditor)}
            showEditor={showEditor}
          />

          <div style={{ height: 'calc(100% - 44px)', overflow: 'auto' }}>
            <CVPreview
              cv={cv}
              template={activeTemplate}
              settings={settings}
              config={templateConfig}
              isPending={isPending}
              liveContent={content}
              zoomLevel={zoomLevel}
              zoomPercentage={zoomPercentage}
              previewMode={previewMode}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </PreviewPane>
      </div>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <TemplateConfigPanel
          config={templateConfig}
          onChange={handleConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </EditorContainer>
  )
}