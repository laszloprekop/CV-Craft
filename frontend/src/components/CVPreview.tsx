/**
 * CV Preview Component
 *
 * Renders the live preview of the CV with template styling matching design proposal
 *
 * Note: This file uses CSS custom properties (CSS variables) extensively for theming.
 * TypeScript's strict CSS type checking is relaxed for style objects that contain CSS variables.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState, useEffect } from 'react'
import { Phone, Envelope, LinkedinLogo, GithubLogo, MapPin, Globe } from '@phosphor-icons/react'
import type { CVInstance, Template, TemplateSettings, TemplateConfig, Asset, CVFrontmatter, CVSection, ParsedCVContent } from '../../../shared/types'
import { assetApi } from '../services/api'
import { loadFonts } from '../services/GoogleFontsService'
import { resolveSemanticColor } from '../utils/colorResolver'
import { generateCSSVariables } from '../../../shared/utils/cssVariableGenerator'

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

// Type for PDF page data
interface PDFPageData {
  frontmatter: CVFrontmatter | null
  sections: CVSection[]
  pageNumber: number
  isFirstPage: boolean
}

interface CVPreviewProps {
  cv: CVInstance | null
  template: Template | null
  settings: Partial<TemplateSettings>
  config?: TemplateConfig // Add config support
  isPending: boolean
  liveContent?: string // Live content from editor for real-time preview
  zoomLevel?: 'fit-width' | 'fit-height' | 'actual-size' | 'custom'
  zoomPercentage?: number
  previewMode?: 'web' | 'pdf'
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
  previewMode = 'web',
  onSettingsChange
}) => {
  // State for profile photo URL
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Ref for measuring actual section heights
  const measureContainerRef = React.useRef<HTMLDivElement>(null)
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map())

  // Create stable key from measured heights for dependency tracking
  const measuredHeightsKey = useMemo(() => {
    return Array.from(measuredHeights.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value.toFixed(2)}`)
      .join('|')
  }, [measuredHeights])

  // Track overflow issues for PDF mode
  const [overflowWarnings, setOverflowWarnings] = useState<string[]>([])

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

  // Measure actual section heights in PDF mode
  useEffect(() => {
    if (previewMode !== 'pdf' || !measureContainerRef.current || !parsedContent) {
      return
    }

    // Wait for next frame to ensure DOM is rendered
    requestAnimationFrame(() => {
      if (!measureContainerRef.current) return

      const newHeights = new Map<string, number>()
      const container = measureContainerRef.current

      // Measure header height
      const header = container.querySelector('[data-measure="header"]')
      if (header) {
        newHeights.set('header', header.getBoundingClientRect().height)
      }

      // Measure each section
      container.querySelectorAll('[data-measure-section]').forEach((element) => {
        const sectionIndex = element.getAttribute('data-measure-section')
        if (sectionIndex) {
          newHeights.set(`section-${sectionIndex}`, element.getBoundingClientRect().height)
        }
      })

      console.log('[CVPreview] Measured heights:', Object.fromEntries(newHeights))
      setMeasuredHeights(newHeights)
    })
  }, [previewMode, parsedContent])

  // Apply template-based styling - memoized to prevent infinite re-renders
  const templateStyles = useMemo((): CSSCustomProperties => {
    if (!template) return {}

    // Prefer config over settings (config is newer, more comprehensive)
    const activeConfig = config || template.default_config

    console.log('[CVPreview] 🎨 Applying styles:', {
      'accent': activeConfig?.colors.accent,
      'baseFontSize': activeConfig?.typography.baseFontSize,
    })

    // Use shared CSS variable generator for consistency with PDF export
    const cssVariables = generateCSSVariables(activeConfig)

    return cssVariables as CSSCustomProperties
  }, [template, config])

  // Calculate content height and split into pages for PDF mode - memoized to prevent infinite re-renders
  const pdfPagesData = useMemo((): { pages: PDFPageData[]; warnings: string[] } => {
    if (!parsedContent || previewMode !== 'pdf') {
      return { pages: parsedContent ? [{ frontmatter: parsedContent.frontmatter, sections: parsedContent.sections, pageNumber: 1, isFirstPage: true }] : [], warnings: [] }
    }

    // A4 dimensions: 210mm × 297mm
    // With margins: 20mm top/bottom, 15mm left/right
    // Content area: 180mm × 257mm
    const pageContentHeight = 257 // mm available for content after margins
    const mmToPx = 3.779528 // precise mm to px conversion at 96 DPI
    const pageHeightPx = pageContentHeight * mmToPx // ~971px

    const pages: PDFPageData[] = []
    const { frontmatter, sections } = parsedContent
    const warnings: string[] = []

    // Use measured header height or fallback to estimate
    const headerHeight = measuredHeights.get('header') || 150
    console.log('[splitContentIntoPages] Using header height:', headerHeight)

    // Check if header alone is too large
    if (headerHeight > pageHeightPx * 0.4) {
      warnings.push(`Header is very large (${Math.round(headerHeight)}px). Consider shortening your name or title.`)
    }

    let currentPage: PDFPageData = {
      frontmatter,
      sections: [],
      pageNumber: 1,
      isFirstPage: true
    }
    let currentHeight = headerHeight

    sections.forEach((section: CVSection, index: number) => {
      // Use measured height if available, otherwise estimate
      const measuredKey = `section-${index}`
      let sectionHeight: number

      if (measuredHeights.has(measuredKey)) {
        sectionHeight = measuredHeights.get(measuredKey)!
        console.log(`[splitContentIntoPages] Using measured height for section ${index}:`, sectionHeight)
      } else {
        // Fallback estimation if measurements not yet available
        sectionHeight = 80 // base height for section header

        if (Array.isArray(section.content)) {
          (section.content as unknown[]).forEach((item: unknown) => {
            if (typeof item === 'string') {
              // Estimate paragraph height based on character count
              const lines = Math.ceil(item.length / 80) // ~80 chars per line
              sectionHeight += lines * 20 + 10 // line height + spacing
            } else if (typeof item === 'object' && item !== null && 'title' in item) {
              // Job/education entry with title, company, description
              sectionHeight += 120 // fixed height for structured entry
            }
          })
        } else {
          sectionHeight += 60 // simple text section
        }
        console.log(`[splitContentIntoPages] Using estimated height for section ${index}:`, sectionHeight)
      }

      // Check if single section is too large for one page
      if (sectionHeight > pageHeightPx) {
        warnings.push(`Section "${section.title}" is too large (${Math.round(sectionHeight)}px) to fit on one page. Consider breaking it into smaller sections.`)
      }

      // Check if section fits on current page (with keep-together logic)
      if (currentHeight + sectionHeight > pageHeightPx && currentPage.sections.length > 0) {
        // Section doesn't fit, start new page
        console.log(`[splitContentIntoPages] Section ${index} doesn't fit (${currentHeight + sectionHeight}px > ${pageHeightPx}px), creating new page`)

        // Check if current page is nearly empty (< 20% filled)
        if (currentHeight < pageHeightPx * 0.2) {
          warnings.push(`Page ${currentPage.pageNumber} has very little content. Consider adjusting content distribution.`)
        }

        pages.push(currentPage)
        currentPage = {
          frontmatter: null, // No header on continuation pages
          sections: [section],
          pageNumber: pages.length + 1,
          isFirstPage: false
        }
        currentHeight = sectionHeight
      } else {
        // Section fits, add to current page
        currentPage.sections.push(section)
        currentHeight += sectionHeight
      }
    })

    // Add final page
    if (currentPage.sections.length > 0) {
      pages.push(currentPage)
    }

    console.log(`[splitContentIntoPages] Created ${pages.length} pages`)

    const finalPages = pages.length > 0 ? pages : [{ frontmatter, sections, pageNumber: 1, isFirstPage: true }]
    return { pages: finalPages, warnings }
  }, [parsedContent, previewMode, measuredHeightsKey])

  // Update overflow warnings when PDF pages data changes
  useEffect(() => {
    if (previewMode === 'pdf') {
      setOverflowWarnings(pdfPagesData.warnings)
    } else {
      setOverflowWarnings([])
    }
  }, [previewMode, pdfPagesData.warnings])

  // Render individual PDF page
  const renderPDFPage = (pageData: PDFPageData, pageIndex: number) => {
    const { frontmatter, sections, pageNumber, isFirstPage } = pageData
    const styles = templateStyles
    const useMinimalLayout = template?.name.includes('Minimal') || template?.name.includes('Clean')

    // Separate sections for two-column layout
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

    return (
      <div
        key={pageIndex}
        className="bg-white shadow-lg mx-auto mb-6 relative keep-together"
        style={{
          width: templateStyles['--page-width'] as string || '210mm',
          height: '297mm',
          padding: `${templateStyles['--page-margin-top']} ${templateStyles['--page-margin-right']} ${templateStyles['--page-margin-bottom']} ${templateStyles['--page-margin-left']}`,
          pageBreakAfter: 'always',
          boxSizing: 'border-box'
        }}
      >
        {/* Page content with template styling */}
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
            ...templateStyles,
            fontFamily: templateStyles['--font-family'],
            fontSize: templateStyles['--body-font-size'],
            color: templateStyles['--text-color']
          }}
        >
          {useMinimalLayout ? (
            // Minimal Clean - Single column layout
            <>
              {/* Header only on first page */}
              {frontmatter && (
                <header className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${templateStyles['--accent-color']}` }}>
                  <h1
                    className="font-bold mb-2"
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
                      className="font-medium mb-4"
                      style={{
                        fontSize: templateStyles['--h3-font-size'],
                        color: templateStyles['--accent-color'] || '#6b7280'
                      }}
                    >
                      {frontmatter.title}
                    </p>
                  )}
                  {/* Contact info centered */}
                  <div className="flex justify-center gap-4 mb-4" style={{
                    color: templateStyles['--contact-icon-color'],
                    fontSize: templateStyles['--contact-font-size'],
                    gap: templateStyles['--contact-spacing']
                  }}>
                    {frontmatter.email && <span>{frontmatter.email}</span>}
                    {frontmatter.phone && <span>{frontmatter.phone}</span>}
                    {frontmatter.location && <span>{frontmatter.location}</span>}
                  </div>
                </header>
              )}

              {/* All sections in single column */}
              {sections.map((section, sectionIndex) => (
                <section key={sectionIndex} className="mb-6 keep-together" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <h2
                    className="text-lg font-bold uppercase tracking-wide mb-3 pb-1"
                    style={{
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
                    }}
                  >
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {renderSectionContent(section)}
                  </div>
                </section>
              ))}
            </>
          ) : (
            // Modern Professional - Two column layout
            <div className="flex h-full">
              {/* Left sidebar for skills/contact */}
              <div
                className="w-2/5"
                style={{
                  backgroundColor: templateStyles['--surface-color'] as string || '#e6d7c3',
                  padding: '0.5cm',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                {/* Contact info in sidebar */}
                {frontmatter && (
                  <div className="mb-6">
                    <div className="text-center mb-4">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Profile"
                          className="w-32 h-32 rounded-full mx-auto mb-3 object-cover"
                          style={{ width: '200px', height: '200px' }}
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full mx-auto mb-3 flex items-center justify-center"
                             style={{ backgroundColor: '#d4a574', width: '200px', height: '200px' }}>
                          <span className="text-white text-xs font-medium">Photo</span>
                        </div>
                      )}
                      <h1
                        className="font-bold mb-2"
                        style={{
                          fontSize: templateStyles['--name-font-size'],
                          fontWeight: templateStyles['--name-font-weight'],
                          color: 'var(--on-secondary-color)',
                          letterSpacing: templateStyles['--name-letter-spacing'],
                          textTransform: templateStyles['--name-text-transform'] as any,
                          textAlign: 'center',
                          marginBottom: templateStyles['--name-margin-bottom'],
                          fontFamily: templateStyles['--heading-font-family']
                        }}
                      >
                        {frontmatter.name || 'Your Name'}
                      </h1>
                      {frontmatter.title && (
                        <p
                          className="font-medium text-center mb-4"
                          style={{
                            fontSize: templateStyles['--body-font-size'],
                            color: 'var(--on-secondary-color)'
                          }}
                        >
                          {frontmatter.title}
                        </p>
                      )}
                    </div>

                    {/* Contact details with icons */}
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

                {/* Sidebar sections */}
                {sidebarSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6 keep-together" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3
                      className="text-sm font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                      style={{
                        fontFamily: templateStyles['--heading-font-family'],
                        color: 'var(--on-tertiary-color)',
                        backgroundColor: templateStyles['--accent-color'] as string || '#c4956c'
                      }}
                    >
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {renderSectionContent(section, true)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right main content */}
              <div
                className="flex-1"
                style={{
                  backgroundColor: templateStyles['--background-color'] as string || '#f7f5f3',
                  padding: '0.5cm',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                {/* Header only on first page */}
                {pageNumber === 1 && frontmatter && (
                  <header className="mb-6">
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
                        className="font-medium mb-4"
                        style={{
                          fontSize: templateStyles['--h3-font-size'],
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {frontmatter.title}
                      </p>
                    )}
                  </header>
                )}

                {/* Main content sections */}
                {mainSections.map((section, sectionIndex) => (
                  <section key={sectionIndex} className="mb-6 keep-together" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h2
                      className="text-base font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                      style={{
                        fontFamily: templateStyles['--heading-font-family'],
                        fontSize: templateStyles['--section-header-font-size'],
                        fontWeight: templateStyles['--section-header-font-weight'],
                        color: 'var(--on-primary-color)',
                        textTransform: templateStyles['--section-header-text-transform'] as any,
                        letterSpacing: templateStyles['--section-header-letter-spacing'],
                        backgroundColor: templateStyles['--primary-color'] as string || '#a8956b',
                        marginTop: templateStyles['--section-header-margin-top'],
                        marginBottom: templateStyles['--section-header-margin-bottom']
                      }}
                    >
                      {section.title}
                    </h2>
                    <div className="space-y-3">
                      {renderSectionContent(section, false)}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Page number */}
        <div
          className="absolute bottom-4 right-4 text-xs"
          style={{ fontSize: 'var(--tiny-font-size)', color: 'var(--text-muted)' }}
        >
          Page {pageNumber}
        </div>
      </div>
    )
  }

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
  const renderSectionContent = (section: CVSection, isSidebar: boolean = false) => {
    // Special handling for skills - check both type and title
    const isSkillsSection = section.type === 'skills' ||
                           section.title?.toLowerCase().includes('skill') ||
                           section.title?.toLowerCase().includes('technical')

    if (isSkillsSection) {
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

    // Special handling for simple list items (languages, interests, etc.)
    const isSimpleList = ['languages', 'interests', 'tools', 'hobbies'].some(type =>
      section.title?.toLowerCase().includes(type) || section.type === type
    )

    if (isSimpleList && Array.isArray(section.content)) {
      return (section.content as unknown[]).map((item: unknown, itemIndex: number) => {
        const itemObj = item as { name?: string; text?: string }
        const itemText = typeof item === 'string' ? item : (itemObj.name || itemObj.text || String(item))
        return (
          <div key={itemIndex} className="mb-2">
            <p
              className="leading-relaxed"
              style={{
                fontSize: `var(--${isSidebar ? 'small' : 'body'}-font-size)`,
                color: isSidebar ? '#4a3d2a' : '#2d2d2d'
              }}
            >
              {renderMarkdown(itemText)}
            </p>
          </div>
        )
      })
    }

    return Array.isArray(section.content) ? (
      (section.content as unknown[]).map((item: unknown, itemIndex: number) => (
        <div key={itemIndex}>
          {typeof item === 'string' ? (
            <p
              className="leading-relaxed"
              style={{
                fontSize: `var(--${isSidebar ? 'small' : 'body'}-font-size)`,
                color: isSidebar ? '#4a3d2a' : '#2d2d2d'
              }}
            >
              {renderMarkdown(item)}
            </p>
          ) : typeof item === 'object' && item !== null && 'title' in item ? (
            (() => {
              const entry = item as StructuredEntry
              return (
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3
                        className="font-semibold"
                        style={{
                          fontSize: isSidebar ? 'var(--small-font-size)' : templateStyles['--job-title-font-size'],
                          fontWeight: isSidebar ? 600 : templateStyles['--job-title-font-weight'],
                          color: isSidebar ? '#4a3d2a' : templateStyles['--job-title-color'],
                          marginBottom: isSidebar ? '2px' : templateStyles['--job-title-margin-bottom']
                        }}
                      >
                        {entry.title}
                      </h3>
                      {entry.company && (
                        <p
                          style={{
                            fontSize: isSidebar ? 'var(--tiny-font-size)' : templateStyles['--org-name-font-size'],
                            fontWeight: isSidebar ? 400 : templateStyles['--org-name-font-weight'],
                            color: isSidebar ? '#6b5b47' : templateStyles['--org-name-color'],
                            fontStyle: isSidebar ? 'normal' : templateStyles['--org-name-font-style'] as React.CSSProperties['fontStyle']
                          }}
                        >
                          {entry.company}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {entry.location && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{entry.location}</p>}
                      {entry.date && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{entry.date}</p>}
                    </div>
                  </div>
                  {entry.description && (
                    <p className="leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
                      {renderMarkdown(entry.description)}
                    </p>
                  )}
                </div>
              )
            })()
          ) : (
            <p className="leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
              {renderMarkdown(String(item))}
            </p>
          )}
        </div>
      ))
    ) : (
      <p className="leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
        {renderMarkdown(String(section.content))}
      </p>
    )
  }

  // Generate CV layout based on template and preview mode
  const renderCV = () => {
    if (!parsedContent) return null

    const { frontmatter, sections } = parsedContent
    const styles = templateStyles

    // Apply different layouts based on template
    const useModernLayout = template?.name.includes('Modern') || template?.name.includes('Professional')
    const useMinimalLayout = template?.name.includes('Minimal') || template?.name.includes('Clean')

    // For PDF mode, render paginated layout
    if (previewMode === 'pdf') {
      return (
        <div className="max-w-5xl mx-auto">
          {pdfPagesData.pages.map((page, index) => renderPDFPage(page, index))}
        </div>
      )
    }

    // For web mode, use existing layouts
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
          className="bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
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
                  {/* Render section content similar to main sections */}
                  {Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {typeof item === 'string' ? (
                          <p className="leading-relaxed" style={{ fontSize: 'var(--body-font-size)', color: 'var(--on-background-color)' }}>{renderMarkdown(item)}</p>
                        ) : typeof item === 'object' && item.title ? (
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold" style={{
                                  fontSize: templateStyles['--job-title-font-size'],
                                  fontWeight: templateStyles['--job-title-font-weight'],
                                  color: templateStyles['--job-title-color'],
                                  marginBottom: templateStyles['--job-title-margin-bottom']
                                }}>{item.title}</h3>
                                {item.company && <p style={{
                                  fontSize: templateStyles['--org-name-font-size'],
                                  fontWeight: templateStyles['--org-name-font-weight'],
                                  color: templateStyles['--org-name-color'],
                                  fontStyle: templateStyles['--org-name-font-style'] as any
                                }}>{item.company}</p>}
                              </div>
                              <div className="text-right text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.location && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.location}</p>}
                                {item.date && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.date}</p>}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-sm leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
                                {renderMarkdown(item.description)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>{JSON.stringify(item)}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="leading-relaxed" style={{ fontSize: 'var(--body-font-size)', color: 'var(--on-background-color)' }}>{section.content}</p>
                  )}
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
        className="bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
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
                backgroundColor: templateStyles['--surface-color'] as string || '#e6d7c3'
              }}
            >
              <div className="relative z-10" style={{ padding: '20mm 6mm' }}>
                {/* Profile Photo */}
                <div className="mb-6 flex justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="rounded-full object-cover"
                      style={{ width: '200px', height: '200px' }}
                    />
                  ) : (
                    <div className="rounded-full flex items-center justify-center overflow-hidden"
                         style={{ width: '200px', height: '200px', backgroundColor: 'var(--muted-color)' }}>
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
                {/* Section Header matching PDF style */}
                <h3
                  className="text-sm font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                  style={{
                    fontFamily: templateStyles['--heading-font-family'],
                    color: 'var(--on-tertiary-color)',
                    backgroundColor: templateStyles['--accent-color'] as string || '#c4956c'
                  }}
                >
                  {section.title}
                </h3>

                {/* Section Content - use unified rendering */}
                <div className="space-y-3">
                  {renderSectionContent(section, true)}
                </div>
                </div>
                ))}
              </div>
            </div>

            {/* Right Main Content */}
            <div className="flex-1 relative" style={{ minHeight: 'auto', backgroundColor: templateStyles['--background-color'] as string || '#f7f5f3' }}>
              <div className="relative z-10" style={{ padding: '20mm 8mm' }}>
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
                {/* Section Header matching PDF style */}
                <h2
                  className="text-base font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                  style={{
                    fontFamily: templateStyles['--heading-font-family'],
                    fontSize: templateStyles['--section-header-font-size'],
                    fontWeight: templateStyles['--section-header-font-weight'],
                    color: 'var(--on-primary-color)',
                    textTransform: templateStyles['--section-header-text-transform'] as any,
                    letterSpacing: templateStyles['--section-header-letter-spacing'],
                    backgroundColor: templateStyles['--primary-color'] as string || '#a8956b',
                    marginTop: templateStyles['--section-header-margin-top'],
                    marginBottom: templateStyles['--section-header-margin-bottom']
                  }}
                >
                  {section.title}
                </h2>

                {/* Section Content */}
                <div className="space-y-4">
                  {Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {typeof item === 'string' ? (
                          <p className="leading-relaxed" style={{ color: 'var(--on-background-color)' }}>{item}</p>
                        ) : (
                          <div className="mb-6 last:mb-0">
                            {/* Experience/Job Entry Format */}
                            <div className="mb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  {typeof item === 'object' && item.title && (
                                    <h3 className="font-bold text-lg mb-1" style={{
                                      fontSize: templateStyles['--job-title-font-size'],
                                      fontWeight: templateStyles['--job-title-font-weight'],
                                      color: templateStyles['--job-title-color'],
                                      marginBottom: templateStyles['--job-title-margin-bottom']
                                    }}>{item.title}</h3>
                                  )}
                                  {typeof item === 'object' && item.company && (
                                    <p className="font-semibold text-base" style={{
                                      fontSize: templateStyles['--org-name-font-size'],
                                      fontWeight: templateStyles['--org-name-font-weight'],
                                      color: templateStyles['--org-name-color'],
                                      fontStyle: templateStyles['--org-name-font-style'] as any
                                    }}>{item.company}</p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  {typeof item === 'object' && item.location && (
                                    <p className="flex items-center justify-end mb-1" style={{ fontSize: 'var(--tiny-font-size)', color: 'var(--text-secondary)' }}>
                                      <MapPin size={10} className="mr-1" />
                                      {item.location}
                                    </p>
                                  )}
                                  {typeof item === 'object' && item.date && (
                                    <p className="italic" style={{ fontSize: 'var(--tiny-font-size)', color: 'var(--text-secondary)' }}>{item.date}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {typeof item === 'object' && item.description && (
                              <p className="leading-relaxed" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
                                {item.description.split('\n\n').map((para: string, idx: number) => (
                                  <span key={idx}>
                                    {para}
                                    {idx < item.description.split('\n\n').length - 1 && <><br /><br /></>}
                                  </span>
                                ))}
                              </p>
                            )}
                            {typeof item === 'object' && item.bullets && item.bullets.length > 0 && (
                              <ul className="list-disc ml-6 space-y-1" style={{ fontSize: 'var(--small-font-size)', color: 'var(--on-background-color)' }}>
                                {item.bullets.map((bullet: any, bulletIdx: number) => (
                                  <li key={bulletIdx}>{typeof bullet === 'string' ? bullet : bullet.text}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="leading-relaxed" style={{ color: 'var(--on-background-color)' }}>{section.content}</p>
                  )}
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

  // NOTE: We DON'T use parsedContent.html because it's too simple (flat HTML)
  // We need the structured sections for sophisticated layout (two-column, tags, pagination)
  // The html field is only used for PDF export backend

  // FALLBACK: Use legacy section-based rendering (for PDF mode or old CVs)
  return (
    <div className="h-full bg-surface overflow-auto">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updating preview...</div>
        </div>
      )}

      {/* Overflow Warnings for PDF mode */}
      {previewMode === 'pdf' && overflowWarnings.length > 0 && (
        <div className="mx-6 mt-4 mb-2 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d', borderWidth: '1px' }}>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#d97706' }}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#92400e' }}>PDF Layout Warnings</h4>
              <ul className="text-xs space-y-1" style={{ color: '#b45309' }}>
                {overflowWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Hidden measuring container for PDF mode */}
      {previewMode === 'pdf' && parsedContent && (
        <div
          ref={measureContainerRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '210mm',
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        >
          {/* Render header for measurement */}
          {parsedContent.frontmatter && (
            <header data-measure="header" className="mb-8" style={templateStyles}>
              <h1
                className="font-bold uppercase tracking-wide mb-2"
                style={{
                  fontSize: 'var(--name-font-size)',
                  fontWeight: 'var(--name-font-weight)',
                  color: 'var(--name-color)',
                  letterSpacing: 'var(--name-letter-spacing)',
                  textTransform: 'var(--name-text-transform)' as any,
                  textAlign: 'var(--name-alignment)' as any,
                  marginBottom: 'var(--name-margin-bottom)',
                  fontFamily: 'var(--heading-font-family)'
                }}
              >
                {parsedContent.frontmatter.name || 'Your Name'}
              </h1>
              {parsedContent.frontmatter.title && (
                <p
                  className="font-medium"
                  style={{
                    fontSize: 'var(--h3-font-size)',
                    color: 'var(--accent-color)'
                  }}
                >
                  {parsedContent.frontmatter.title}
                </p>
              )}
            </header>
          )}

          {/* Render each section for measurement */}
          {parsedContent.sections.map((section, index) => (
            <section
              key={index}
              data-measure-section={index}
              className="mb-8"
              style={templateStyles}
            >
              <h3 className="text-base font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded">
                {section.title}
              </h3>
              <div className="space-y-3">
                {renderSectionContent(section, false)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* CV Preview Content */}
      <div className={`p-6 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
        <div
          className="transition-transform duration-200 ease-in-out"
          style={getZoomStyles()}
        >
          {renderCV()}
        </div>
      </div>
    </div>
  )
}
