/**
 * CV Preview Component
 *
 * Renders the live preview of the CV with template styling matching design proposal
 *
 * Note: This file uses CSS custom properties (CSS variables) extensively for theming.
 * TypeScript's strict CSS type checking is relaxed for style objects that contain CSS variables.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Phone, Envelope, LinkedinLogo, GithubLogo, MapPin, Globe, Browser, FilePdf, ListDashes, Eye, EyeSlash } from '@phosphor-icons/react'
import type { CVInstance, Template, TemplateSettings, TemplateConfig, Asset, CVFrontmatter, CVSection, ParsedCVContent } from '../../../shared/types'
import { assetApi, cvApi } from '../services/api'
import { loadFonts } from '../services/GoogleFontsService'
import { resolveSemanticColor } from '../utils/colorResolver'
import { generateCSSVariables } from '../../../shared/utils/cssVariableGenerator'
import { renderSections } from '../../../shared/utils/sectionRenderer'
import { injectSemanticCSS } from '../utils/injectSemanticCSS'

// Inject shared semantic CSS on module load
injectSemanticCSS()

// Type for CSS properties including custom properties (CSS variables)
// Using Record<string, any> to allow CSS variable access without strict type checking
// This is a standard pattern for CSS-in-JS libraries that use CSS variables
type CSSCustomProperties = Record<string, any>

// Type for skill category
interface SkillCategory {
  category: string
  skills: (string | { name?: string; text?: string })[]
}

// Type for structured entry (job, education, project)
interface StructuredEntry {
  title: string
  company?: string
  date?: string
  location?: string
  description?: string
  bullets?: (string | { text: string })[]
}

// Preview mode types - two modes: HTML preview vs exact PDF
type PreviewMode = 'html' | 'exact-pdf'

// localStorage keys for persistence
const PREVIEW_MODE_KEY = 'cv-craft-preview-mode'
const PAGE_MARKERS_KEY = 'cv-craft-page-markers-visible'

// Load saved mode or default to 'html'
const getInitialPreviewMode = (): PreviewMode => {
  if (typeof window === 'undefined') return 'html'
  const saved = localStorage.getItem(PREVIEW_MODE_KEY)
  if (saved === 'html' || saved === 'exact-pdf') {
    return saved
  }
  // Migrate old values
  if (saved === 'web' || saved === 'page-markers') {
    localStorage.setItem(PREVIEW_MODE_KEY, 'html')
    return 'html'
  }
  return 'html'
}

// Load saved page markers visibility or default to true
const getInitialPageMarkersVisible = (): boolean => {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem(PAGE_MARKERS_KEY)
  if (saved === 'true' || saved === 'false') {
    return saved === 'true'
  }
  return true
}

// A4 page dimensions in mm
const A4_HEIGHT_MM = 297
const PAGE_MARGIN_MM = 20 // Top and bottom margins

interface CVPreviewProps {
  cv: CVInstance | null
  template: Template | null
  settings: Partial<TemplateSettings>
  config?: TemplateConfig // Add config support
  isPending: boolean
  liveContent?: string // Live content from editor for real-time preview
  zoomLevel?: 'fit-width' | 'fit-height' | 'actual-size' | 'custom'
  zoomPercentage?: number
  onSettingsChange: (settings: Partial<TemplateSettings>) => void
}

export const CVPreview: React.FC<CVPreviewProps> = ({
  cv,
  template,
  settings,
  config,
  isPending,
  liveContent,
  zoomLevel = 'fit-width',
  zoomPercentage = 100,
  onSettingsChange
}) => {
  // State for profile photo URL
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Preview mode state with localStorage persistence
  const [previewMode, setPreviewMode] = useState<PreviewMode>(getInitialPreviewMode)

  // Page markers visibility state with localStorage persistence
  const [pageMarkersVisible, setPageMarkersVisible] = useState<boolean>(getInitialPageMarkersVisible)

  // Ref for measuring content height for page markers
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [pageBreaks, setPageBreaks] = useState<number[]>([])

  // Exact PDF mode state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfVersion, setPdfVersion] = useState(0) // Used to track when PDF needs refresh

  // Handle mode change with persistence
  const handleModeChange = useCallback((mode: PreviewMode) => {
    setPreviewMode(mode)
    localStorage.setItem(PREVIEW_MODE_KEY, mode)
  }, [])

  // Handle page markers visibility toggle with persistence
  const handlePageMarkersToggle = useCallback(() => {
    setPageMarkersVisible(prev => {
      const newValue = !prev
      localStorage.setItem(PAGE_MARKERS_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Load Google Fonts when config changes
  useEffect(() => {
    const activeConfig = config || template?.default_config
    if (activeConfig?.typography.availableFonts && activeConfig.typography.availableFonts.length > 0) {
      console.log('[CVPreview] Loading Google Fonts:', activeConfig.typography.availableFonts)
      loadFonts(activeConfig.typography.availableFonts)
    }
  }, [config?.typography.availableFonts, template?.default_config?.typography.availableFonts])

  // Load photo from asset when cv.photo_asset_id changes
  useEffect(() => {
    console.log('[CVPreview] Photo useEffect triggered, cv.photo_asset_id:', cv?.photo_asset_id)

    // Reset immediately to avoid stale photo URL
    setPhotoUrl(null)

    // If no photo_asset_id, nothing to load
    if (!cv?.photo_asset_id) {
      console.log('[CVPreview] No photo_asset_id, skipping load')
      return
    }

    // Load asynchronously without blocking render
    const loadPhoto = async () => {
      try {
        console.log('[CVPreview] Fetching asset:', cv.photo_asset_id)
        const response = await assetApi.get(cv.photo_asset_id!)
        const photoAsset = response.data
        const photoUrl = assetApi.getFileUrl(photoAsset)
        console.log('[CVPreview] Photo loaded, URL:', photoUrl)
        setPhotoUrl(photoUrl)
      } catch (error) {
        console.error('[CVPreview] Failed to load profile photo:', error)
        // Don't set to null here - keep previous state to avoid flicker
      }
    }

    loadPhoto()
  }, [cv?.photo_asset_id])

  // Simple client-side markdown parser for live preview
  const parseMarkdownContent = (content: string): ParsedCVContent => {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let frontmatter: CVFrontmatter = { name: '', email: '' }
    let markdownContent = content

    if (frontmatterMatch) {
      // Parse YAML frontmatter (basic parsing)
      const yamlContent = frontmatterMatch[1]
      markdownContent = content.slice(frontmatterMatch[0].length)

      yamlContent.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim()
          const keyTrimmed = key.trim()
          // Handle photo URLs which might start with http:// or https://
          frontmatter[keyTrimmed] = value
        }
      })
    } else {
      // Extract from plain markdown (first H1 as name, email from content)
      const h1Match = markdownContent.match(/^#\s+(.+)$/m)
      const emailMatch = markdownContent.match(/[\w\.-]+@[\w\.-]+\.\w+/)
      const phoneMatch = markdownContent.match(/(?:📱|phone)[\s\*]*:?\s*([\+\d\s\-\(\)\.]+)/i)
      const locationMatch = markdownContent.match(/(?:📍|location)[\s\*]*:?\s*([^,\n]+)/i)
      // Extract photo from markdown image syntax: ![alt](url)
      const photoMatch = markdownContent.match(/!\[(?:Profile|Photo|profile|photo)[^\]]*\]\(([^)]+)\)/)

      frontmatter = {
        name: h1Match ? h1Match[1].trim() : '',
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        location: locationMatch ? locationMatch[1].trim() : '',
        photo: photoMatch ? photoMatch[1].trim() : undefined
      }
    }

    // Parse sections with better structure parsing
    const sections: CVSection[] = []
    const sectionMatches = markdownContent.split(/^##\s+/m).slice(1)

    sectionMatches.forEach((sectionText: string) => {
      const lines = sectionText.split('\n')
      const title = lines[0].trim()
      const content = lines.slice(1).join('\n').trim()

      if (title && content) {
        const sectionType = inferSectionType(title)
        let parsedContent: CVSection['content']

        if (sectionType === 'experience' || sectionType === 'education' || sectionType === 'projects') {
          // Parse structured entries (job experiences, education, projects)
          parsedContent = parseStructuredEntries(content)
        } else if (sectionType === 'skills') {
          // Parse skills with categories
          parsedContent = parseSkills(content) as CVSection['content']
        } else {
          // Default parsing - split into paragraphs
          parsedContent = content.split('\n\n').filter((p: string) => p.trim())
        }

        sections.push({
          title,
          type: sectionType,
          content: parsedContent,
          level: 2
        })
      }
    })

    return { frontmatter, sections }
  }

  // Simple Markdown renderer for formatting
  const renderMarkdown = (text: string) => {
    if (!text) return null

    // Handle line breaks first - convert \n to <br/>
    let formatted = text.replace(/\n/g, '<br/>')

    // Handle bold (**text**) - use non-greedy match to avoid conflicts with italics
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

    // Handle italics (*text*) - only single asterisks not followed/preceded by another
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')

    // Handle links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--link-color); text-decoration: underline;">$1</a>')

    // Handle inline code `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background-color: var(--muted-color); padding: 0 0.25rem; border-radius: 0.125rem; font-size: var(--inline-code-font-size);">$1</code>')

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  // Parse structured entries (experience, education, projects)
  const parseStructuredEntries = (content: string): StructuredEntry[] => {
    const entries: StructuredEntry[] = []
    const entryBlocks = content.split(/^###\s+/m).slice(1)

    entryBlocks.forEach((block: string) => {
      const lines = block.split('\n').filter(line => line.trim())
      if (lines.length === 0) return

      const titleLine = lines[0].trim()
      let title = '', company = '', date = '', location = ''

      // Parse title line - various formats
      if (titleLine.includes('|')) {
        // Format: "Job Title | Company Name"
        const parts = titleLine.split('|')
        title = parts[0].trim()
        company = parts[1].trim()
      } else if (titleLine.includes(' at ')) {
        // Format: "Job Title at Company Name"
        const parts = titleLine.split(' at ')
        title = parts[0].trim()
        company = parts[1].trim()
      } else {
        title = titleLine
      }

      // Look for date/location in subsequent lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()

        // Date patterns (various formats)
        if (line.match(/^\*?.*\d{4}.*\*?$/) && !date) {
          date = line.replace(/\*/g, '').trim()
        }
        // Location patterns
        else if (line.includes('Gothenburg') || line.includes('Sweden') || line.includes('Stockholm')) {
          location = line.trim()
        }
        // Skip bullet points and descriptions for now
      }

      // Get description (remaining non-date/location lines)
      const descLines = lines.slice(1).filter(line => {
        const trimmed = line.trim()
        return !trimmed.match(/^\*?.*\d{4}.*\*?$/) &&
               !trimmed.includes('Gothenburg') &&
               !trimmed.includes('Sweden') &&
               trimmed.length > 0
      })

      entries.push({
        title,
        company,
        date,
        location,
        description: descLines.join(' ').trim()
      })
    })

    return entries
  }

  // Parse skills with better categorization
  const parseSkills = (content: string): SkillCategory[] => {
    const skillCategories: SkillCategory[] = []
    const lines = content.split('\n').filter((line: string) => line.trim())

    let i = 0
    while (i < lines.length) {
      const trimmed = lines[i].trim()

      // Check if line has category with colon (e.g., "**Programming Languages:** Kotlin, Java")
      const boldCategoryMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
      if (boldCategoryMatch) {
        const category = boldCategoryMatch[1].trim()
        let skillsStr = boldCategoryMatch[2].trim()

        // If skills are on the same line
        if (skillsStr) {
          const skills = skillsStr.split(',').map(s => s.trim().replace(/^\*\*|\*\*$/g, '')).filter(Boolean)
          skillCategories.push({ category, skills })
        }
        // If skills are on the next line
        else if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()
          const skills = nextLine.split(',').map(s => s.trim().replace(/^\*\*|\*\*$/g, '')).filter(Boolean)
          skillCategories.push({ category, skills })
          i++ // Skip next line since we processed it
        }
        i++
        continue
      }

      // Check for simple format like "Programming: JavaScript, Python"
      if (trimmed.includes(':')) {
        const [category, skillsStr] = trimmed.split(':')
        const skills = skillsStr.trim().split(',').map(s => s.trim().replace(/^\*\*|\*\*$/g, '')).filter(Boolean)
        skillCategories.push({
          category: category.trim().replace(/^\*\*|\*\*$/g, ''),
          skills
        })
      }
      i++
    }

    return skillCategories.length > 0 ? skillCategories : [{ category: 'Skills', skills: lines }]
  }

  /**
   * Render section content using the shared renderer
   * Used to ensure consistency between web preview and PDF export
   *
   * @param section - The CV section to render
   * @param forPDF - Whether this is for PDF mode (adds pagination classes)
   * @returns HTML string of the section content (inner content only, without section wrapper)
   */
  const renderSectionContentHTML = (section: CVSection, forPDF: boolean = false): string => {
    const html = renderSections([section], { pagination: forPDF, classPrefix: '' })
    return extractSectionInnerContent(html)
  }

  /**
   * Extract the inner content from rendered section HTML
   * Strips the section wrapper and header, returning just the section-content div's innerHTML
   */
  const extractSectionInnerContent = (html: string): string => {
    // Match the section-content div and extract its inner HTML
    const match = html.match(/<div class="[^"]*section-content[^"]*">([\s\S]*?)<\/div>\s*<\/section>/i)
    if (match) {
      return match[1].trim()
    }
    // Fallback: return the whole HTML if pattern doesn't match
    return html
  }

  /**
   * Check if a section should use special skills rendering (with pill/inline styles)
   * Skills sections need JSX-based rendering to support configurable tag styles
   */
  const isSpecialSkillsSection = (section: CVSection): boolean => {
    const titleLower = section.title?.toLowerCase() || ''
    return section.type === 'skills' ||
           titleLower.includes('skill') ||
           titleLower.includes('technical')
  }

  // Infer section type from title (simplified version)
  const inferSectionType = (title: string): CVSection['type'] => {
    const lower = title.toLowerCase()
    if (lower.includes('experience') || lower.includes('work')) return 'experience'
    if (lower.includes('education')) return 'education'
    if (lower.includes('skill')) return 'skills'
    if (lower.includes('project')) return 'projects'
    if (lower.includes('language')) return 'languages'
    if (lower.includes('certification')) return 'certifications'
    if (lower.includes('interest') || lower.includes('hobbies')) return 'interests'
    if (lower.includes('reference')) return 'references'
    if (lower.includes('summary') || lower.includes('about')) return 'summary'
    return 'paragraph'
  }

  // Parse CV content for preview - use backend sections for consistency
  const parsedContent = useMemo(() => {
    // ALWAYS use backend parsed_content for consistent rendering
    // Backend now provides rich structured sections (jobs, education, skills, etc.)
    if (cv?.parsed_content) {
      try {
        return cv.parsed_content
      } catch (error) {
        console.error('Failed to parse saved content:', error)
        return null
      }
    }

    // FALLBACK ONLY: If we have live content but no backend data (edge case)
    // This maintains basic functionality during live editing
    if (liveContent) {
      try {
        return parseMarkdownContent(liveContent)
      } catch (error) {
        console.error('Failed to parse live content:', error)
        return null
      }
    }

    return null
  }, [cv?.parsed_content, liveContent])

  // Load PDF preview when in exact-pdf mode
  useEffect(() => {
    if (previewMode !== 'exact-pdf' || !cv?.id) {
      return
    }

    let cancelled = false
    setPdfLoading(true)
    setPdfError(null)

    cvApi.getPreviewPdf(cv.id)
      .then(url => {
        if (!cancelled) {
          // Revoke old URL to prevent memory leak
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
          }
          setPdfUrl(url)
          setPdfLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[CVPreview] Failed to load PDF preview:', err)
          setPdfError('Failed to generate PDF preview')
          setPdfLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [previewMode, cv?.id, cv?.updated_at, pdfVersion])

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  // Apply template-based styling - memoized to prevent infinite re-renders
  const templateStyles = useMemo((): CSSCustomProperties => {
    if (!template) return {}

    // Prefer config over settings (config is newer, more comprehensive)
    const activeConfig = config || template.default_config

    console.log('[CVPreview] 🎨 Applying styles:', {
      'accent': activeConfig?.colors.accent,
      'baseFontSize': activeConfig?.typography.baseFontSize,
      'pageMargin': activeConfig?.layout?.pageMargin,
    })

    // Use shared CSS variable generator for consistency with PDF export
    const cssVariables = generateCSSVariables(activeConfig)

    console.log('[CVPreview] 📐 Page margins:', {
      '--page-margin-top': cssVariables['--page-margin-top'],
      '--page-margin-right': cssVariables['--page-margin-right'],
      '--page-margin-bottom': cssVariables['--page-margin-bottom'],
      '--page-margin-left': cssVariables['--page-margin-left'],
    })

    return cssVariables as CSSCustomProperties
  }, [template, config])

  // Calculate page breaks when content changes or page markers become visible
  useEffect(() => {
    if (!pageMarkersVisible || previewMode !== 'html' || !contentRef.current) {
      setPageBreaks([])
      return
    }

    // Delay calculation to allow content to render
    const calculatePageBreaks = () => {
      if (!contentRef.current) return

      const contentElement = contentRef.current
      const contentHeight = contentElement.scrollHeight

      // Convert mm to pixels (assuming 96 DPI standard)
      // 1mm = 3.7795275591 pixels at 96 DPI
      const MM_TO_PX = 3.7795275591
      const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX
      const marginPx = PAGE_MARGIN_MM * MM_TO_PX
      const contentAreaHeightPx = pageHeightPx - (2 * marginPx)

      // Calculate page break positions
      const breaks: number[] = []
      let currentPosition = contentAreaHeightPx

      while (currentPosition < contentHeight) {
        breaks.push(currentPosition)
        currentPosition += contentAreaHeightPx
      }

      setPageBreaks(breaks)
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      // Additional small delay to ensure all styles are applied
      setTimeout(calculatePageBreaks, 100)
    })

    return () => cancelAnimationFrame(rafId)
  }, [pageMarkersVisible, previewMode, parsedContent, templateStyles, zoomPercentage])

  // Helper function to render skills with configurable tag/separator style
  const renderSkills = (skillCategories: SkillCategory[], isSidebar: boolean = false) => {
    const activeConfig = config || template?.default_config
    const tagStyle = activeConfig?.components?.tags?.style || 'pill'
    const separator = activeConfig?.components?.tags?.separator || '·'
    const styles = templateStyles

    return skillCategories.map((category: SkillCategory, categoryIndex: number) => (
      <div key={categoryIndex} className="mb-4">
        <h4 className="text-xs font-semibold mb-2" style={{
            fontFamily: templateStyles['--heading-font-family'],
            color: isSidebar ? '#4a3d2a' : templateStyles['--text-color'] as string || '#2d2d2d' }}>
          {category.category}
        </h4>
        {tagStyle === 'pill' ? (
          // Pill style: rounded background tags
          <div className="flex flex-wrap gap-1">
            {category.skills.map((skill: string | { name?: string; text?: string }, skillIndex: number) => {
              const skillText = typeof skill === 'string' ? skill : (skill.name || skill.text || String(skill))
              return (
                <span
                  key={skillIndex}
                  className="inline-block px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: templateStyles['--tag-bg-color'] as string,
                    color: templateStyles['--tag-text-color'] as string,
                    borderRadius: templateStyles['--tag-border-radius'] as string,
                    fontFamily: templateStyles['--heading-font-family'],
                    fontSize: templateStyles['--tag-font-size-custom'] as string || templateStyles['--tag-font-size'] as string,
                    fontWeight: activeConfig?.components?.tags?.fontWeight || 500
                  }}
                >
                  {renderMarkdown(skillText)}
                </span>
              )
            })}
          </div>
        ) : (
          // Inline style: separated text
          <div className="text-sm" style={{
            color: isSidebar ? '#4a3d2a' : templateStyles['--text-color'] as string || '#2d2d2d',
            fontSize: templateStyles['--tag-font-size-custom'] as string || templateStyles['--tag-font-size'] as string
          }}>
            {category.skills.map((skill: string | { name?: string; text?: string }, skillIndex: number) => {
              const skillText = typeof skill === 'string' ? skill : (skill.name || skill.text || String(skill))
              return (
                <span key={skillIndex}>
                  {skillIndex > 0 && (separator === 'none' ? ' ' : ` ${separator} `)}
                  {renderMarkdown(skillText)}
                </span>
              )
            })}
          </div>
        )}
      </div>
    ))
  }

  // Helper function to render section content consistently
  // Uses shared renderer for non-skills sections to ensure consistency with PDF export
  const renderSectionContent = (section: CVSection, isSidebar: boolean = false, forPDF: boolean = false) => {
    // Special handling for skills - use JSX rendering for pill/inline styles
    if (isSpecialSkillsSection(section)) {
      // Parse skills if content is a string or array of strings
      let skillCategories
      if (Array.isArray(section.content)) {
        // Check if it's already parsed skill categories
        if (section.content.length > 0 && section.content[0].category) {
          skillCategories = section.content
        } else {
          // Parse from array of strings
          skillCategories = parseSkills(section.content.join('\n'))
        }
      } else if (typeof section.content === 'string') {
        skillCategories = parseSkills(section.content)
      } else {
        skillCategories = []
      }

      return renderSkills(skillCategories, isSidebar)
    }

    // For all other sections, use the shared renderer for consistency with PDF export
    const contentHTML = renderSectionContentHTML(section, forPDF)

    // Wrap in a div with appropriate class for sidebar styling
    return (
      <div
        className={`section-content ${isSidebar ? 'sidebar' : ''}`}
        dangerouslySetInnerHTML={{ __html: contentHTML }}
      />
    )
  }

  // Page break indicator component for page-markers mode
  const PageBreakIndicator: React.FC<{ pageNumber: number }> = ({ pageNumber }) => (
    <div className="page-break-indicator">
      <div className="page-break-line" />
      <span className="page-break-label">Page {pageNumber}</span>
    </div>
  )

  // Render Exact PDF preview using backend-generated PDF
  const renderExactPDF = () => {
    if (pdfLoading) {
      return (
        <div className="pdf-loading">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span>Generating PDF preview...</span>
          </div>
        </div>
      )
    }

    if (pdfError) {
      return (
        <div className="pdf-error">
          <div className="flex flex-col items-center gap-3">
            <span>{pdfError}</span>
            <button
              onClick={() => setPdfVersion(v => v + 1)}
              className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-hover"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    if (!pdfUrl) {
      return (
        <div className="pdf-loading">
          <span>Waiting for PDF...</span>
        </div>
      )
    }

    return (
      <iframe
        src={pdfUrl}
        className="exact-pdf-preview"
        title="PDF Preview"
      />
    )
  }

  // Generate CV layout based on template and preview mode
  const renderCV = () => {
    // For exact-pdf mode, render the PDF viewer
    if (previewMode === 'exact-pdf') {
      return renderExactPDF()
    }

    if (!parsedContent) return null

    const { frontmatter, sections } = parsedContent
    const styles = templateStyles

    // Apply different layouts based on template
    const useModernLayout = template?.name.includes('Modern') || template?.name.includes('Professional')
    const useMinimalLayout = template?.name.includes('Minimal') || template?.name.includes('Clean')

    // For web mode and page-markers mode, use continuous layouts
    // Separate sections into sidebar and main content
    const sidebarSections = sections.filter((s: CVSection) =>
      ['skills', 'languages', 'interests', 'tools'].some((type: string) =>
        (s.title?.toLowerCase() || '').includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter((s: CVSection) =>
      !['skills', 'languages', 'interests', 'tools'].some((type: string) =>
        (s.title?.toLowerCase() || '').includes(type) || s.type === type
      )
    )

    // Create different layouts based on template and preview mode
    if (useMinimalLayout) {
      return (
        <div
          className="cv-preview-content bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
          style={{
            minHeight: 'auto',
            width: '210mm',
            ...templateStyles,
            fontFamily: templateStyles['--font-family'],
            fontSize: templateStyles['--body-font-size'],
            color: templateStyles['--text-color']
          }}
        >
          {/* Minimal Single Column Layout */}
          <div className="p-8">
            {/* Header */}
            <header className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${templateStyles['--accent-color']}` }}>
              <h1 className="text-3xl font-bold mb-2" style={{
                fontFamily: templateStyles['--heading-font-family'],
                fontSize: templateStyles['--name-font-size'],
                fontWeight: templateStyles['--name-font-weight'],
                color: templateStyles['--name-color'],
                letterSpacing: templateStyles['--name-letter-spacing'],
                textTransform: templateStyles['--name-text-transform'] as any,
                textAlign: templateStyles['--name-alignment'] as any,
                marginBottom: templateStyles['--name-margin-bottom']
              }}>
                {frontmatter.name || 'Your Name'}
              </h1>
              {frontmatter.title && (
                <p className="mb-4" style={{ fontSize: 'var(--h3-font-size)', color: 'var(--text-secondary)' }}>{frontmatter.title}</p>
              )}
              {/* Contact Info in Minimal Style */}
              <div className="flex justify-center gap-4 text-sm" style={{
                color: templateStyles['--contact-icon-color'],
                fontSize: templateStyles['--contact-font-size'],
                gap: templateStyles['--contact-spacing']
              }}>
                {frontmatter.email && <span>{frontmatter.email}</span>}
                {frontmatter.phone && <span>{frontmatter.phone}</span>}
                {frontmatter.location && <span>{frontmatter.location}</span>}
              </div>
            </header>

            {/* All sections in single column */}
            {sections.map((section, index) => (
              <section key={index} className="mb-6">
                <h2 className="text-xl font-semibold mb-3 pb-1" style={{
                  fontFamily: templateStyles['--heading-font-family'],
                  fontSize: templateStyles['--section-header-font-size'],
                  fontWeight: templateStyles['--section-header-font-weight'],
                  color: templateStyles['--section-header-color'],
                  textTransform: templateStyles['--section-header-text-transform'] as any,
                  letterSpacing: templateStyles['--section-header-letter-spacing'],
                  borderBottom: templateStyles['--section-header-border-bottom'],
                  borderColor: templateStyles['--section-header-border-color'],
                  padding: templateStyles['--section-header-padding'],
                  marginTop: templateStyles['--section-header-margin-top'],
                  marginBottom: templateStyles['--section-header-margin-bottom']
                }}>
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {/* Use shared renderer for consistent web/PDF output */}
                  {renderSectionContent(section, false, false)}
                </div>
              </section>
            ))}
          </div>
        </div>
      )
    }

    // Default Modern Two-Column Layout
    return (
      <div
        className="cv-preview-content bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
        style={{
          minHeight: 'auto',
          width: templateStyles['--page-width'] as string || '210mm',
          ...templateStyles,
          fontFamily: templateStyles['--font-family'],
          fontSize: templateStyles['--body-font-size'],
          color: templateStyles['--text-color']
        }}
      >
        {/* Page Structure with proper margins */}
        <div className="relative" style={{ minHeight: 'auto' }}>
          {/* Two-column layout */}
          <div className="flex h-full">
            {/* Left Sidebar - Contact & Skills */}
            <div
              className="w-2/5 relative"
              style={{
                minHeight: 'auto',
                backgroundColor: templateStyles['--surface-color'] as string || '#e6d7c3',
                overflow: 'hidden'
              }}
            >
              <div className="relative z-10" style={{ padding: `${templateStyles['--page-margin-top'] || '20mm'} 6mm ${templateStyles['--page-margin-bottom'] || '20mm'} ${templateStyles['--page-margin-left'] || '6mm'}` }}>
                {/* Profile Photo - uses CSS variables for consistent styling with PDF */}
                <div className="mb-4 flex justify-center photo-container">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="profile-photo"
                      style={{
                        width: templateStyles['--profile-photo-size'] || '160px',
                        height: templateStyles['--profile-photo-size'] || '160px',
                        borderRadius: templateStyles['--profile-photo-border-radius'] || '50%',
                        border: templateStyles['--profile-photo-border'] || '3px solid #e2e8f0',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      className="profile-photo-placeholder"
                      style={{
                        width: templateStyles['--profile-photo-size'] || '160px',
                        height: templateStyles['--profile-photo-size'] || '160px',
                        borderRadius: templateStyles['--profile-photo-border-radius'] || '50%',
                        border: templateStyles['--profile-photo-border'] || '3px solid #e2e8f0',
                        backgroundColor: 'var(--muted-color)'
                      }}
                    >
                      <span style={{ fontSize: 'var(--tiny-font-size)', color: 'var(--on-muted-color)' }}>Photo</span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {frontmatter && (
                  <div className="mb-8">
                <div style={{ display: 'flex', flexDirection: 'column', gap: templateStyles['--contact-spacing'] }}>
                  {frontmatter.phone && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <Phone size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span>{frontmatter.phone}</span>
                    </div>
                  )}
                  {frontmatter.email && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <Envelope size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span className="break-all">{frontmatter.email}</span>
                    </div>
                  )}
                  {frontmatter.linkedin && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <LinkedinLogo size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span className="break-all">{frontmatter.linkedin.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.github && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <GithubLogo size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span className="break-all">{frontmatter.github.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.website && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <Globe size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span className="break-all">{frontmatter.website.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.location && (
                    <div className="flex items-center text-sm" style={{
                      color: 'var(--on-secondary-color)',
                      fontSize: templateStyles['--contact-font-size'],
                      gap: templateStyles['--contact-spacing']
                    }}>
                      <MapPin size={parseInt(templateStyles['--contact-icon-size'] as string) || 16} className="flex-shrink-0" style={{ color: templateStyles['--contact-icon-color'] }} />
                      <span>{frontmatter.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sidebar Sections (Skills, Languages, etc.) */}
            {sidebarSections.map((section, index) => (
              <div key={index} className="mb-8 keep-together" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* Section Header matching PDF style - uses h2 with section-header class like PDF */}
                <h2
                  className="font-bold uppercase tracking-wide rounded section-header"
                  style={{
                    fontFamily: templateStyles['--heading-font-family'],
                    fontSize: templateStyles['--h3-font-size'] || '1rem',
                    color: 'var(--on-tertiary-color)',
                    backgroundColor: templateStyles['--accent-color'] as string || '#c4956c',
                    padding: '4px 12px',
                    marginBottom: '12px',
                    marginTop: '8px',
                    letterSpacing: '0.05em',
                    borderBottom: 'none'
                  }}
                >
                  {section.title}
                </h2>

                {/* Section Content - use shared renderer for consistent web/PDF output */}
                <div className="space-y-3 sidebar">
                  {renderSectionContent(section, true, false)}
                </div>
                </div>
                ))}
              </div>
            </div>

            {/* Right Main Content */}
            <div className="flex-1 relative" style={{ minHeight: 'auto', backgroundColor: templateStyles['--background-color'] as string || '#f7f5f3' }}>
              <div className="relative z-10" style={{ padding: `${templateStyles['--page-margin-top'] || '20mm'} ${templateStyles['--page-margin-right'] || '8mm'} ${templateStyles['--page-margin-bottom'] || '20mm'} 8mm` }}>
                {/* Name and Title Header */}
                {frontmatter && (
                  <header className="mb-8">
                <h1
                  className="font-bold uppercase tracking-wide mb-2"
                  style={{
                    fontSize: templateStyles['--name-font-size'],
                    fontWeight: templateStyles['--name-font-weight'],
                    color: templateStyles['--name-color'],
                    letterSpacing: templateStyles['--name-letter-spacing'],
                    textTransform: templateStyles['--name-text-transform'] as any,
                    textAlign: templateStyles['--name-alignment'] as any,
                    marginBottom: templateStyles['--name-margin-bottom'],
                    fontFamily: templateStyles['--heading-font-family']
                  }}
                >
                  {frontmatter.name || 'Your Name'}
                </h1>
                {frontmatter.title && (
                  <p
                    className="font-medium"
                    style={{
                      fontSize: templateStyles['--h3-font-size'],
                      color: templateStyles['--accent-color'] || '#6b7280'
                    }}
                  >
                    {frontmatter.title}
                  </p>
                )}
              </header>
            )}

            {/* Main Content Sections */}
            {mainSections.map((section, index) => (
              <section key={index} className="mb-8 keep-together" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* Section Header matching PDF style exactly */}
                <h2
                  className="font-bold uppercase tracking-wide rounded section-header"
                  style={{
                    fontFamily: templateStyles['--heading-font-family'],
                    fontSize: templateStyles['--h3-font-size'] || '1rem',
                    fontWeight: 'bold',
                    color: 'var(--on-primary-color)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: templateStyles['--primary-color'] as string || '#a8956b',
                    padding: '4px 12px',
                    marginTop: index === 0 ? '0' : '12px',
                    marginBottom: '12px',
                    borderRadius: '4px',
                    borderBottom: 'none'
                  }}
                >
                  {section.title}
                </h2>

                {/* Section Content - Use shared renderer for consistent web/PDF output */}
                <div className="space-y-4">
                  {renderSectionContent(section, false, false)}
                </div>
              </section>
            ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-center" style={{ color: 'var(--text-muted)' }}>
          <h3 className="text-lg font-medium mb-2">No CV Selected</h3>
          <p className="text-sm">Create a new CV or select an existing one to see the preview.</p>
        </div>
      </div>
    )
  }

  // Calculate zoom styles based on zoom level and percentage
  const getZoomStyles = () => {
    const scale = zoomPercentage / 100
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top center'
    }
  }

  // Mode selector UI component
  const PreviewModeSelector: React.FC = () => (
    <div className="preview-mode-selector">
      <div className="mode-buttons">
        <button
          className={previewMode === 'html' ? 'active' : ''}
          onClick={() => handleModeChange('html')}
          title="Fast HTML preview"
        >
          <Browser size={16} weight="bold" />
          <span>HTML</span>
        </button>
        <button
          className={previewMode === 'exact-pdf' ? 'active' : ''}
          onClick={() => handleModeChange('exact-pdf')}
          title="Exact PDF preview from backend"
        >
          <FilePdf size={16} weight="bold" />
          <span>Exact PDF</span>
        </button>
      </div>
      {/* Page markers toggle - only visible in HTML mode */}
      {previewMode === 'html' && (
        <button
          className={`page-markers-toggle ${pageMarkersVisible ? 'active' : ''}`}
          onClick={handlePageMarkersToggle}
          title={pageMarkersVisible ? 'Hide page markers' : 'Show page markers'}
        >
          {pageMarkersVisible ? <Eye size={16} weight="bold" /> : <EyeSlash size={16} weight="bold" />}
          <ListDashes size={16} weight="bold" />
        </button>
      )}
    </div>
  )

  return (
    <div className="h-full bg-surface overflow-auto flex flex-col">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updating preview...</div>
        </div>
      )}

      {/* Mode Selector Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-surface sticky top-0 z-10">
        <PreviewModeSelector />
      </div>

      {/* CV Preview Content */}
      <div className={`flex-1 p-6 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'} ${previewMode === 'exact-pdf' ? 'p-0' : ''}`}>
        {previewMode === 'exact-pdf' ? (
          // Exact PDF mode takes full height without zoom transform
          <div className="h-full">
            {renderCV()}
          </div>
        ) : (
          // HTML mode uses zoom transform and optional page markers
          <div
            ref={contentRef}
            className="transition-transform duration-200 ease-in-out relative"
            style={getZoomStyles()}
          >
            {renderCV()}
            {/* Page break indicators */}
            {pageMarkersVisible && pageBreaks.map((position, index) => (
              <div
                key={index}
                className="page-break-indicator"
                style={{ top: `${position}px` }}
              >
                <div className="page-break-line" />
                <span className="page-break-label">Page {index + 2}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
