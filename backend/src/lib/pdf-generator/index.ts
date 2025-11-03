/**
 * PDF Generator Service
 *
 * Generates PDFs using Puppeteer by rendering CV HTML
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer'
import type { CVInstance, Template, TemplateConfig } from '../../../../shared/types'
import { generateCSSVariables, generateGoogleFontsURL } from '../../../../shared/utils/cssVariableGenerator'
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

    // Generate CSS variables from config using shared utility
    const cssVariables = generateCSSVariables(config)

    // Generate Google Fonts URL if custom fonts are configured
    const fontsURL = config.typography.availableFonts
      ? generateGoogleFontsURL(config.typography.availableFonts)
      : '';

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
  ${fontsURL ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsURL}" rel="stylesheet">` : ''}
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
