/**
 * PDF Generator Service
 *
 * Generates PDFs using Puppeteer by rendering CV HTML
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer'
import type { CVInstance, Template, TemplateConfig } from '../../../../shared/types'
import { generateCSSVariables, generateGoogleFontsURL } from '../../../../shared/utils/cssVariableGenerator'
import { renderSections, renderHeader } from '../../../../shared/utils/sectionRenderer'
import path from 'path'
import fs from 'fs/promises'

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
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
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

      // Generate HTML content
      const html = this.generateHTML(cv, template, config)

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
  private generateHTML(cv: CVInstance, template: Template, config: TemplateConfig): string {
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
      : this.generateTwoColumnLayoutHTML(frontmatter, sections)

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
   * Generate two-column layout HTML using shared renderer
   */
  private generateTwoColumnLayoutHTML(frontmatter: any, sections: any[]): string {
    // Split sections into sidebar and main
    const sidebarSections = sections.filter((s: any) =>
      ['skills', 'languages', 'interests', 'tools', 'certifications'].some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    const mainSections = sections.filter((s: any) =>
      !['skills', 'languages', 'interests', 'tools', 'certifications'].some(type =>
        s.title?.toLowerCase().includes(type) || s.type === type
      )
    )

    // Render sections using shared renderer
    const sidebarHTML = renderSections(sidebarSections, { pagination: true })
    const mainHTML = renderSections(mainSections, { pagination: true })

    // Build contact info
    const contactParts: string[] = []
    if (frontmatter.phone) contactParts.push(frontmatter.phone)
    if (frontmatter.email) contactParts.push(frontmatter.email)
    if (frontmatter.location) contactParts.push(frontmatter.location)

    return `
    <div class="cv-page">
      <div class="two-column-layout">
        <div class="sidebar">
          ${frontmatter.photo ? `<img src="${frontmatter.photo}" class="profile-photo" alt="Profile" />` : ''}
          ${contactParts.length > 0 ? `
          <div class="contact-info">
            ${contactParts.map(item => `<div class="contact-item"><span>${item}</span></div>`).join('\n            ')}
          </div>` : ''}
          ${sidebarHTML}
        </div>
        <div class="main-content">
          <h1>${frontmatter.name || 'Your Name'}</h1>
          ${frontmatter.title ? `<p>${frontmatter.title}</p>` : ''}
          ${mainHTML}
        </div>
      </div>
    </div>
    `.trim()
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
      width: var(--page-width);
      min-height: 297mm;
      padding: var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left);
      background-color: var(--background-color);
      page-break-after: always;
    }

    .cv-page:last-child {
      page-break-after: auto;
    }

    @page {
      size: A4;
      margin: 0;
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
    .two-column-layout {
      display: flex;
      min-height: 257mm;
    }

    .sidebar {
      width: 40%;
      background-color: var(--surface-color);
      padding: 0.5cm;
    }

    .main-content {
      flex: 1;
      background-color: var(--background-color);
      padding: 0.5cm;
    }

    .section {
      margin-bottom: var(--section-spacing);
    }

    .section-header {
      font-size: var(--h3-font-size);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      color: #ffffff;
    }

    .sidebar .section-header {
      background-color: var(--accent-color);
    }

    .main-content .section-header {
      background-color: var(--primary-color);
    }

    .profile-photo {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      margin: 0 auto 20px;
      object-fit: cover;
    }

    .contact-info {
      margin-bottom: 24px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: var(--small-font-size);
    }
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

    .section-header {
      font-size: var(--h2-font-size);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--accent-color);
      color: var(--primary-color);
    }
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
