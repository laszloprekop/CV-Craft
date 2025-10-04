/**
 * PDF Generator Service
 *
 * Generates PDFs using Puppeteer by rendering CV HTML
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer'
import type { CVInstance, Template, TemplateConfig } from '../../../../shared/types'
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
      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0']
      })

      // Wait a bit for fonts and images to load
      await page.waitForTimeout(500)

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
    } finally {
      await page.close()
    }
  }

  /**
   * Generate HTML content for PDF rendering
   * This should match the frontend CVPreview component's output
   */
  private generateHTML(cv: CVInstance, template: Template, config: TemplateConfig): string {
    const parsedContent = cv.parsed_content
    if (!parsedContent) {
      throw new Error('CV content not parsed')
    }

    const { frontmatter, sections } = parsedContent

    // Generate CSS variables from config
    const cssVariables = this.generateCSSVariables(config)

    // Determine template layout type
    const useMinimalLayout = template.name.includes('Minimal') || template.name.includes('Clean')

    // Generate HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.name || 'CV'}</title>
  <style>
    ${this.generateCSS(cssVariables, useMinimalLayout)}
  </style>
</head>
<body>
  ${this.generateBody(parsedContent, useMinimalLayout)}
</body>
</html>
    `
  }

  /**
   * Generate CSS variables from template config
   */
  private generateCSSVariables(config: TemplateConfig): Record<string, string> {
    const calculateFontSize = (scale: number, baseFontSize: string): string => {
      const baseValue = parseFloat(baseFontSize)
      const unit = baseFontSize.replace(/[0-9.]/g, '')
      return `${(baseValue * scale).toFixed(1)}${unit}`
    }

    const baseFontSize = config.typography.baseFontSize || '10pt'
    const fontScale = config.typography.fontScale || {
      h1: 3.2,
      h2: 2.4,
      h3: 2.0,
      body: 1.6,
      small: 1.4,
      tiny: 1.2
    }

    return {
      // Main Color Pairs
      '--primary-color': config.colors.primary,
      '--on-primary-color': config.colors.onPrimary,
      '--secondary-color': config.colors.secondary,
      '--on-secondary-color': config.colors.onSecondary,
      '--tertiary-color': config.colors.tertiary || config.colors.accent || '#f59e0b',
      '--on-tertiary-color': config.colors.onTertiary || '#ffffff',
      '--muted-color': config.colors.muted || '#f1f5f9',
      '--on-muted-color': config.colors.onMuted || '#334155',
      '--background-color': config.colors.background,
      '--on-background-color': config.colors.text.primary,

      // Legacy color variables for backward compatibility
      '--accent-color': config.colors.tertiary || config.colors.accent || '#f59e0b',
      '--surface-color': config.colors.secondary,
      '--text-color': config.colors.text.primary,
      '--text-secondary': config.colors.text.secondary,
      '--text-muted': config.colors.text.muted,
      '--border-color': config.colors.borders,
      '--link-color': config.colors.links.default,
      '--link-hover-color': config.colors.links.hover,

      // Typography
      '--font-family': config.typography.fontFamily.body,
      '--heading-font-family': config.typography.fontFamily.heading,
      '--base-font-size': baseFontSize,
      '--title-font-size': calculateFontSize(fontScale.h1, baseFontSize),
      '--h2-font-size': calculateFontSize(fontScale.h2, baseFontSize),
      '--h3-font-size': calculateFontSize(fontScale.h3, baseFontSize),
      '--body-font-size': calculateFontSize(fontScale.body, baseFontSize),
      '--small-font-size': calculateFontSize(fontScale.small, baseFontSize),
      '--tiny-font-size': calculateFontSize(fontScale.tiny, baseFontSize),

      // Layout
      '--page-width': config.layout.pageWidth,
      '--page-margin-top': config.layout.pageMargin.top,
      '--page-margin-right': config.layout.pageMargin.right,
      '--page-margin-bottom': config.layout.pageMargin.bottom,
      '--page-margin-left': config.layout.pageMargin.left,
      '--section-spacing': config.layout.sectionSpacing,
      '--paragraph-spacing': config.layout.paragraphSpacing,

      // Component-specific styles
      // Name (H1)
      '--name-font-size': config.components.name?.fontSize || calculateFontSize(fontScale.h1, baseFontSize),
      '--name-font-weight': String(config.components.name?.fontWeight || 700),
      '--name-color': config.components.name?.color || config.colors.primary || '#0f172a',
      '--name-letter-spacing': config.components.name?.letterSpacing || '-0.02em',
      '--name-text-transform': config.components.name?.textTransform || 'uppercase',
      '--name-alignment': config.components.name?.alignment || 'left',
      '--name-margin-bottom': config.components.name?.marginBottom || '8px',

      // Contact Info
      '--contact-layout': config.components.contactInfo?.layout || 'inline',
      '--contact-icon-size': config.components.contactInfo?.iconSize || '16px',
      '--contact-icon-color': config.components.contactInfo?.iconColor || config.colors.text.secondary,
      '--contact-spacing': config.components.contactInfo?.spacing || '12px',
      '--contact-font-size': config.components.contactInfo?.fontSize || calculateFontSize(fontScale.small, baseFontSize),

      // Profile Photo
      '--profile-photo-size': config.components.profilePhoto?.size || '200px',
      '--profile-photo-border-radius': config.components.profilePhoto?.borderRadius || '50%',
      '--profile-photo-border': config.components.profilePhoto?.border || '3px solid #e2e8f0',
      '--profile-photo-border-color': config.components.profilePhoto?.borderColor || '#e2e8f0',

      // Section Headers (H2)
      '--section-header-font-size': config.components.sectionHeader?.fontSize || calculateFontSize(fontScale.h2, baseFontSize),
      '--section-header-font-weight': String(config.components.sectionHeader?.fontWeight || 700),
      '--section-header-color': config.components.sectionHeader?.color || config.colors.primary,
      '--section-header-text-transform': config.components.sectionHeader?.textTransform || 'uppercase',
      '--section-header-border-bottom': config.components.sectionHeader?.borderBottom || '2px solid',
      '--section-header-border-color': config.components.sectionHeader?.borderColor || config.colors.primary,
      '--section-header-padding': config.components.sectionHeader?.padding || '0 0 4px 0',
      '--section-header-margin-top': config.components.sectionHeader?.marginTop || '24px',
      '--section-header-margin-bottom': config.components.sectionHeader?.marginBottom || '12px',
      '--section-header-letter-spacing': config.components.sectionHeader?.letterSpacing || '0.05em',

      // Job Titles (H3)
      '--job-title-font-size': config.components.jobTitle?.fontSize || calculateFontSize(fontScale.h3, baseFontSize),
      '--job-title-font-weight': String(config.components.jobTitle?.fontWeight || 600),
      '--job-title-color': config.components.jobTitle?.color || config.colors.text.primary,
      '--job-title-margin-bottom': config.components.jobTitle?.marginBottom || '4px',

      // Organization Names
      '--org-name-font-size': config.components.organizationName?.fontSize || calculateFontSize(fontScale.body, baseFontSize),
      '--org-name-font-weight': String(config.components.organizationName?.fontWeight || 500),
      '--org-name-color': config.components.organizationName?.color || config.colors.text.secondary,
      '--org-name-font-style': config.components.organizationName?.fontStyle || 'normal',

      // Key-Value Pairs
      '--key-value-label-color': config.components.keyValue?.labelColor || config.colors.text.primary,
      '--key-value-label-weight': String(config.components.keyValue?.labelWeight || 600),
      '--key-value-value-color': config.components.keyValue?.valueColor || config.colors.text.secondary,
      '--key-value-value-weight': String(config.components.keyValue?.valueWeight || 400),
      '--key-value-separator': config.components.keyValue?.separator || ':',
      '--key-value-spacing': config.components.keyValue?.spacing || '4px',

      // Emphasis
      '--emphasis-font-weight': String(config.components.emphasis?.fontWeight || 600),
      '--emphasis-color': config.components.emphasis?.color || config.colors.text.primary,

      // Bullet Lists (Multi-level)
      '--bullet-level1-color': config.components.list?.level1?.color || config.colors.primary,
      '--bullet-level2-color': config.components.list?.level2?.color || config.colors.text.secondary,
      '--bullet-level3-color': config.components.list?.level3?.color || config.colors.text.muted,
      '--bullet-level1-indent': config.components.list?.level1?.indent || '20px',
      '--bullet-level2-indent': config.components.list?.level2?.indent || '40px',
      '--bullet-level3-indent': config.components.list?.level3?.indent || '60px'
    }
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
