/**
 * CV Editor Hook
 *
 * Manages CV state, auto-save, and editor operations according to SDD specifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cvApi, exportApi } from '../services/api'
import type { CVInstance, TemplateSettings, TemplateConfig } from '../../../shared/types'
import { migrateTemplateConfig } from '../utils/configMigration'

export const SAMPLE_CV_ID = '00000000-0000-4000-a000-000000000001'

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
name: Alex Morgan
title: Senior Full-Stack Developer
email: alex.morgan@example.com
phone: +1 (555) 012-0199
location: San Francisco, CA
website: alexmorgan.dev
linkedin: linkedin.com/in/alexmorgan
github: github.com/alexmorgan
---

## Professional Summary

Versatile full-stack developer with 8+ years of experience building **scalable web applications** and leading cross-functional teams. Specialized in *modern JavaScript frameworks*, cloud architecture, and developer experience tooling. Proven track record of delivering high-impact solutions that improve performance, reliability, and user engagement.

## Experience

### Senior Full-Stack Developer | Acme Technologies
*Jan 2021 - Present*
San Francisco, CA

Architected and delivered the company's next-generation SaaS platform serving 50,000+ active users.

- Led migration from monolithic architecture to **microservices**, reducing deployment time by 70%
- Designed real-time collaboration features using WebSockets and \`Redis Pub/Sub\`
- Mentored a team of 6 junior developers through code reviews and pair programming
- **Key Achievement:** Improved application load time from 4.2s to 1.1s through code splitting and caching strategies
  - Implemented lazy loading for all route-level components
  - Added service worker caching for static assets

### Front-End Developer | Digital Solutions Inc.
*Mar 2018 - Dec 2020*
New York, NY

Built customer-facing dashboards and internal tools for a fintech startup.

- Developed responsive [React](https://react.dev) dashboard processing 100K+ daily transactions
- Created a reusable component library adopted across 3 product teams
- Integrated third-party APIs including Stripe, Plaid, and Twilio
- Reduced frontend bundle size by 45% through tree-shaking and dynamic imports

### Junior Web Developer | CreativeWeb Agency
*Jun 2016 - Feb 2018*
Austin, TX

- Built 30+ client websites using modern HTML5, CSS3, and JavaScript
- Developed custom *WordPress themes* and plugins for e-commerce clients
- Collaborated with UX designers to translate Figma mockups into pixel-perfect implementations

## Education

### B.Sc. Computer Science | University of California, Berkeley
*2012 - 2016*
Berkeley, CA

- GPA: 3.7/4.0, Dean's List (6 semesters)
- Senior thesis: *"Optimizing Real-Time Data Pipelines for Web Applications"*

### Professional Development
*2020 - 2024*

- **AWS Solutions Architect Associate** - Amazon Web Services
- **Advanced React Patterns** - Frontend Masters
- **System Design for Interviews** - Educative.io

## Technical Skills

**Languages:** TypeScript, JavaScript, Python, Go, SQL, HTML5, CSS3
**Frontend:** React, Next.js, Vue.js, Tailwind CSS, Storybook
**Backend:** Node.js, Express, Django, GraphQL, REST APIs
**Cloud & DevOps:** AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, CI/CD
**Databases:** PostgreSQL, MongoDB, Redis, Elasticsearch
**Tools:** Git, VS Code, Figma, Jira, Datadog

## Projects

### Open Source CLI Tool
A developer productivity tool built with **Node.js** and \`TypeScript\` that automates common project scaffolding tasks. Featured on [Hacker News](https://news.ycombinator.com) with 500+ GitHub stars.

- Supports 12 project templates including React, Vue, and Express
- Published as an \`npm\` package with 10K+ monthly downloads

### Real-Time Analytics Dashboard
End-to-end analytics platform for monitoring application performance metrics.

- Built with React, D3.js, and WebSocket for live data streaming
- Handles 1M+ events per hour with sub-second visualization latency
- Deployed on AWS using *ECS Fargate* with auto-scaling

## Certifications & Awards

- **AWS Solutions Architect Associate** - Amazon Web Services, 2023
- **Best Technical Innovation Award** - Acme Technologies Hackathon, 2022
- **Google Developer Expert** - Web Technologies, 2021

## Languages

**English:** Native
**Spanish:** Professional proficiency
**Mandarin:** Conversational

## Interests

Open source development, tech mentorship, competitive programming, hiking, photography
`

export function useCVEditor(cvId?: string): UseCVEditorReturn {
  const [cv, setCv] = useState<CVInstance | null>(null)
  const [content, setContent] = useState('')
  const [settings, setSettings] = useState<Partial<TemplateSettings>>({})
  const [config, setConfig] = useState<TemplateConfig | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const hasUnsavedChangesRef = useRef(false)
  const duplicatingRef = useRef(false)

  // Load CV by ID, or redirect to the seeded sample CV
  useEffect(() => {
    if (cvId) {
      loadCv(cvId)
    } else {
      // No CV ID - redirect to the sample CV
      window.history.replaceState(null, '', `/editor/${SAMPLE_CV_ID}`)
      loadCv(SAMPLE_CV_ID)
    }
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
        const duplicateName = `New CV - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        const dupResponse = await cvApi.duplicate(id, duplicateName)
        const dupData = dupResponse.data
        window.history.replaceState(null, '', `/editor/${dupData.id}`)
        setCv(dupData)
        setContent(dupData.content)
        setSettings(dupData.settings || {})
        setConfig(migrateTemplateConfig(dupData.config))
        setLoading(false)
        duplicatingRef.current = false
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
    } catch (err: any) {
      // Only retry on network errors or 5xx server errors (backend not ready yet)
      // Don't retry on 4xx client errors (not found, validation, etc.)
      const status = err?.response?.status
      const isClientError = status && status >= 400 && status < 500
      if (retries > 0 && !isClientError) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadCv(id, retries - 1)
      }
      // CV not found or invalid ID - fall back to the sample CV (which will auto-duplicate)
      if (isClientError && id !== SAMPLE_CV_ID) {
        console.warn(`[useCVEditor] CV "${id}" not found, redirecting to sample CV`)
        window.history.replaceState(null, '', `/editor/${SAMPLE_CV_ID}`)
        return loadCv(SAMPLE_CV_ID)
      }
      console.error('[useCVEditor] Failed to load CV:', err)
      setError(err instanceof Error ? err.message : 'Failed to load CV')
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
        // When only config changed (configOverride provided), skip sending content
        // to avoid unnecessary re-parsing on the backend
        const updatePayload: Record<string, unknown> = {
          settings: settings as TemplateSettings,
          config: configToSave
        }
        if (!configOverride) {
          updatePayload.content = content
        }
        const response = await cvApi.update(cv.id, updatePayload)
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