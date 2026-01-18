/**
 * PDF Generator Service
 *
 * Generates PDFs using Puppeteer with DTP-style linked text frames.
 * Uses PDF overlay technique: renders sidebar and main content as separate PDFs,
 * then merges them with background layer for proper two-column pagination.
 *
 * This module uses shared utilities from shared/utils/ for:
 * - CSS generation (semanticCSS, paginationCSS)
 * - HTML generation (layoutRenderer, contactRenderer, photoRenderer)
 * - CSS variables (cssVariableGenerator)
 */

import puppeteer, { Browser } from "puppeteer"
import { PDFDocument } from "pdf-lib"
import type {
  CVInstance,
  Template,
  TemplateConfig,
} from "../../../../shared/types"
import {
  generateCSSVariables,
  generateGoogleFontsURL,
} from "../../../../shared/utils/cssVariableGenerator"
import {
  renderSections,
  renderHeader,
} from "../../../../shared/utils/sectionRenderer"
import {
  generateColumnHTML,
  generateBackgroundHTML,
  generateCVDocument,
  splitSections,
} from "../../../../shared/utils/layoutRenderer"
import {
  getAllSemanticCSS,
  getSemanticCSS,
  getTwoColumnHeaderCSS,
} from "../../../../shared/utils/semanticCSS"
import { getAllPaginationCSS } from "../../../../shared/utils/paginationCSS"
import path from "path"
import fs from "fs/promises"

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

// Known Google Fonts (not system fonts)
const GOOGLE_FONTS = new Set([
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "IBM Plex Sans",
  "IBM Plex Serif",
  "Source Sans Pro",
  "Source Serif Pro",
  "Crimson Text",
  "Crimson Pro",
  "Playfair Display",
  "Merriweather",
  "Libre Baskerville",
  "EB Garamond",
  "Cormorant Garamond",
  "Spectral",
  "Fira Sans",
  "Nunito",
  "Raleway",
  "Work Sans",
  "DM Sans",
  "Mulish",
  "Cardo",
  "Josefin Sans",
  "Oswald",
  "PT Sans",
  "PT Serif",
  "Quicksand",
  "Rubik",
  "Ubuntu",
  "Cabin",
  "Barlow",
  "Manrope",
  "Space Grotesk",
])

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
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
      ]

      let executablePath: string | undefined
      for (const p of possiblePaths) {
        try {
          const fsSync = await import("fs")
          if (fsSync.existsSync(p)) {
            executablePath = p
            break
          }
        } catch {
          // Continue to next path
        }
      }

      this.browser = await puppeteer.launch({
        headless: "new",
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
        ],
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
      const storageBasePath = path.resolve("./storage/assets")

      // Try common image extensions
      const extensions = [".jpg", ".jpeg", ".png", ".webp"]
      let filePath: string | null = null
      let foundExtension: string = ""

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
      const base64 = fileBuffer.toString("base64")

      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
      }
      const mimeType = mimeTypes[foundExtension] || "image/jpeg"

      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error(`[PDF] Failed to load photo asset ${assetId}:`, error)
      return null
    }
  }

  /**
   * Extract Google Fonts from config
   */
  private getUsedFonts(config: TemplateConfig): string[] {
    const usedFonts: string[] = []

    const extractGoogleFont = (fontStack: string | undefined): string | null => {
      if (!fontStack) return null
      const firstFont = fontStack.split(",")[0]?.trim()?.replace(/['"]/g, "")
      return firstFont && GOOGLE_FONTS.has(firstFont) ? firstFont : null
    }

    const headingFont = extractGoogleFont(config.typography.fontFamily?.heading)
    const bodyFont = extractGoogleFont(config.typography.fontFamily?.body)

    if (headingFont) usedFonts.push(headingFont)
    if (bodyFont && bodyFont !== headingFont) usedFonts.push(bodyFont)

    return usedFonts
  }

  /**
   * Generate PDF using DTP-style overlay technique
   * Renders sidebar and main content as separate PDFs, then merges them
   */
  async generatePDF(
    options: PDFGenerationOptions,
  ): Promise<PDFGenerationResult> {
    const { cv, template, config, outputPath } = options

    // Ensure browser is initialized
    await this.initialize()

    if (!this.browser) {
      throw new Error("Browser not initialized")
    }

    // Determine if using two-column layout
    const useMinimalLayout =
      template.name.includes("Minimal") || template.name.includes("Clean")

    if (useMinimalLayout) {
      // For single-column layouts, use simple rendering
      return this.generateSimplePDF(cv, template, config, outputPath)
    }

    // For two-column layouts, use overlay technique
    return this.generateOverlayPDF(cv, template, config, outputPath)
  }

  /**
   * Generate PDF using overlay technique for two-column layouts
   * 1. Render sidebar content (left column) → PDF with N pages
   * 2. Render main content (right column) → PDF with M pages
   * 3. Create background layer
   * 4. Overlay: merge page-by-page with backgrounds
   */
  private async generateOverlayPDF(
    cv: CVInstance,
    template: Template,
    config: TemplateConfig,
    outputPath: string,
  ): Promise<PDFGenerationResult> {
    const parsedContent = cv.parsed_content
    if (!parsedContent) {
      throw new Error("CV content not parsed")
    }

    const { frontmatter, sections } = parsedContent

    // Load photo as data URI if available
    let photoDataUri: string | null = null
    if (cv.photo_asset_id) {
      photoDataUri = await this.loadPhotoAsDataUri(cv.photo_asset_id)
    }

    // Generate CSS variables
    const cssVariables = generateCSSVariables(config)

    // Get fonts URL
    const usedFonts = this.getUsedFonts(config)
    const fontsURL = usedFonts.length > 0 ? generateGoogleFontsURL(usedFonts) : ""

    // Get colors
    const sidebarColor =
      cssVariables["--surface-color"] || config.colors.secondary || "#f5f0e8"
    const mainColor =
      cssVariables["--background-color"] || config.colors.background || "#ffffff"

    // Get margins
    const marginTop = cssVariables["--page-margin-top"] || "20mm"
    const marginBottom = cssVariables["--page-margin-bottom"] || "20mm"
    const marginLeft = cssVariables["--page-margin-left"] || "6mm"
    const marginRight = cssVariables["--page-margin-right"] || "8mm"

    // Split sections into sidebar and main
    const { sidebarSections, mainSections } = splitSections(sections)

    console.log("[PDF] Generating overlay PDF...")
    console.log(`[PDF] Sidebar sections: ${sidebarSections.length}`)
    console.log(`[PDF] Main sections: ${mainSections.length}`)

    // Generate three separate PDFs using shared renderer
    const [sidebarPdfBytes, mainPdfBytes, bgPdfBytes] = await Promise.all([
      this.renderColumnPDF(
        "sidebar",
        frontmatter,
        sidebarSections,
        config,
        photoDataUri,
        fontsURL,
        marginTop,
        marginBottom,
        marginLeft,
      ),
      this.renderColumnPDF(
        "main",
        frontmatter,
        mainSections,
        config,
        null,
        fontsURL,
        marginTop,
        marginBottom,
        marginRight,
      ),
      this.renderBackgroundPDF(sidebarColor, mainColor),
    ])

    // Load PDFs with pdf-lib
    const sidebarPdf = await PDFDocument.load(sidebarPdfBytes)
    const mainPdf = await PDFDocument.load(mainPdfBytes)
    const bgPdf = await PDFDocument.load(bgPdfBytes)

    const sidebarPages = sidebarPdf.getPageCount()
    const mainPages = mainPdf.getPageCount()
    const totalPages = Math.max(sidebarPages, mainPages)

    console.log(`[PDF] Sidebar pages: ${sidebarPages}`)
    console.log(`[PDF] Main pages: ${mainPages}`)
    console.log(`[PDF] Total pages: ${totalPages}`)

    // Create merged PDF
    const mergedPdf = await PDFDocument.create()

    for (let i = 0; i < totalPages; i++) {
      // Create a new page with A4 dimensions
      const page = mergedPdf.addPage([595.28, 841.89]) // A4 in points

      // Embed and draw background
      const [bgPage] = await mergedPdf.embedPdf(bgPdf, [0])
      page.drawPage(bgPage, { x: 0, y: 0 })

      // Embed and draw sidebar content (if page exists)
      if (i < sidebarPages) {
        const [sidebarPage] = await mergedPdf.embedPdf(sidebarPdf, [i])
        page.drawPage(sidebarPage, { x: 0, y: 0 })
      }

      // Embed and draw main content (if page exists)
      if (i < mainPages) {
        const [mainPage] = await mergedPdf.embedPdf(mainPdf, [i])
        page.drawPage(mainPage, { x: 0, y: 0 })
      }
    }

    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save()
    await fs.writeFile(outputPath, mergedPdfBytes)

    const stats = await fs.stat(outputPath)
    const filename = path.basename(outputPath)

    return {
      filename,
      filepath: outputPath,
      size: stats.size,
      pages: totalPages,
    }
  }

  /**
   * Render a single column (sidebar or main) as a PDF
   * Uses shared generateColumnHTML for HTML generation
   */
  private async renderColumnPDF(
    column: "sidebar" | "main",
    frontmatter: any,
    sections: any[],
    config: TemplateConfig,
    photoDataUri: string | null,
    fontsURL: string,
    marginTop: string,
    marginBottom: string,
    marginHorizontal: string,
  ): Promise<Uint8Array> {
    if (!this.browser) {
      throw new Error("Browser not initialized")
    }

    const page = await this.browser.newPage()

    try {
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      })

      // Generate HTML using shared renderer
      const html = generateColumnHTML({
        column,
        frontmatter,
        sections,
        config,
        photoDataUri,
        fontsURL,
        marginTop,
        marginBottom,
        marginHorizontal,
      })

      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: 30000,
      })

      // Wait for fonts to load
      try {
        await page.waitForFunction(
          `(function() {
            return document.fonts.ready.then(function() {
              return document.fonts.status === 'loaded';
            });
          })()`,
          { timeout: 15000 },
        )
      } catch (err) {
        console.warn("[PDF] Font loading timeout, continuing with fallback fonts")
      }

      // Additional wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500))

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      })

      return pdfBuffer
    } finally {
      await page.close()
    }
  }

  /**
   * Render background-only PDF (two-column colors)
   * Uses shared generateBackgroundHTML
   */
  private async renderBackgroundPDF(
    sidebarColor: string,
    mainColor: string,
  ): Promise<Uint8Array> {
    if (!this.browser) {
      throw new Error("Browser not initialized")
    }

    const page = await this.browser.newPage()

    try {
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })

      const html = generateBackgroundHTML(sidebarColor, mainColor)

      await page.setContent(html, { waitUntil: "domcontentloaded" })

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      })

      return pdfBuffer
    } finally {
      await page.close()
    }
  }

  /**
   * Generate simple single-column PDF (for minimal layouts)
   * Uses shared generateCVDocument
   */
  private async generateSimplePDF(
    cv: CVInstance,
    template: Template,
    config: TemplateConfig,
    outputPath: string,
  ): Promise<PDFGenerationResult> {
    const page = await this.browser!.newPage()

    try {
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })

      const parsedContent = cv.parsed_content
      if (!parsedContent) {
        throw new Error("CV content not parsed")
      }

      // Get fonts URL
      const usedFonts = this.getUsedFonts(config)
      const fontsURL = usedFonts.length > 0 ? generateGoogleFontsURL(usedFonts) : ""

      // Generate complete document using shared renderer
      const { html } = generateCVDocument(parsedContent, config, {
        mode: 'pdf',
        pagination: true,
        columnBreaks: 'actual',
        fullDocument: true,
        fontsURL,
      })

      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "networkidle0"],
      })

      try {
        await page.waitForSelector(".fonts-loaded", { timeout: 10000 })
      } catch {
        // Continue
      }

      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      })

      const stats = await fs.stat(outputPath)

      return {
        filename: path.basename(outputPath),
        filepath: outputPath,
        size: stats.size,
        pages: Math.max(1, Math.ceil(stats.size / 30000)),
      }
    } finally {
      await page.close()
    }
  }
}

// Singleton instance
let pdfGeneratorInstance: PDFGenerator | null = null

/**
 * Get singleton PDF generator instance
 */
export function getPDFGenerator(): PDFGenerator {
  if (!pdfGeneratorInstance) {
    pdfGeneratorInstance = new PDFGenerator()
  }
  return pdfGeneratorInstance
}
