/**
 * CV Editor Hook
 *
 * Manages CV state, auto-save, and editor operations according to SDD specifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cvApi, exportApi } from '../services/api'
import type { CVInstance, TemplateSettings, TemplateConfig } from '../../../shared/types'
import { migrateTemplateConfig } from '../utils/configMigration'
import { isClientError, getErrorMessage } from '../utils/apiError'

export const SAMPLE_CV_ID = '00000000-0000-4000-a000-000000000001'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseCVEditorReturn {
  cv: CVInstance | null
  content: string
  settings: Partial<TemplateSettings>
  config: TemplateConfig | undefined
  loading: boolean
  /** Fatal: the CV could not be loaded, so there is nothing to edit. */
  error: string | null
  /** Recoverable: a save or export failed, but the CV is still open. */
  actionError: string | null
  dismissActionError: () => void
  saveStatus: SaveStatus
  updateContent: (content: string) => void
  updateSettings: (settings: Partial<TemplateSettings>) => void
  updateConfig: (config: Partial<TemplateConfig>) => void
  saveCv: (configOverride?: TemplateConfig) => Promise<void>
  reloadCv: () => Promise<void>
  exportCv: (type: 'pdf' | 'web_package') => Promise<void>
}

export function useCVEditor(cvId?: string): UseCVEditorReturn {
  const [cv, setCv] = useState<CVInstance | null>(null)
  const [content, setContent] = useState('')
  const [settings, setSettings] = useState<Partial<TemplateSettings>>({})
  const [config, setConfig] = useState<TemplateConfig | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const dismissActionError = useCallback(() => setActionError(null), [])

  const hasUnsavedChangesRef = useRef(false)
  const duplicatingRef = useRef(false)

  // saveCv is triggered from debounced callbacks that fire in the same tick as
  // updateContent, so reading `content` state there would save the previous
  // keystroke's text. This ref is always current.
  const contentRef = useRef('')

  // Guard against overlapping saves without silently dropping the newest edits:
  // a save requested mid-flight is re-run once the current one settles.
  const savingRef = useRef(false)
  const saveAgainRef = useRef(false)

  // Load CV by ID, or redirect to the seeded sample CV
  useEffect(() => {
    if (cvId) {
      loadCv(cvId)
    } else {
      // No CV ID - redirect to the sample CV
      window.history.replaceState(null, '', `/editor/${SAMPLE_CV_ID}`)
      loadCv(SAMPLE_CV_ID)
    }
    // loadCv is redefined every render; listing it here would refetch the CV
    // on every render. This should run only when the requested id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId])

  const loadCv = async (id: string, retries = 5) => {
    try {
      setLoading(true)
      setError(null)

      // Sample CV: auto-duplicate so the original stays pristine
      // Guard against React StrictMode double-firing the effect
      if (id === SAMPLE_CV_ID) {
        if (duplicatingRef.current) return
        duplicatingRef.current = true
        try {
          const duplicateName = `New CV - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          const dupResponse = await cvApi.duplicate(id, duplicateName)
          const dupData = dupResponse.data
          window.history.replaceState(null, '', `/editor/${dupData.id}`)
          setCv(dupData)
          setContent(dupData.content)
          contentRef.current = dupData.content
          setSettings(dupData.settings || {})
          setConfig(migrateTemplateConfig(dupData.config))
          setLoading(false)
        } finally {
          // Must clear on failure too, or every later attempt returns early
          // and the editor is stuck on the loading spinner for good.
          duplicatingRef.current = false
        }
        return
      }

      const response = await cvApi.get(id)
      const cvData = response.data

      // Migrate old config structure to new font sizing system
      const migratedConfig = migrateTemplateConfig(cvData.config)

      // Check if migration actually changed anything (check for presence of new structure)
      const needsMigration = cvData.config &&
        (!cvData.config.typography?.baseFontSize || !cvData.config.typography?.fontScale)

      setCv(cvData)
      setContent(cvData.content)
      contentRef.current = cvData.content
      setSettings(cvData.settings || {})
      setConfig(migratedConfig)

      // Only save migration if config actually needed migration
      if (needsMigration && migratedConfig) {
        try {
          await cvApi.update(id, { config: migratedConfig })
        } catch (saveErr) {
          console.error('[useCVEditor] Failed to save migrated config:', saveErr)
        }
      }
      setLoading(false)
    } catch (err) {
      // Only retry on network errors or 5xx server errors (backend not ready yet)
      // Don't retry on 4xx client errors (not found, validation, etc.)
      const clientError = isClientError(err)
      if (retries > 0 && !clientError) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadCv(id, retries - 1)
      }
      // CV not found or invalid ID - fall back to the sample CV (which will auto-duplicate)
      if (clientError && id !== SAMPLE_CV_ID) {
        console.warn(`[useCVEditor] CV "${id}" not found, redirecting to sample CV`)
        window.history.replaceState(null, '', `/editor/${SAMPLE_CV_ID}`)
        return loadCv(SAMPLE_CV_ID)
      }
      console.error('[useCVEditor] Failed to load CV:', err)
      setError(getErrorMessage(err, 'Failed to load CV'))
      setLoading(false)
    }
  }

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    contentRef.current = newContent
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

      return updated
    })
    hasUnsavedChangesRef.current = true
    setSaveStatus('idle')
  }, [])

  const saveCv = useCallback(async (configOverride?: TemplateConfig) => {
    if (savingRef.current) {
      // Re-run once the in-flight save settles, so the newest text still lands.
      saveAgainRef.current = true
      return
    }

    const configToSave = configOverride || config
    const contentToSave = contentRef.current

    savingRef.current = true

    try {
      setSaveStatus('saving')
      hasUnsavedChangesRef.current = false

      if (cv) {
        // When only config changed (configOverride provided), skip sending content
        // to avoid unnecessary re-parsing on the backend
        const updatePayload: Record<string, unknown> = {
          settings: settings as TemplateSettings,
          config: configToSave
        }
        if (!configOverride) {
          updatePayload.content = contentToSave
        }
        const response = await cvApi.update(cv.id, updatePayload)
        setCv(response.data)
      } else {
        // Create new CV
        const name = extractNameFromContent(contentToSave) || 'New CV'
        const response = await cvApi.create({
          name,
          content: contentToSave,
          template_id: 'default-modern' // Default template
        })
        setCv(response.data)

        // Update URL to include the new CV ID
        window.history.replaceState(null, '', `/editor/${response.data.id}`)
      }

      setSaveStatus('saved')
      // Cleared only on success, so the banner does not flicker off and back on
      // across a failing save's round trip.
      setActionError(null)

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)

    } catch (err) {
      // Recoverable: keep the editor open so the work in it is not lost.
      setSaveStatus('error')
      setActionError(getErrorMessage(err, 'Failed to save CV'))
      hasUnsavedChangesRef.current = true
    } finally {
      savingRef.current = false
      if (saveAgainRef.current) {
        saveAgainRef.current = false
        void saveCvRef.current()
      }
    }
  }, [cv, settings, config])

  // Auto-save mechanism (every 30 seconds if there are unsaved changes)
  // Use refs to avoid recreating the interval on every state change
  const cvRef = useRef(cv)
  cvRef.current = cv
  const saveCvRef = useRef(saveCv)
  saveCvRef.current = saveCv

  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChangesRef.current && cvRef.current) {
        saveCvRef.current()
      }
    }, 30000) // 30 seconds

    return () => {
      clearInterval(autoSaveTimer)
    }
  }, []) // Run once on mount - refs keep it current

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
      try {
        link.href = downloadUrl
        link.download = response.data.filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
      } finally {
        document.body.removeChild(link)
      }

    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to export CV'))
    }
  }, [cv, settings, saveCv])

  const reloadCv = useCallback(async () => {
    if (cv?.id) {
      await loadCv(cv.id)
    }
    // loadCv is redefined every render; including it would give every consumer
    // of reloadCv a new identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv?.id])

  return {
    cv,
    content,
    settings,
    config,
    loading,
    error,
    actionError,
    dismissActionError,
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