/**
 * CV Preview Component
 *
 * Renders the live preview of the CV with template styling matching design proposal
 */

import React, { useMemo } from 'react'
import { Phone, Envelope, LinkedinLogo, GithubLogo, MapPin, Globe } from '@phosphor-icons/react'
import type { CVInstance, Template, TemplateSettings, TemplateConfig } from '../../../shared/types'

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
          frontmatter[key.trim()] = value
        }
      })
    } else {
      // Extract from plain markdown (first H1 as name, email from content)
      const h1Match = markdownContent.match(/^#\s+(.+)$/m)
      const emailMatch = markdownContent.match(/[\w\.-]+@[\w\.-]+\.\w+/)
      const phoneMatch = markdownContent.match(/(?:📱|phone)[\s\*]*:?\s*([\+\d\s\-\(\)\.]+)/i)
      const locationMatch = markdownContent.match(/(?:📍|location)[\s\*]*:?\s*([^,\n]+)/i)

      frontmatter = {
        name: h1Match ? h1Match[1].trim() : '',
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        location: locationMatch ? locationMatch[1].trim() : ''
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

    // Handle bold (**text**)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Handle italics (*text*)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')

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

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        // Category header like "**Programming Languages:**"
        const category = trimmed.replace(/\*\*/g, '').replace(':', '').trim()
        const nextLineIndex = lines.indexOf(line) + 1
        if (nextLineIndex < lines.length) {
          const skills = lines[nextLineIndex].trim().split(',').map(s => s.trim())
          skillCategories.push({
            category,
            skills
          })
        }
      } else if (trimmed.includes(':')) {
        // Simple format like "Programming: JavaScript, Python"
        const [category, skillsStr] = trimmed.split(':')
        const skills = skillsStr.trim().split(',').map(s => s.trim())
        skillCategories.push({
          category: category.trim(),
          skills
        })
      }
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
      '--title-font-size': activeConfig?.typography.fontSize.h1 || `${settings.titleFontSize || 24}px`,
      '--h2-font-size': activeConfig?.typography.fontSize.h2 || '20px',
      '--h3-font-size': activeConfig?.typography.fontSize.h3 || '18px',
      '--body-font-size': activeConfig?.typography.fontSize.body || `${settings.bodyFontSize || 14}px`,
      '--small-font-size': activeConfig?.typography.fontSize.small || '12px',
      '--tiny-font-size': activeConfig?.typography.fontSize.tiny || '10px',

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
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                           style={{ backgroundColor: '#d4a574' }}>
                        <span className="text-white text-xs font-medium">Photo</span>
                      </div>
                      <h1
                        className="font-bold text-center mb-2"
                        style={{
                          fontSize: templateStyles['--title-font-size'],
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

                    {/* Contact details */}
                    <div className="space-y-2 text-sm">
                      {frontmatter.email && (
                        <div style={{ color: '#4a3d2a' }}>{frontmatter.email}</div>
                      )}
                      {frontmatter.phone && (
                        <div style={{ color: '#4a3d2a' }}>{frontmatter.phone}</div>
                      )}
                      {frontmatter.location && (
                        <div style={{ color: '#4a3d2a' }}>{frontmatter.location}</div>
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

  // Helper function to render section content consistently
  const renderSectionContent = (section: any, isSidebar: boolean = false) => {
    // Special handling for skills in sidebar
    if (isSidebar && section.type === 'skills') {
      const skillCategories = parseSkills(Array.isArray(section.content) ? section.content.join('\n') : section.content)
      return skillCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="mb-4">
          <h4 className="text-xs font-semibold mb-2" style={{ color: '#4a3d2a' }}>
            {category.category}
          </h4>
          <div className="flex flex-wrap gap-1">
            {category.skills.map((skill, skillIndex) => (
              <span
                key={skillIndex}
                className="inline-block px-2 py-1 text-xs rounded"
                style={{
                  backgroundColor: '#d4a574',
                  color: '#ffffff'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))
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
              {JSON.stringify(item)}
            </p>
          )}
        </div>
      ))
    ) : (
      <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
        {section.content}
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
              <h1 className="text-3xl font-bold mb-2" style={{ color: templateStyles['--primary-color'], fontSize: templateStyles['--title-font-size'] }}>
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
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-gray-600" style={{ fontSize: 'var(--tiny-font-size)' }}>Photo</span>
                  </div>
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
                    color: '#ffffff',
                    backgroundColor: templateStyles['--accent-color'] as string || '#c4956c'
                  }}
                >
                  {section.title}
                </h3>

                {/* Section Content */}
                <div className="space-y-3">
                  {section.type === 'skills' && Array.isArray(section.content) ? (
                    // Skills with categories
                    section.content.map((skillGroup, itemIndex) => (
                      <div key={itemIndex} className="mb-4 last:mb-0">
                        {skillGroup.category && (
                          <h4 className="font-semibold text-gray-800 text-sm mb-2 uppercase tracking-wide">
                            {skillGroup.category}
                          </h4>
                        )}
                        <div className="text-gray-600 leading-relaxed" style={{ fontSize: 'var(--small-font-size)' }}>
                          {Array.isArray(skillGroup.skills)
                            ? skillGroup.skills.map((skill, i) => (
                                <span key={i}>
                                  {i > 0 && ' • '}{renderMarkdown(skill)}
                                </span>
                              ))
                            : typeof skillGroup === 'string'
                            ? renderMarkdown(skillGroup)
                            : JSON.stringify(skillGroup)
                          }
                        </div>
                      </div>
                    ))
                  ) : Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="text-sm text-gray-700 leading-relaxed">
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed">{section.content}</div>
                  )}
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
