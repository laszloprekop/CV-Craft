/**
 * CV Editor Hook
 * 
 * Manages CV state, auto-save, and editor operations according to SDD specifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cvApi, exportApi } from '../services/api'
import type { CVInstance, TemplateSettings, TemplateConfig } from '../../../shared/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseCVEditorReturn {
  cv: CVInstance | null
  content: string
  settings: TemplateSettings
  config: TemplateConfig | undefined
  loading: boolean
  error: string | null
  saveStatus: SaveStatus
  updateContent: (content: string) => void
  updateSettings: (settings: Partial<TemplateSettings>) => void
  updateConfig: (config: Partial<TemplateConfig>) => void
  saveCv: () => Promise<void>
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
  const [settings, setSettings] = useState<TemplateSettings>({})
  const [config, setConfig] = useState<TemplateConfig | undefined>(undefined)
  const [loading, setLoading] = useState(!!cvId)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
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

      const response = await cvApi.get(id)
      const cvData = response.data

      setCv(cvData)
      setContent(cvData.content)
      setSettings(cvData.settings || {})
      setConfig(cvData.config)
    } catch (err) {
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
    setConfig(prev => ({ ...prev, ...newConfig } as TemplateConfig))
    hasUnsavedChangesRef.current = true
    setSaveStatus('idle')
  }, [])

  const saveCv = useCallback(async () => {
    if (saveStatus === 'saving') return

    try {
      setSaveStatus('saving')
      hasUnsavedChangesRef.current = false

      if (cv) {
        // Update existing CV
        const response = await cvApi.update(cv.id, {
          content,
          settings,
          config
        })
        setCv(response.data)
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