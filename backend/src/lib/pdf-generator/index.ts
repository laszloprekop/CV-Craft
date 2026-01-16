/**
 * PDF Generator Service
 *
 * Generates PDFs using Puppeteer by rendering CV HTML
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer'
import type { CVInstance, Template, TemplateConfig } from '../../../../shared/types'
import { generateCSSVariables, generateGoogleFontsURL } from '../../../../shared/utils/cssVariableGenerator'
import { renderSections, renderHeader } from '../../../../shared/utils/sectionRenderer'
import { getSemanticCSS, getTwoColumnHeaderCSS } from '../../../../shared/utils/semanticCSS'
import path from 'path'
import fs from 'fs/promises'

// SVG Icons for contact information (from Phosphor Icons)
const ICONS = {
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"></path></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"></path></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,176a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0ZM88,96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm96,80a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140Z"></path></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68Z"></path></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16.11,16.11,0,0,0-16,7.86h-8.72l-3.8-7.86a15.91,15.91,0,0,0-11-8.67l-8-1.73L96.14,104h16.71a16.06,16.06,0,0,0,7.73-2l12.25-6.76a16.62,16.62,0,0,0,3-2.14l26.91-24.34A15.93,15.93,0,0,0,166,60.4L160.48,40.5A87.93,87.93,0,0,1,216,128ZM40,128a87.53,87.53,0,0,1,8.54-37.8l11.34,30.27a16,16,0,0,0,11.62,10l21.43,4.61L96.74,143a16.09,16.09,0,0,0,14.4,9h1.48l-7.23,16.23a16,16,0,0,0,2.86,17.37l.14.14L128,205.94l-1.94,10A88.11,88.11,0,0,1,40,128Z"></path></svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"></path></svg>`
}

export interface PDFGenerationOptions {
  cv: CVInstance
  template: Template
  config: TemplateConfig
  outputPath: string
}

export interface PDFGenerationResult {
  filename: string
  filepath: string
  size: number
  pages: number
}

/**
 * PDF Generator class using Puppeteer
 */
export class PDFGenerator {
  private browser: Browser | null = null

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      // Try system Chrome first (more reliable on macOS), fallback to bundled
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ]

      let executablePath: string | undefined
      for (const p of possiblePaths) {
        try {
          const fs = await import('fs')
          if (fs.existsSync(p)) {
            executablePath = p
            break
          }
        } catch {
          // Continue to next path
        }
      }

      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      })
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Load photo from asset storage as base64 data URI
   */
  private async loadPhotoAsDataUri(assetId: string): Promise<string | null> {
    try {
      const storageBasePath = path.resolve('./storage/assets')

      // Try common image extensions
      const extensions = ['.jpg', '.jpeg', '.png', '.webp']
      let filePath: string | null = null
      let foundExtension: string = ''

      for (const ext of extensions) {
        const testPath = path.join(storageBasePath, `${assetId}${ext}`)
        try {
          await fs.access(testPath)
          filePath = testPath
          foundExtension = ext
          break
        } catch {
          // File doesn't exist with this extension, try next
        }
      }

      if (!filePath) {
        console.warn(`[PDF] Photo asset not found: ${assetId}`)
        return null
      }

      // Read file and convert to base64
      const fileBuffer = await fs.readFile(filePath)
      const base64 = fileBuffer.toString('base64')

      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      }
      const mimeType = mimeTypes[foundExtension] || 'image/jpeg'

      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error(`[PDF] Failed to load photo asset ${assetId}:`, error)
      return null
    }
  }

  /**
   * Generate PDF from CV data
   */
  async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
    const { cv, template, config, outputPath } = options

    // Ensure browser is initialized
    await this.initialize()

    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    const page = await this.browser.newPage()
    let pageClosed = false

    try {
      // Set viewport to A4 dimensions
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI (210mm)
        height: 1123, // A4 height in pixels at 96 DPI (297mm)
        deviceScaleFactor: 2 // Higher resolution for better quality
      })

      // Load photo as data URI if available
      let photoDataUri: string | null = null
      if (cv.photo_asset_id) {
        photoDataUri = await this.loadPhotoAsDataUri(cv.photo_asset_id)
      }

      // Generate HTML content
      const html = this.generateHTML(cv, template, config, photoDataUri)

      // Set content and wait for it to load
      try {
        await page.setContent(html, {
          waitUntil: ['domcontentloaded', 'networkidle0'],
          timeout: 30000 // 30 second timeout
        })
      } catch (error) {
        console.error('Failed to set page content:', error);
        throw new Error(`Failed to load HTML content: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Wait a bit for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Generate PDF with A4 settings
      const pdfOptions: PDFOptions = {
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        preferCSSPageSize: true
      }

      await page.pdf(pdfOptions)

      // Get file stats
      const stats = await fs.stat(outputPath)
      const filename = path.basename(outputPath)

      // Count pages (approximate from file size)
      // This is rough - Puppeteer doesn't give us page count directly
      const estimatedPages = Math.max(1, Math.ceil(stats.size / 50000))

      return {
        filename,
        filepath: outputPath,
        size: stats.size,
        pages: estimatedPages
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      // Only close page if it's not already closed
      try {
        if (!pageClosed) {
          await page.close()
          pageClosed = true
        }
      } catch (closeError) {
        // Ignore errors when closing - page might already be closed
        console.warn('Error closing page (likely already closed):', closeError instanceof Error ? closeError.message : 'Unknown error');
      }
    }
  }

  /**
   * Generate HTML content for PDF rendering
   * Uses shared section renderer for consistent web/PDF rendering
   */
  private generateHTML(cv: CVInstance, template: Template, config: TemplateConfig, photoDataUri: string | null = null): string {
    const parsedContent = cv.parsed_content
    if (!parsedContent) {
      throw new Error('CV content not parsed')
    }

    // Use shared renderer for consistent HTML structure
    const { frontmatter, sections } = parsedContent

    // Generate HTML using shared renderer with pagination classes
    const headerHTML = renderHeader(frontmatter)
    const contentHTML = renderSections(sections, { pagination: true })

    // Generate CSS variables from config using shared utility
    const cssVariables = generateCSSVariables(config)

    // Generate Google Fonts URL if custom fonts are configured
    const fontsURL = config.typography.availableFonts
      ? generateGoogleFontsURL(config.typography.availableFonts)
      : '';

    // Determine template layout type
    const useMinimalLayout = template.name.includes('Minimal') || template.name.includes('Clean')

    // Wrap shared HTML in layout container
    const bodyHTML = useMinimalLayout
      ? `<div class="cv-page single-column-layout">${headerHTML}\n${contentHTML}</div>`
      : this.generateTwoColumnLayoutHTML(frontmatter, sections, config, photoDataUri)

    // Generate HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.name || 'CV'}</title>
  ${fontsURL ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsURL}" rel="stylesheet">` : ''}
  <style>
    ${this.generateCSS(cssVariables, useMinimalLayout)}
  </style>
</head>
<body>
  ${bodyHTML}
</body>
</html>
    `
  }

  /**
   * Generate two-column layout HTML matching the web preview
   */
  private generateTwoColumnLayoutHTML(frontmatter: any, sections: any[], config: TemplateConfig, photoDataUri: string | null = null): string {
    // Split sections into sidebar and main
    const sidebarSectionTypes = ['skills', 'languages', 'interests', 'tools', 'certifications']
    const sidebarSections = sections.filter((s: any) =>
      sidebarSectionTypes.some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter((s: any) =>
      !sidebarSectionTypes.some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    // Render main sections using shared renderer
    const mainHTML = renderSections(mainSections, { pagination: true })

    // Render sidebar sections with custom skill handling
    const sidebarHTML = sidebarSections.map(section => {
      const isSkillsSection = section.type === 'skills' ||
        section.title?.toLowerCase().includes('skill') ||
        section.title?.toLowerCase().includes('programming')

      if (isSkillsSection) {
        return this.renderSkillsSection(section, config)
      }
      return renderSections([section], { pagination: true })
    }).join('\n')

    // Build contact info with icons
    const contactItems: string[] = []
    if (frontmatter.phone) {
      contactItems.push(`<div class="contact-item">${ICONS.phone}<span>${frontmatter.phone}</span></div>`)
    }
    if (frontmatter.email) {
      contactItems.push(`<div class="contact-item">${ICONS.email}<span class="break-all">${frontmatter.email}</span></div>`)
    }
    if (frontmatter.linkedin) {
      const linkedinDisplay = frontmatter.linkedin.replace(/^https?:\/\//, '')
      contactItems.push(`<div class="contact-item">${ICONS.linkedin}<span class="break-all">${linkedinDisplay}</span></div>`)
    }
    if (frontmatter.github) {
      const githubDisplay = frontmatter.github.replace(/^https?:\/\//, '')
      contactItems.push(`<div class="contact-item">${ICONS.github}<span class="break-all">${githubDisplay}</span></div>`)
    }
    if (frontmatter.website) {
      const websiteDisplay = frontmatter.website.replace(/^https?:\/\//, '')
      contactItems.push(`<div class="contact-item">${ICONS.globe}<span class="break-all">${websiteDisplay}</span></div>`)
    }
    if (frontmatter.location) {
      contactItems.push(`<div class="contact-item">${ICONS.location}<span>${frontmatter.location}</span></div>`)
    }

    // Handle photo - use data URI from asset, or fall back to frontmatter.photo URL
    const photoSrc = photoDataUri || frontmatter.photo
    const photoHTML = photoSrc
      ? `<div class="photo-container"><img src="${photoSrc}" class="profile-photo" alt="Profile" /></div>`
      : `<div class="photo-container"><div class="profile-photo-placeholder">Photo</div></div>`

    return `
    <!-- Fixed sidebar background - appears on every page -->
    <div class="sidebar-background"></div>
    <div class="cv-page">
      <div class="two-column-layout">
        <div class="sidebar">
          ${photoHTML}
          ${contactItems.length > 0 ? `
          <div class="contact-info">
            ${contactItems.join('\n            ')}
          </div>` : ''}
          ${sidebarHTML}
        </div>
        <div class="main-content">
          <h1>${frontmatter.name || 'Your Name'}</h1>
          ${frontmatter.title ? `<p class="job-title">${frontmatter.title}</p>` : ''}
          ${mainHTML}
        </div>
      </div>
    </div>
    `.trim()
  }

  /**
   * Render skills section with pill-style tags
   */
  private renderSkillsSection(section: any, config: TemplateConfig): string {
    const tagStyle = config?.components?.tags?.style || 'pill'
    const separator = config?.components?.tags?.separator || '·'

    let skillsHTML = ''

    if (Array.isArray(section.content)) {
      section.content.forEach((item: any) => {
        if (typeof item === 'object' && item.category) {
          // Skill category with skills array
          const categoryName = item.category
          const skills = item.skills || []

          if (tagStyle === 'pill') {
            // Pill style: rounded background tags
            const skillTags = skills.map((skill: any) => {
              const skillText = typeof skill === 'string' ? skill : (skill.name || skill.text || String(skill))
              return `<span class="skill-tag">${skillText}</span>`
            }).join('')

            skillsHTML += `
            <div class="skill-category-block">
              <h4 class="skill-category-title">${categoryName}</h4>
              <div class="skill-tags">${skillTags}</div>
            </div>`
          } else {
            // Inline style: separated text
            const skillList = skills.map((skill: any) => {
              return typeof skill === 'string' ? skill : (skill.name || skill.text || String(skill))
            }).join(separator === 'none' ? ' ' : ` ${separator} `)

            skillsHTML += `
            <div class="skill-category-block">
              <h4 class="skill-category-title">${categoryName}</h4>
              <div class="skill-inline">${skillList}</div>
            </div>`
          }
        } else if (typeof item === 'string') {
          // Plain text skill
          skillsHTML += `<p class="skill-item">${item}</p>`
        }
      })
    }

    return `
    <section class="cv-section sidebar-section" data-type="skills">
      <h2 class="section-header">${section.title}</h2>
      <div class="section-content">
        ${skillsHTML}
      </div>
    </section>`
  }

  /**
   * Generate HTML using Unified/Rehype parser output
   * This ensures 100% parity between web preview and PDF export
   */
  private generateHTMLFromParser(parsedContent: any, config: TemplateConfig): string {
    const { frontmatter, html, cssVariables } = parsedContent

    // Use parser-generated CSS variables or generate from config
    const finalCSSVariables = cssVariables || generateCSSVariables(config)

    // Skip Google Fonts for PDF to avoid network issues
    // Fonts will fall back to system fonts
    const fontsURL = '';  // Disabled for PDF generation

    // Convert CSS variables object to CSS string
    const cssVars = Object.entries(finalCSSVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter?.name || 'CV'}</title>
  <!-- Google Fonts disabled for PDF - using system fonts -->
  <style>
    /* Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* CSS Variables from Template Config */
    :root {
      ${cssVars}
    }

    /* Base Styles */
    body {
      font-family: var(--font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--body-font-size);
      line-height: var(--body-line-height);
      font-weight: var(--body-weight);
      color: var(--text-color);
      background-color: var(--background-color);
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Page Layout */
    .cv-page {
      width: var(--page-width);
      min-height: 297mm;
      padding: var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left);
      background-color: var(--background-color);
    }

    @page {
      size: A4;
      margin: 0;
    }

    /* Typography - All styles applied by parser in HTML */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font-family);
      line-height: var(--heading-line-height);
      font-weight: var(--heading-weight);
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: var(--name-font-size);
      font-weight: var(--name-font-weight);
      color: var(--name-color);
      letter-spacing: var(--name-letter-spacing);
      text-transform: var(--name-text-transform);
      margin-bottom: var(--name-margin-bottom);
    }

    h2 {
      font-size: var(--section-header-font-size);
      font-weight: var(--section-header-font-weight);
      color: var(--section-header-color);
      letter-spacing: var(--section-header-letter-spacing);
      text-transform: var(--section-header-text-transform);
      margin-top: var(--section-spacing);
      margin-bottom: var(--section-header-margin-bottom);
      padding-bottom: var(--section-header-padding-bottom);
      border-bottom: var(--section-header-border-width) var(--section-header-border-style) var(--section-header-border-color);
    }

    h3 {
      font-size: var(--h3-font-size);
      font-weight: var(--h3-font-weight);
      color: var(--h3-color);
      margin-bottom: var(--h3-margin-bottom);
    }

    /* Paragraphs */
    p {
      font-size: var(--body-font-size);
      line-height: var(--body-line-height);
      font-weight: var(--body-weight);
      color: var(--text-color);
      margin-bottom: var(--paragraph-spacing);
    }

    /* Text Formatting */
    strong, b {
      font-weight: var(--bold-weight);
      color: var(--emphasis-color);
    }

    em, i {
      font-style: italic;
      color: var(--emphasis-color);
    }

    /* Links */
    a {
      color: var(--link-color);
      text-decoration: var(--link-text-decoration);
      font-weight: var(--link-font-weight);
    }

    a:hover {
      color: var(--link-hover-color);
    }

    /* Lists */
    ul, ol {
      margin-left: var(--bullet-level1-indent);
      margin-bottom: var(--paragraph-spacing);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    ul {
      list-style-type: var(--bullet-level1-style);
      color: var(--bullet-level1-color);
    }

    ul ul {
      margin-left: var(--bullet-level2-indent);
      list-style-type: var(--bullet-level2-style);
      color: var(--bullet-level2-color);
    }

    ul ul ul {
      margin-left: var(--bullet-level3-indent);
      list-style-type: var(--bullet-level3-style);
      color: var(--bullet-level3-color);
    }

    li {
      margin-bottom: 0.25em;
      color: var(--text-color);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Code */
    code {
      font-family: var(--code-font-family);
      font-size: var(--inline-code-font-size);
      background-color: var(--muted-color);
      padding: var(--inline-code-padding);
      border-radius: var(--inline-code-border-radius);
      font-weight: var(--inline-code-font-weight);
      color: var(--text-color);
    }

    pre {
      background-color: var(--muted-color);
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: var(--paragraph-spacing);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: var(--blockquote-border-width) solid var(--blockquote-border-color);
      padding-left: var(--blockquote-padding-left);
      margin-left: 0;
      margin-bottom: var(--paragraph-spacing);
      color: var(--text-secondary);
      font-style: italic;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: var(--section-spacing) 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: var(--paragraph-spacing);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      padding: 8px;
      border: 1px solid var(--border-color);
      text-align: left;
    }

    th {
      background-color: var(--surface-color);
      font-weight: var(--bold-weight);
    }

    /* Keep sections together */
    section {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Print optimizations */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="cv-page">
    ${html}
  </div>
</body>
</html>
    `
  }

  /**
   * Generate CSS styles
   */
  private generateCSS(variables: Record<string, string>, useMinimalLayout: boolean): string {
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')

    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      ${cssVars}
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
    }

    body {
      font-family: var(--font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--body-font-size);
      color: var(--text-color);
      background-color: var(--background-color);
      line-height: 1.6;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .cv-page {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--background-color);
    }

    /* Single column layout uses page margins */
    .cv-page.single-column-layout {
      padding: var(--page-margin-top, 20mm) var(--page-margin-right, 15mm) var(--page-margin-bottom, 20mm) var(--page-margin-left, 15mm);
    }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
      }
    }

    .keep-together {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    h1, h2, h3 {
      font-family: var(--heading-font-family);
      line-height: 1.2;
    }

    h1 {
      font-size: var(--title-font-size);
      color: var(--primary-color);
    }

    h2 {
      font-size: var(--h2-font-size);
    }

    h3 {
      font-size: var(--h3-font-size);
    }

    ${useMinimalLayout ? this.getMinimalCSS() : this.getTwoColumnCSS()}
    `
  }

  /**
   * Generate two-column layout CSS
   */
  private getTwoColumnCSS(): string {
    return `
    /* Two-column layout with fixed sidebar background for multi-page PDFs */

    /* Fixed background layer for sidebar - appears on every page */
    .sidebar-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 84mm; /* 40% of 210mm */
      height: 100vh;
      background-color: var(--surface-color);
      z-index: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .cv-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      padding: 0 !important;
      margin: 0;
    }

    .two-column-layout {
      display: flex;
      width: 210mm;
      min-height: 297mm;
    }

    .sidebar {
      width: 84mm; /* 40% of 210mm */
      padding: 20mm 6mm;
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }

    .main-content {
      width: 126mm; /* 60% of 210mm */
      background-color: var(--background-color);
      padding: 20mm 8mm;
      position: relative;
      z-index: 1;
    }

    .section {
      margin-bottom: var(--section-spacing);
    }

    /* Section headers with background colors */
    .sidebar .cv-section > h2.section-header,
    .sidebar .sidebar-section > h2.section-header {
      font-size: var(--h3-font-size);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      border-bottom: none;
      color: var(--on-tertiary-color, #ffffff);
      background-color: var(--accent-color);
    }

    .main-content .cv-section > h2.section-header {
      font-size: var(--h3-font-size);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      border-bottom: none;
      color: var(--on-primary-color, #ffffff);
      background-color: var(--primary-color);
    }

    /* Photo styling */
    .photo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .profile-photo {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .profile-photo-placeholder {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background-color: var(--muted-color, #e5e5e5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--tiny-font-size);
      color: var(--on-muted-color, #888);
    }

    /* Contact info styling */
    .contact-info {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: var(--contact-spacing, 12px);
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--contact-font-size, var(--small-font-size));
      color: var(--on-secondary-color);
    }

    .contact-item svg {
      flex-shrink: 0;
      color: var(--contact-icon-color, var(--on-secondary-color));
    }

    .break-all {
      word-break: break-all;
    }

    /* Name and title in main content */
    .main-content > h1 {
      font-family: var(--heading-font-family);
      font-size: var(--name-font-size);
      font-weight: var(--name-font-weight);
      color: var(--name-color);
      letter-spacing: var(--name-letter-spacing);
      text-transform: var(--name-text-transform);
      margin-bottom: var(--name-margin-bottom);
    }

    .main-content > p.job-title {
      font-size: var(--h3-font-size);
      color: var(--accent-color);
      margin-bottom: 1.5rem;
    }

    /* Skill tags (pill style) */
    .skill-category-block {
      margin-bottom: 1rem;
    }

    .skill-category-title {
      font-family: var(--heading-font-family);
      font-size: var(--small-font-size);
      font-weight: 600;
      color: var(--on-secondary-color, #4a3d2a);
      margin-bottom: 0.5rem;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .skill-tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: var(--tag-font-size, 0.75rem);
      font-weight: var(--tag-font-weight, 500);
      background-color: var(--tag-bg-color, #d4c4b0);
      color: var(--tag-text-color, #4a3d2a);
      border-radius: var(--tag-border-radius, 4px);
    }

    .skill-inline {
      font-size: var(--small-font-size);
      color: var(--on-secondary-color, #4a3d2a);
    }

    /* Sidebar section styling */
    .sidebar-section {
      margin-bottom: 1.5rem;
    }

    ${getTwoColumnHeaderCSS()}
    ${getSemanticCSS()}
    `
  }

  /**
   * Generate minimal layout CSS
   */
  private getMinimalCSS(): string {
    return `
    .single-column-layout {
      max-width: var(--page-width);
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--accent-color);
    }

    .section {
      margin-bottom: var(--section-spacing);
    }

    ${getSemanticCSS()}
    `
  }

  /**
   * Generate body HTML
   */
  private generateBody(parsedContent: any, useMinimalLayout: boolean): string {
    if (useMinimalLayout) {
      return this.generateMinimalLayout(parsedContent)
    }
    return this.generateTwoColumnLayout(parsedContent)
  }

  /**
   * Generate minimal single-column layout
   */
  private generateMinimalLayout(parsedContent: any): string {
    const { frontmatter, sections } = parsedContent

    return `
    <div class="cv-page">
      <div class="single-column-layout">
        <header class="header">
          <h1>${frontmatter.name || 'Your Name'}</h1>
          ${frontmatter.title ? `<p>${frontmatter.title}</p>` : ''}
          <div class="contact-info">
            ${frontmatter.email ? `<span>${frontmatter.email}</span>` : ''}
            ${frontmatter.phone ? `<span>${frontmatter.phone}</span>` : ''}
            ${frontmatter.location ? `<span>${frontmatter.location}</span>` : ''}
          </div>
        </header>

        ${sections.map((section: any) => this.renderSection(section)).join('\n')}
      </div>
    </div>
    `
  }

  /**
   * Generate two-column layout
   */
  private generateTwoColumnLayout(parsedContent: any): string {
    const { frontmatter, sections } = parsedContent

    const sidebarSections = sections.filter((s: any) =>
      ['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter((s: any) =>
      !['skills', 'languages', 'interests', 'tools'].some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    return `
    <div class="cv-page">
      <div class="two-column-layout">
        <div class="sidebar">
          ${frontmatter.photo ? `<img src="${frontmatter.photo}" class="profile-photo" alt="Profile" />` : ''}

          <div class="contact-info">
            ${frontmatter.phone ? `<div class="contact-item"><span>${frontmatter.phone}</span></div>` : ''}
            ${frontmatter.email ? `<div class="contact-item"><span>${frontmatter.email}</span></div>` : ''}
            ${frontmatter.location ? `<div class="contact-item"><span>${frontmatter.location}</span></div>` : ''}
          </div>

          ${sidebarSections.map((section: any) => this.renderSection(section, true)).join('\n')}
        </div>

        <div class="main-content">
          <h1>${frontmatter.name || 'Your Name'}</h1>
          ${frontmatter.title ? `<p>${frontmatter.title}</p>` : ''}

          ${mainSections.map((section: any) => this.renderSection(section, false)).join('\n')}
        </div>
      </div>
    </div>
    `
  }

  /**
   * Render a section
   */
  private renderSection(section: any, isSidebar: boolean = false): string {
    return `
    <section class="section keep-together">
      <h3 class="section-header">${section.title}</h3>
      <div class="section-content">
        ${this.renderSectionContent(section, isSidebar)}
      </div>
    </section>
    `
  }

  /**
   * Render section content
   */
  private renderSectionContent(section: any, isSidebar: boolean): string {
    if (!Array.isArray(section.content)) {
      return `<p>${section.content}</p>`
    }

    return section.content
      .map((item: any) => {
        if (typeof item === 'string') {
          return `<p>${item}</p>`
        }

        if (typeof item === 'object' && item.title) {
          return `
          <div class="entry">
            <h4>${item.title}</h4>
            ${item.company ? `<p>${item.company}</p>` : ''}
            ${item.date ? `<p><em>${item.date}</em></p>` : ''}
            ${item.description ? `<p>${item.description}</p>` : ''}
            ${item.bullets && item.bullets.length > 0 ? `
              <ul>
                ${item.bullets.map((bullet: any) =>
                  `<li>${typeof bullet === 'string' ? bullet : bullet.text || ''}</li>`
                ).join('')}
              </ul>
            ` : ''}
          </div>
          `
        }

        return ''
      })
      .join('\n')
  }
}

/**
 * Singleton instance
 */
let pdfGenerator: PDFGenerator | null = null

/**
 * Get or create PDF generator instance
 */
export function getPDFGenerator(): PDFGenerator {
  if (!pdfGenerator) {
    pdfGenerator = new PDFGenerator()
  }
  return pdfGenerator
}

/**
 * Close PDF generator and cleanup resources
 */
export async function closePDFGenerator(): Promise<void> {
  if (pdfGenerator) {
    await pdfGenerator.close()
    pdfGenerator = null
  }
}
