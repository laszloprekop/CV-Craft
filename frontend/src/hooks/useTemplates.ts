import { useState, useEffect } from 'react'
import { templateApi } from '../services/api'
import type { Template } from '../../../shared/types'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await templateApi.list({ active_only: true })
      setTemplates(response.data)
      
      // Set default template as active
      const defaultTemplate = response.data.find(t => t.id === 'default-modern' || t.name.includes('Default'))
      if (defaultTemplate) {
        setActiveTemplate(defaultTemplate)
      } else if (response.data.length > 0) {
        setActiveTemplate(response.data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setActiveTemplate(template)
      } else {
        const response = await templateApi.get(templateId)
        setActiveTemplate(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    }
  }

  return {
    templates,
    activeTemplate,
    loading,
    error,
    loadTemplate,
    templatesLoading: loading
  }
}