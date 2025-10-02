/**
 * CV Preview Component
 *
 * Renders the live preview of the CV with template styling matching design proposal
 */

import React, { useMemo, useState, useEffect } from 'react'
import { Phone, Envelope, LinkedinLogo, GithubLogo, MapPin, Globe } from '@phosphor-icons/react'
import type { CVInstance, Template, TemplateSettings, TemplateConfig, Asset } from '../../../shared/types'
import { assetApi } from '../services/api'

interface CVPreviewProps {
  cv: CVInstance | null
  template: Template | null
  settings: TemplateSettings
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
  const parseMarkdownContent = (content: string) => {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let frontmatter = {}
    let markdownContent = content

    if (frontmatterMatch) {
      // Parse YAML frontmatter (basic parsing)
      const yamlContent = frontmatterMatch[1]
      markdownContent = content.slice(frontmatterMatch[0].length)

      yamlContent.split('\n').forEach(line => {
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
    const sections = []
    const sectionMatches = markdownContent.split(/^##\s+/m).slice(1)

    sectionMatches.forEach(sectionText => {
      const lines = sectionText.split('\n')
      const title = lines[0].trim()
      const content = lines.slice(1).join('\n').trim()

      if (title && content) {
        const sectionType = inferSectionType(title)
        let parsedContent

        if (sectionType === 'experience' || sectionType === 'education' || sectionType === 'projects') {
          // Parse structured entries (job experiences, education, projects)
          parsedContent = parseStructuredEntries(content)
        } else if (sectionType === 'skills') {
          // Parse skills with categories
          parsedContent = parseSkills(content)
        } else {
          // Default parsing - split into paragraphs
          parsedContent = content.split('\n\n').filter(p => p.trim())
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
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" className="text-blue-600 underline">$1</a>')

    // Handle inline code `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code className="bg-gray-100 px-1 rounded text-xs">$1</code>')

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  // Parse structured entries (experience, education, projects)
  const parseStructuredEntries = (content: string) => {
    const entries = []
    const entryBlocks = content.split(/^###\s+/m).slice(1)

    entryBlocks.forEach(block => {
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
  const parseSkills = (content: string) => {
    const skillCategories = []
    const lines = content.split('\n').filter(line => line.trim())

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
  const inferSectionType = (title: string) => {
    const lower = title.toLowerCase()
    if (lower.includes('experience') || lower.includes('work')) return 'experience'
    if (lower.includes('education')) return 'education'
    if (lower.includes('skill')) return 'skills'
    if (lower.includes('project')) return 'projects'
    return 'paragraph'
  }

  // Parse CV content for preview - prioritize live content for real-time updates
  const parsedContent = useMemo(() => {
    // If we have live content from editor, parse it for real-time preview
    if (liveContent) {
      try {
        return parseMarkdownContent(liveContent)
      } catch (error) {
        console.error('Failed to parse live content:', error)
        // Fall back to saved parsed content if live parsing fails
        return cv?.parsed_content || null
      }
    }

    // Fall back to saved parsed content from server
    if (cv?.parsed_content) {
      try {
        return cv.parsed_content
      } catch (error) {
        console.error('Failed to parse saved content:', error)
        return null
      }
    }

    return null
  }, [liveContent, cv?.parsed_content])

  // Apply template-based styling
  const getTemplateStyles = () => {
    if (!template) return {}

    // Prefer config over settings (config is newer, more comprehensive)
    const activeConfig = config || template.default_config

    // Calculate font sizes based on baseFontSize and fontScale
    const calculateFontSize = (scale: number, baseFontSize: string): string => {
      const baseValue = parseFloat(baseFontSize)
      const unit = baseFontSize.replace(/[0-9.]/g, '')
      return `${(baseValue * scale).toFixed(1)}${unit}`
    }

    const baseFontSize = activeConfig?.typography.baseFontSize || '10pt'
    const fontScale = activeConfig?.typography.fontScale || {
      h1: 3.2,
      h2: 2.4,
      h3: 2.0,
      body: 1.6,
      small: 1.4,
      tiny: 1.2
    }

    // Apply template CSS variables and styles
    const baseStyles = {
      // Colors - prefer config, fallback to settings
      '--primary-color': activeConfig?.colors.primary || settings.primaryColor || '#2563eb',
      '--accent-color': activeConfig?.colors.accent || settings.accentColor || '#059669',
      '--background-color': activeConfig?.colors.background || settings.backgroundColor || '#ffffff',
      '--surface-color': activeConfig?.colors.secondary || settings.surfaceColor || '#ffffff',

      // Typography - use config when available
      '--font-family': activeConfig?.typography.fontFamily.body || settings.fontFamily || 'Inter',
      '--heading-font-family': activeConfig?.typography.fontFamily.heading || 'Inter',

      // Font sizes - calculated from base + scale (prefer new system, fallback to legacy)
      '--base-font-size': baseFontSize,
      '--title-font-size': activeConfig?.typography.fontSize?.h1 || calculateFontSize(fontScale.h1, baseFontSize),
      '--h2-font-size': activeConfig?.typography.fontSize?.h2 || calculateFontSize(fontScale.h2, baseFontSize),
      '--h3-font-size': activeConfig?.typography.fontSize?.h3 || calculateFontSize(fontScale.h3, baseFontSize),
      '--body-font-size': activeConfig?.typography.fontSize?.body || calculateFontSize(fontScale.body, baseFontSize),
      '--small-font-size': activeConfig?.typography.fontSize?.small || calculateFontSize(fontScale.small, baseFontSize),
      '--tiny-font-size': activeConfig?.typography.fontSize?.tiny || calculateFontSize(fontScale.tiny, baseFontSize),

      // Layout - use config when available
      '--page-width': activeConfig?.layout.pageWidth || '210mm',
      '--page-margin-top': activeConfig?.layout.pageMargin.top || settings.pageMargins?.top || '20mm',
      '--page-margin-right': activeConfig?.layout.pageMargin.right || settings.pageMargins?.right || '20mm',
      '--page-margin-bottom': activeConfig?.layout.pageMargin.bottom || settings.pageMargins?.bottom || '20mm',
      '--page-margin-left': activeConfig?.layout.pageMargin.left || settings.pageMargins?.left || '20mm',
      '--section-spacing': activeConfig?.layout.sectionSpacing || '24px',

      // Text color
      '--text-color': activeConfig?.colors.text.primary || '#1f2937'
    } as React.CSSProperties

    return baseStyles
  }

  // Calculate content height and split into pages for PDF mode
  const splitContentIntoPages = (content: any) => {
    if (previewMode !== 'pdf') return [content]

    // A4 dimensions: 210mm × 297mm
    // With margins: 20mm top/bottom, 15mm left/right
    // Content area: 180mm × 257mm
    const pageContentHeight = 257 // mm available for content after margins
    const mmToPx = 3.779528 // precise mm to px conversion at 96 DPI
    const pageHeightPx = pageContentHeight * mmToPx // ~971px

    const pages = []
    const { frontmatter, sections } = content

    // First page includes header
    const headerHeight = 150 // approximate height in px for name/title
    let currentPage = {
      frontmatter,
      sections: [],
      pageNumber: 1,
      isFirstPage: true
    }
    let currentHeight = headerHeight

    sections.forEach((section) => {
      // More accurate section height estimation
      let sectionHeight = 80 // base height for section header

      if (Array.isArray(section.content)) {
        section.content.forEach((item) => {
          if (typeof item === 'string') {
            // Estimate paragraph height based on character count
            const lines = Math.ceil(item.length / 80) // ~80 chars per line
            sectionHeight += lines * 20 + 10 // line height + spacing
          } else if (typeof item === 'object' && item.title) {
            // Job/education entry with title, company, description
            sectionHeight += 120 // fixed height for structured entry
          }
        })
      } else {
        sectionHeight += 60 // simple text section
      }

      // Check if section fits on current page (with keep-together logic)
      if (currentHeight + sectionHeight > pageHeightPx && currentPage.sections.length > 0) {
        // Section doesn't fit, start new page
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

    return pages.length > 0 ? pages : [{ frontmatter, sections, pageNumber: 1, isFirstPage: true }]
  }

  // Render individual PDF page
  const renderPDFPage = (pageData: any, pageIndex: number) => {
    const { frontmatter, sections, pageNumber, isFirstPage } = pageData
    const templateStyles = getTemplateStyles()
    const useMinimalLayout = template?.name.includes('Minimal') || template?.name.includes('Clean')

    // Separate sections for two-column layout
    const sidebarSections = sections.filter(s =>
      ['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title.toLowerCase().includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter(s =>
      !['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title.toLowerCase().includes(type) || s.type === type
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
                    className="font-bold uppercase tracking-wide mb-2"
                    style={{
                      fontSize: templateStyles['--title-font-size'],
                      fontFamily: templateStyles['--heading-font-family'],
                      color: templateStyles['--primary-color'] || '#1f2937'
                    }}
                  >
                    {frontmatter.name || 'Your Name'}
                  </h1>
                  {frontmatter.title && (
                    <p
                      className="font-medium mb-4"
                      style={{
                        fontSize: '1.125rem',
                        color: templateStyles['--accent-color'] || '#6b7280'
                      }}
                    >
                      {frontmatter.title}
                    </p>
                  )}
                  {/* Contact info centered */}
                  <div className="flex justify-center gap-4 text-sm text-gray-600 mb-4">
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
                      color: templateStyles['--primary-color'] || '#1f2937',
                      borderBottom: `1px solid ${templateStyles['--accent-color'] || '#6b7280'}`
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
                        className="font-bold text-center mb-2"
                        style={{
                          fontSize: templateStyles['--title-font-size'],
                          fontFamily: templateStyles['--heading-font-family'],
                          color: '#4a3d2a'
                        }}
                      >
                        {frontmatter.name || 'Your Name'}
                      </h1>
                      {frontmatter.title && (
                        <p
                          className="font-medium text-center mb-4"
                          style={{
                            fontSize: '1rem',
                            color: '#6b5b47'
                          }}
                        >
                          {frontmatter.title}
                        </p>
                      )}
                    </div>

                    {/* Contact details with icons */}
                    <div className="space-y-3">
                      {frontmatter.phone && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <Phone size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
                          <span>{frontmatter.phone}</span>
                        </div>
                      )}
                      {frontmatter.email && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <Envelope size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
                          <span className="break-all">{frontmatter.email}</span>
                        </div>
                      )}
                      {frontmatter.linkedin && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <LinkedinLogo size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
                          <span className="break-all">{frontmatter.linkedin.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                      {frontmatter.github && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <GithubLogo size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
                          <span className="break-all">{frontmatter.github.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                      {frontmatter.website && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <Globe size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
                          <span className="break-all">{frontmatter.website.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                      {frontmatter.location && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: '#4a3d2a' }}>
                          <MapPin size={16} className="flex-shrink-0" style={{ color: '#6b5b47' }} />
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
                        color: '#ffffff',
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
                        fontSize: templateStyles['--title-font-size'],
                        fontFamily: templateStyles['--heading-font-family'],
                        color: '#4a3d2a'
                      }}
                    >
                      {frontmatter.name || 'Your Name'}
                    </h1>
                    {frontmatter.title && (
                      <p
                        className="font-medium mb-4"
                        style={{
                          fontSize: '1.125rem',
                          color: '#6b5b47'
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
                    <h3
                      className="text-base font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                      style={{
                        fontFamily: templateStyles['--heading-font-family'],
                        color: '#ffffff',
                        backgroundColor: templateStyles['--primary-color'] as string || '#a8956b'
                      }}
                    >
                      {section.title}
                    </h3>
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
          className="absolute bottom-4 right-4 text-xs text-gray-500"
          style={{ fontSize: 'var(--tiny-font-size)' }}
        >
          Page {pageNumber}
        </div>
      </div>
    )
  }

  // Helper function to render skills with configurable tag/separator style
  const renderSkills = (skillCategories: any[], isSidebar: boolean = false) => {
    const activeConfig = config || template?.default_config
    const tagStyle = activeConfig?.components?.tags?.style || 'pill'
    const separator = activeConfig?.components?.tags?.separator || '·'
    const templateStyles = getTemplateStyles()

    return skillCategories.map((category, categoryIndex) => (
      <div key={categoryIndex} className="mb-4">
        <h4 className="text-xs font-semibold mb-2" style={{ color: isSidebar ? '#4a3d2a' : templateStyles['--text-color'] as string || '#2d2d2d' }}>
          {category.category}
        </h4>
        {tagStyle === 'pill' ? (
          // Pill style: rounded background tags
          <div className="flex flex-wrap gap-1">
            {category.skills.map((skill: any, skillIndex: number) => {
              const skillText = typeof skill === 'string' ? skill : (skill.name || skill.text || String(skill))
              return (
                <span
                  key={skillIndex}
                  className="inline-block px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: templateStyles['--accent-color'] as string || '#d4a574',
                    color: '#ffffff',
                    borderRadius: activeConfig?.components?.tags?.borderRadius || '4px',
                    fontSize: activeConfig?.components?.tags?.fontSize || '12px',
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
            fontSize: activeConfig?.components?.tags?.fontSize || '14px'
          }}>
            {category.skills.map((skill: any, skillIndex: number) => {
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
  const renderSectionContent = (section: any, isSidebar: boolean = false) => {
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
      return section.content.map((item, itemIndex) => {
        const itemText = typeof item === 'string' ? item : (item.name || item.text || String(item))
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
      section.content.map((item, itemIndex) => (
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
          ) : typeof item === 'object' && item.title ? (
            <div className="mb-3">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: `var(--${isSidebar ? 'small' : 'body'}-font-size)`,
                      color: isSidebar ? '#4a3d2a' : '#2d2d2d'
                    }}
                  >
                    {item.title}
                  </h3>
                  {item.company && (
                    <p
                      style={{
                        fontSize: `var(--${isSidebar ? 'tiny' : 'small'}-font-size)`,
                        color: isSidebar ? '#6b5b47' : '#5d5d5d'
                      }}
                    >
                      {item.company}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  {item.location && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.location}</p>}
                  {item.date && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.date}</p>}
                </div>
              </div>
              {item.description && (
                <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
                  {renderMarkdown(item.description)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
              {renderMarkdown(String(item))}
            </p>
          )}
        </div>
      ))
    ) : (
      <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
        {renderMarkdown(String(section.content))}
      </p>
    )
  }

  // Generate CV layout based on template and preview mode
  const renderCV = () => {
    if (!parsedContent) return null

    const { frontmatter, sections } = parsedContent
    const templateStyles = getTemplateStyles()

    // Apply different layouts based on template
    const useModernLayout = template?.name.includes('Modern') || template?.name.includes('Professional')
    const useMinimalLayout = template?.name.includes('Minimal') || template?.name.includes('Clean')

    // For PDF mode, render paginated layout
    if (previewMode === 'pdf') {
      const pages = splitContentIntoPages(parsedContent)
      return (
        <div className="max-w-5xl mx-auto">
          {pages.map((page, index) => renderPDFPage(page, index))}
        </div>
      )
    }

    // For web mode, use existing layouts
    // Separate sections into sidebar and main content
    const sidebarSections = sections.filter(s =>
      ['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title.toLowerCase().includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter(s =>
      !['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title.toLowerCase().includes(type) || s.type === type
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
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: templateStyles['--heading-font-family'], color: templateStyles['--primary-color'], fontSize: templateStyles['--title-font-size'] }}>
                {frontmatter.name || 'Your Name'}
              </h1>
              {frontmatter.title && (
                <p className="text-lg text-gray-600 mb-4">{frontmatter.title}</p>
              )}
              {/* Contact Info in Minimal Style */}
              <div className="flex justify-center gap-4 text-sm text-gray-600">
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
                  color: templateStyles['--primary-color'],
                  borderBottom: `1px solid ${templateStyles['--accent-color']}`
                }}>
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {/* Render section content similar to main sections */}
                  {Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {typeof item === 'string' ? (
                          <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--body-font-size)' }}>{renderMarkdown(item)}</p>
                        ) : typeof item === 'object' && item.title ? (
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900" style={{ fontSize: 'var(--body-font-size)' }}>{item.title}</h3>
                                {item.company && <p className="text-gray-700" style={{ fontSize: 'var(--small-font-size)' }}>{item.company}</p>}
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                {item.location && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.location}</p>}
                                {item.date && <p style={{ fontSize: 'var(--tiny-font-size)' }}>{item.date}</p>}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-gray-700 text-sm leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
                                {renderMarkdown(item.description)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>{JSON.stringify(item)}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--body-font-size)' }}>{section.content}</p>
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
                    <div className="bg-gray-300 rounded-full flex items-center justify-center overflow-hidden"
                         style={{ width: '200px', height: '200px' }}>
                      <span className="text-gray-600" style={{ fontSize: 'var(--tiny-font-size)' }}>Photo</span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {frontmatter && (
                  <div className="mb-8">
                <div className="space-y-3">
                  {frontmatter.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Phone size={16} className="text-gray-600 flex-shrink-0" />
                      <span>{frontmatter.phone}</span>
                    </div>
                  )}
                  {frontmatter.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Envelope size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="break-all">{frontmatter.email}</span>
                    </div>
                  )}
                  {frontmatter.linkedin && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <LinkedinLogo size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="break-all">{frontmatter.linkedin.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.github && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <GithubLogo size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="break-all">{frontmatter.github.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.website && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Globe size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="break-all">{frontmatter.website.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {frontmatter.location && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <MapPin size={16} className="text-gray-600 flex-shrink-0" />
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
                    color: '#ffffff',
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
                    fontSize: templateStyles['--title-font-size'],
                    fontFamily: templateStyles['--heading-font-family'],
                    color: templateStyles['--primary-color'] || '#1f2937'
                  }}
                >
                  {frontmatter.name || 'Your Name'}
                </h1>
                {frontmatter.title && (
                  <p
                    className="font-medium"
                    style={{
                      fontSize: '1.125rem',
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
                <h3
                  className="text-base font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded"
                  style={{
                    fontFamily: templateStyles['--heading-font-family'],
                    color: '#ffffff',
                    backgroundColor: templateStyles['--primary-color'] as string || '#a8956b'
                  }}
                >
                  {section.title}
                </h3>

                {/* Section Content */}
                <div className="space-y-4">
                  {Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        {typeof item === 'string' ? (
                          <p className="text-gray-700 leading-relaxed">{item}</p>
                        ) : (
                          <div className="mb-6 last:mb-0">
                            {/* Experience/Job Entry Format */}
                            <div className="mb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  {typeof item === 'object' && item.title && (
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                                  )}
                                  {typeof item === 'object' && item.company && (
                                    <p className="text-gray-700 font-semibold text-base">{item.company}</p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  {typeof item === 'object' && item.location && (
                                    <p className="text-gray-600 flex items-center justify-end mb-1" style={{ fontSize: 'var(--tiny-font-size)' }}>
                                      <MapPin size={10} className="mr-1" />
                                      {item.location}
                                    </p>
                                  )}
                                  {typeof item === 'object' && item.date && (
                                    <p className="text-gray-600 italic" style={{ fontSize: 'var(--tiny-font-size)' }}>{item.date}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {typeof item === 'object' && item.description && (
                              <div className="text-gray-700 text-sm leading-relaxed">
                                {/* Parse bullet points from description */}
                                {item.description.split(/[•\-]\s+/).filter(point => point.trim()).map((bulletPoint, bulletIndex) => (
                                  <div key={bulletIndex} className="flex items-start mb-1">
                                    <span className="text-gray-500 mr-2 mt-1">•</span>
                                    <span className="flex-1">{bulletPoint.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
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
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-medium mb-2">No CV Selected</h3>
          <p className="text-sm">Create a new CV or select an existing one to see the preview.</p>
        </div>
      </div>
    )
  }

  // Calculate zoom transform based on zoom level and percentage
  const getZoomTransform = () => {
    const scale = zoomPercentage / 100
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top center'
    }
  }

  return (
    <div className="h-full bg-surface overflow-auto">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
          <div className="text-sm text-gray-600">Updating preview...</div>
        </div>
      )}

      {/* CV Preview Content */}
      <div className={`p-6 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
        <div
          className="transition-transform duration-200 ease-in-out"
          style={getZoomTransform()}
        >
          {renderCV()}
        </div>
      </div>
    </div>
  )
}
