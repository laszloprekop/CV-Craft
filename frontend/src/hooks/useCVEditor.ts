/**
 * CV Editor Hook
 *
 * Manages CV state, auto-save, and editor operations according to SDD specifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cvApi, exportApi } from '../services/api'
import type { CVInstance, TemplateSettings, TemplateConfig } from '../../../shared/types'
import { migrateTemplateConfig } from '../utils/configMigration'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseCVEditorReturn {
  cv: CVInstance | null
  content: string
  settings: Partial<TemplateSettings>
  config: TemplateConfig | undefined
  loading: boolean
  error: string | null
  saveStatus: SaveStatus
  updateContent: (content: string) => void
  updateSettings: (settings: Partial<TemplateSettings>) => void
  updateConfig: (config: Partial<TemplateConfig>) => void
  saveCv: (configOverride?: TemplateConfig) => Promise<void>
  reloadCv: () => Promise<void>
  exportCv: (type: 'pdf' | 'web_package') => Promise<void>
}

const DEFAULT_CV_CONTENT = `---
name: Your Name
email: your.email@example.com
phone: +1-555-0123
location: Your City, State
website: yourwebsite.com
linkedin: linkedin.com/in/yourprofile
github: github.com/yourusername
---

# Your Name
Professional Title

## Professional Summary

Write a brief summary of your professional background and key strengths.

## Experience

### Job Title | Company Name
*Start Date - End Date*

- Achievement or responsibility 1
- Achievement or responsibility 2
- Achievement or responsibility 3

### Previous Job Title | Previous Company
*Start Date - End Date*

- Achievement or responsibility 1
- Achievement or responsibility 2

## Education

### Degree | Institution Name
*Year*

## Skills

- Technical Skills
- Programming Languages
- Tools & Technologies
- Soft Skills

## Projects

### Project Name
Brief description of the project and your role.

### Another Project
Brief description of another project and your contributions.
`

export function useCVEditor(cvId?: string): UseCVEditorReturn {
  const [cv, setCv] = useState<CVInstance | null>(null)
  const [content, setContent] = useState('')
  const [settings, setSettings] = useState<Partial<TemplateSettings>>({})
  const [config, setConfig] = useState<TemplateConfig | undefined>(undefined)
  const [loading, setLoading] = useState(!!cvId)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasUnsavedChangesRef = useRef(false)

  // Load CV by ID
  useEffect(() => {
    if (cvId) {
      loadCv(cvId)
    } else {
      // New CV - set default content
      setContent(DEFAULT_CV_CONTENT)
      setLoading(false)
    }
  }, [cvId])

  // Auto-save mechanism (every 30 seconds if there are unsaved changes)
  useEffect(() => {
    const startAutoSave = () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
      
      autoSaveTimerRef.current = setInterval(() => {
        if (hasUnsavedChangesRef.current && cv) {
          saveCv()
        }
      }, 30000) // 30 seconds
    }

    startAutoSave()
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [cv])

  const loadCv = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useCVEditor] Loading CV:', id)
      const response = await cvApi.get(id)
      const cvData = response.data

      // Log what we received from database
      console.log('[useCVEditor] 📥 Raw data from database:', {
        id: cvData.id,
        'config.colors.accent': cvData.config?.colors?.accent,
        'config.typography.baseFontSize': cvData.config?.typography?.baseFontSize,
        'config.typography.fontScale': cvData.config?.typography?.fontScale,
        'settings.accentColor': cvData.settings?.accentColor,
      })

      // Migrate old config structure to new font sizing system
      const migratedConfig = migrateTemplateConfig(cvData.config)

      // Check if migration actually changed anything (check for presence of new structure)
      const needsMigration = cvData.config &&
        (!cvData.config.typography?.baseFontSize || !cvData.config.typography?.fontScale)

      console.log('[useCVEditor] 🔍 Migration check:', {
        needsMigration,
        hasBaseFontSize: !!cvData.config?.typography?.baseFontSize,
        hasFontScale: !!cvData.config?.typography?.fontScale,
        'migratedConfig.colors.accent': migratedConfig?.colors?.accent,
        'originalConfig.colors.accent': cvData.config?.colors?.accent,
      })

      setCv(cvData)
      setContent(cvData.content)
      setSettings(cvData.settings || {})
      setConfig(migratedConfig)

      // Only save migration if config actually needed migration
      if (needsMigration && migratedConfig) {
        console.log('[useCVEditor] 🔄 Config needs migration, saving to database immediately')
        try {
          await cvApi.update(id, { config: migratedConfig })
          console.log('[useCVEditor] ✅ Migrated config saved successfully')
        } catch (saveErr) {
          console.error('[useCVEditor] ❌ Failed to save migrated config:', saveErr)
          // Don't fail the load if migration save fails
        }
      } else {
        console.log('[useCVEditor] ✅ Config already migrated, skipping save')
      }
    } catch (err) {
      console.error('[useCVEditor] ❌ Failed to load CV:', err)
      setError(err instanceof Error ? err.message : 'Failed to load CV')
    } finally {
      setLoading(false)
    }
  }

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    hasUnsavedChangesRef.current = true
    setSaveStatus('idle')
  }, [])

  const updateSettings = useCallback((newSettings: Partial<TemplateSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    hasUnsavedChangesRef.current = true
    setSaveStatus('idle')
  }, [])

  const updateConfig = useCallback((newConfig: Partial<TemplateConfig>) => {
    setConfig(prev => {
      // Deep merge to preserve nested properties
      const updated: TemplateConfig = {
        colors: newConfig.colors ? { ...prev?.colors, ...newConfig.colors } : prev?.colors,
        typography: newConfig.typography ? { ...prev?.typography, ...newConfig.typography } : prev?.typography,
        layout: newConfig.layout ? { ...prev?.layout, ...newConfig.layout } : prev?.layout,
        components: newConfig.components ? { ...prev?.components, ...newConfig.components } : prev?.components,
        pdf: newConfig.pdf ? { ...prev?.pdf, ...newConfig.pdf } : prev?.pdf,
        advanced: newConfig.advanced ? { ...prev?.advanced, ...newConfig.advanced } : prev?.advanced,
      } as TemplateConfig

      console.log('[useCVEditor] 📝 updateConfig:', {
        'new.colors.accent': newConfig.colors?.accent,
        'result.colors.accent': updated.colors?.accent,
        'result.typography.baseFontSize': updated.typography?.baseFontSize,
      })
      return updated
    })
    hasUnsavedChangesRef.current = true
    setSaveStatus('idle')
  }, [])

  const saveCv = useCallback(async (configOverride?: TemplateConfig) => {
    if (saveStatus === 'saving') return

    const configToSave = configOverride || config

    try {
      setSaveStatus('saving')
      hasUnsavedChangesRef.current = false

      if (cv) {
        console.log('[useCVEditor] 💾 Saving to database:', {
          id: cv.id,
          'config.colors.accent': configToSave?.colors?.accent,
          'config.typography.baseFontSize': configToSave?.typography?.baseFontSize,
          'config.typography.fontScale.h1': configToSave?.typography?.fontScale?.h1,
          'settings.accentColor': settings?.accentColor,
        })
        // Update existing CV
        const response = await cvApi.update(cv.id, {
          content,
          settings: settings as TemplateSettings,
          config: configToSave
        })
        setCv(response.data)
        console.log('[useCVEditor] ✅ CV saved successfully')
      } else {
        // Create new CV
        const name = extractNameFromContent(content) || 'New CV'
        const response = await cvApi.create({
          name,
          content,
          template_id: 'default-modern' // Default template
        })
        setCv(response.data)
        
        // Update URL to include the new CV ID
        window.history.replaceState(null, '', `/editor/${response.data.id}`)
      }

      setSaveStatus('saved')

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)

    } catch (err) {
      setSaveStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to save CV')
      hasUnsavedChangesRef.current = true
    }
  }, [cv, content, settings, config, saveStatus])

  const exportCv = useCallback(async (type: 'pdf' | 'web_package') => {
    if (!cv) return

    try {
      // Ensure CV is saved before export
      if (hasUnsavedChangesRef.current) {
        await saveCv()
      }

      const response = await exportApi.create({
        cv_id: cv.id,
        export_type: type,
        settings,
        expires_in_hours: 24
      })

      // Download the export
      const downloadUrl = exportApi.getDownloadUrl(response.data)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = response.data.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CV')
    }
  }, [cv, settings, saveCv])

  const reloadCv = useCallback(async () => {
    if (cv?.id) {
      await loadCv(cv.id)
    }
  }, [cv?.id])

  return {
    cv,
    content,
    settings,
    config,
    loading,
    error,
    saveStatus,
    updateContent,
    updateSettings,
    updateConfig,
    saveCv,
    reloadCv,
    exportCv
  }
}

// Utility function to extract name from frontmatter
function extractNameFromContent(content: string): string | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return null

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  return nameMatch ? nameMatch[1].trim() : null
}