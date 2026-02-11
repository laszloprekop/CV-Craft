import { useState, useEffect, useCallback } from 'react'
import { savedThemeApi } from '../services/api'
import type { SavedTheme, TemplateConfig } from '../../../shared/types'

export function useSavedThemes() {
  const [themes, setThemes] = useState<SavedTheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadThemes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await savedThemeApi.list()
      setThemes(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  const saveTheme = useCallback(async (name: string, config: TemplateConfig, templateId: string): Promise<SavedTheme | null> => {
    try {
      setError(null)
      const response = await savedThemeApi.create({ name, config, template_id: templateId })
      setThemes(prev => [response.data, ...prev])
      return response.data
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save theme'
      setError(msg)
      return null
    }
  }, [])

  const updateTheme = useCallback(async (id: string, data: { name?: string; config?: TemplateConfig }): Promise<SavedTheme | null> => {
    try {
      setError(null)
      const response = await savedThemeApi.update(id, data)
      setThemes(prev => prev.map(t => t.id === id ? response.data : t))
      return response.data
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update theme'
      setError(msg)
      return null
    }
  }, [])

  const deleteTheme = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await savedThemeApi.delete(id)
      setThemes(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete theme'
      setError(msg)
      return false
    }
  }, [])

  const renameTheme = useCallback(async (id: string, newName: string): Promise<SavedTheme | null> => {
    return updateTheme(id, { name: newName })
  }, [updateTheme])

  return {
    themes,
    loading,
    error,
    loadThemes,
    saveTheme,
    updateTheme,
    deleteTheme,
    renameTheme,
  }
}
