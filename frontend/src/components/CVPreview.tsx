/**
 * CV Preview Component
 *
 * Renders the live preview of the CV with template styling matching design proposal
 *
 * Note: This file uses CSS custom properties (CSS variables) extensively for theming.
 * TypeScript's strict CSS type checking is relaxed for style objects that contain CSS variables.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react"
import {
  Phone,
  Envelope,
  LinkedinLogo,
  GithubLogo,
  MapPin,
  Globe,
  Browser,
  FilePdf,
  ListDashes,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react"
import type {
  CVInstance,
  Template,
  TemplateSettings,
  TemplateConfig,
  Asset,
  CVFrontmatter,
  CVSection,
  ParsedCVContent,
} from "../../../shared/types"
import { cvApi } from "../services/api"
import { loadFonts } from "../services/GoogleFontsService"
import { resolveSemanticColor } from "../utils/colorResolver"
import { generateCSSVariables } from "../../../shared/utils/cssVariableGenerator"
import { renderSections } from "../../../shared/utils/sectionRenderer"
import { sanitizeUrl } from "../../../shared/utils/sanitizeUrl"
import { injectSemanticCSS } from "../utils/injectSemanticCSS"
import DOMPurify from "dompurify"
import { useProfilePhoto } from "./useProfilePhoto"
import { usePageBreaks } from "./usePageBreaks"
import { parseMarkdownContent } from "./parseMarkdownContent"

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

// Preview mode types - two modes: HTML preview vs exact PDF
type PreviewMode = "html" | "exact-pdf"

// localStorage keys for persistence
const PREVIEW_MODE_KEY = "cv-craft-preview-mode"
const PAGE_MARKERS_KEY = "cv-craft-page-markers-visible"

// Load saved mode or default to 'html'
const getInitialPreviewMode = (): PreviewMode => {
  if (typeof window === "undefined") return "html"
  const saved = localStorage.getItem(PREVIEW_MODE_KEY)
  if (saved === "html" || saved === "exact-pdf") {
    return saved
  }
  // Migrate old values
  if (saved === "web" || saved === "page-markers") {
    localStorage.setItem(PREVIEW_MODE_KEY, "html")
    return "html"
  }
  return "html"
}

// Load saved page markers visibility or default to true
const getInitialPageMarkersVisible = (): boolean => {
  if (typeof window === "undefined") return true
  const saved = localStorage.getItem(PAGE_MARKERS_KEY)
  if (saved === "true" || saved === "false") {
    return saved === "true"
  }
  return true
}

interface CVPreviewProps {
  cv: CVInstance | null
  template: Template | null
  settings: Partial<TemplateSettings>
  config?: TemplateConfig // Add config support
  isPending: boolean
  liveContent?: string // Live content from editor for real-time preview
  zoomLevel?: "fit-width" | "fit-height" | "actual-size" | "custom"
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
  zoomLevel = "fit-width",
  zoomPercentage = 100,
  onSettingsChange,
}) => {
  // Profile photo URL loaded from asset
  const photoUrl = useProfilePhoto(cv)

  // Preview mode state with localStorage persistence
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    getInitialPreviewMode,
  )

  // Page markers visibility state with localStorage persistence
  const [pageMarkersVisible, setPageMarkersVisible] = useState<boolean>(
    getInitialPageMarkersVisible,
  )

  // Ref for measuring content height for page markers
  const contentRef = React.useRef<HTMLDivElement>(null)

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
    setPageMarkersVisible((prev) => {
      const newValue = !prev
      localStorage.setItem(PAGE_MARKERS_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Load Google Fonts when config changes
  useEffect(() => {
    const activeConfig = config || template?.default_config
    if (!activeConfig) return

    // Collect all fonts that need to be loaded
    const fontsToLoad: string[] = []

    // Add fonts from availableFonts library
    if (
      activeConfig.typography.availableFonts &&
      activeConfig.typography.availableFonts.length > 0
    ) {
      fontsToLoad.push(...activeConfig.typography.availableFonts)
    }

    // Extract primary font from heading/body font stacks (first font before comma)
    const extractPrimaryFont = (
      fontStack: string | undefined,
    ): string | null => {
      if (!fontStack) return null
      const firstFont = fontStack.split(",")[0]?.trim().replace(/['"]/g, "")
      // Only return if it's not a system font
      const systemFonts = [
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif",
        "serif",
        "monospace",
        "Georgia",
        "Times New Roman",
        "Arial",
        "Helvetica",
      ]
      return firstFont && !systemFonts.includes(firstFont) ? firstFont : null
    }

    // Add active heading and body fonts
    const headingFont = extractPrimaryFont(
      activeConfig.typography.fontFamily?.heading,
    )
    const bodyFont = extractPrimaryFont(
      activeConfig.typography.fontFamily?.body,
    )

    if (headingFont && !fontsToLoad.includes(headingFont)) {
      fontsToLoad.push(headingFont)
    }
    if (bodyFont && !fontsToLoad.includes(bodyFont)) {
      fontsToLoad.push(bodyFont)
    }

    if (fontsToLoad.length > 0) {
      loadFonts(fontsToLoad)
    }
  }, [
    config?.typography.availableFonts,
    config?.typography.fontFamily,
    template?.default_config?.typography.availableFonts,
    template?.default_config?.typography.fontFamily,
  ])

  // Simple Markdown renderer for formatting
  const renderMarkdown = (text: string) => {
    if (!text) return null

    // Convert spacer characters to visible line breaks
    let formatted = text.replace(/\u200B/g, "<br/>")
    // Handle line breaks - convert \n to <br/>
    formatted = formatted.replace(/\n/g, "<br/>")

    // Handle bold (**text**) - use non-greedy match to avoid conflicts with italics
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    // Handle italics (*text*) - only single asterisks not followed/preceded by another
    formatted = formatted.replace(
      /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g,
      "<em>$1</em>",
    )

    // Handle links [text](url) - sanitize URL to prevent javascript: XSS
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match: string, text: string, url: string) =>
        `<a href="${sanitizeUrl(url)}" style="color: var(--link-color); text-decoration: underline;">${text}</a>`,
    )

    // Handle inline code `code`
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code style="background-color: var(--muted-color); padding: 0 0.25rem; border-radius: 0.125rem; font-size: var(--inline-code-font-size);">$1</code>',
    )

    return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }} />
  }

  // Parse skills with better categorization
  const parseSkills = (content: string): SkillCategory[] => {
    const skillCategories: SkillCategory[] = []
    const lines = content.split("\n").filter((line: string) => line.trim())

    let i = 0
    while (i < lines.length) {
      const trimmed = lines[i].trim()

      // Check if line has category with colon (e.g., "**Programming Languages:** Kotlin, Java")
      const boldCategoryMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
      if (boldCategoryMatch) {
        const category = boldCategoryMatch[1].trim()
        const skillsStr = boldCategoryMatch[2].trim()

        // If skills are on the same line
        if (skillsStr) {
          const skills = skillsStr
            .split(",")
            .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ""))
            .filter(Boolean)
          skillCategories.push({ category, skills })
        }
        // If skills are on the next line
        else if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()
          const skills = nextLine
            .split(",")
            .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ""))
            .filter(Boolean)
          skillCategories.push({ category, skills })
          i++ // Skip next line since we processed it
        }
        i++
        continue
      }

      // Check for simple format like "Programming: JavaScript, Python"
      if (trimmed.includes(":")) {
        const [category, skillsStr] = trimmed.split(":")
        const skills = skillsStr
          .trim()
          .split(",")
          .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ""))
          .filter(Boolean)
        skillCategories.push({
          category: category.trim().replace(/^\*\*|\*\*$/g, ""),
          skills,
        })
      }
      i++
    }

    return skillCategories.length > 0
      ? skillCategories
      : [{ category: "Skills", skills: lines }]
  }

  /**
   * Render section content using the shared renderer
   * Used to ensure consistency between web preview and PDF export
   *
   * @param section - The CV section to render
   * @param forPDF - Whether this is for PDF mode (adds pagination classes)
   * @returns HTML string of the section content (inner content only, without section wrapper)
   */
  const renderSectionContentHTML = (
    section: CVSection,
    forPDF: boolean = false,
  ): string => {
    const activeConfig = config || template?.default_config
    const html = renderSections([section], {
      pagination: forPDF,
      classPrefix: "",
      metaSeparator: activeConfig?.components?.jobTitle?.metaSeparator,
    })
    return extractSectionInnerContent(html)
  }

  /**
   * Extract the inner content from rendered section HTML
   * Strips the section wrapper and header, returning just the section-content div's innerHTML
   */
  const extractSectionInnerContent = (html: string): string => {
    // Match the section-content div and extract its inner HTML
    const match = html.match(
      /<div class="[^"]*section-content[^"]*">([\s\S]*?)<\/div>\s*<\/section>/i,
    )
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
    const titleLower = section.title?.toLowerCase() || ""
    return (
      section.type === "skills" ||
      titleLower.includes("skill") ||
      titleLower.includes("technical")
    )
  }

  // Infer section type from title (simplified version)
  const inferSectionType = (title: string): CVSection["type"] => {
    const lower = title.toLowerCase()
    if (lower.includes("experience") || lower.includes("work"))
      return "experience"
    if (lower.includes("education")) return "education"
    if (lower.includes("skill")) return "skills"
    if (lower.includes("project")) return "projects"
    if (lower.includes("language")) return "languages"
    if (lower.includes("certification")) return "certifications"
    if (lower.includes("interest") || lower.includes("hobbies"))
      return "interests"
    if (lower.includes("reference")) return "references"
    if (lower.includes("summary") || lower.includes("about")) return "summary"
    return "paragraph"
  }

  // Parse CV content for preview - use backend sections for consistency
  const parsedContent = useMemo(() => {
    // ALWAYS use backend parsed_content for consistent rendering
    // Backend now provides rich structured sections (jobs, education, skills, etc.)
    if (cv?.parsed_content) {
      try {
        return cv.parsed_content
      } catch (error) {
        console.error("Failed to parse saved content:", error)
        return null
      }
    }

    // FALLBACK ONLY: If we have live content but no backend data (edge case)
    // This maintains basic functionality during live editing
    if (liveContent) {
      try {
        return parseMarkdownContent(liveContent)
      } catch (error) {
        console.error("Failed to parse live content:", error)
        return null
      }
    }

    return null
  }, [cv?.parsed_content, liveContent])

  // Keep a ref to the latest config so the PDF effect always sends the current config
  const configRef = useRef(config)
  configRef.current = config

  // Load PDF preview when in exact-pdf mode
  // Sends the frontend's current config to avoid stale database config issues
  useEffect(() => {
    if (previewMode !== "exact-pdf" || !cv?.id) {
      return
    }

    let cancelled = false
    setPdfLoading(true)
    setPdfError(null)

    // Timeout to prevent infinite loading state
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setPdfError("PDF generation timed out")
        setPdfLoading(false)
      }
    }, 30000)

    cvApi
      .getPreviewPdf(cv.id, configRef.current)
      .then((url) => {
        if (!cancelled) {
          clearTimeout(timeout)
          // Revoke old URL to prevent memory leak
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
          }
          setPdfUrl(url)
          setPdfLoading(false)
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        if (!cancelled) {
          console.error("[CVPreview] Failed to load PDF preview:", err)
          setPdfError("Failed to generate PDF preview")
          setPdfLoading(false)
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
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
    // Use config directly (already includes fallback chain from CVEditorPage)
    const activeConfig = config || template?.default_config
    if (!activeConfig) return {}

    // Use shared CSS variable generator for consistency with PDF export
    const cssVariables = generateCSSVariables(activeConfig)

    return cssVariables as CSSCustomProperties
  }, [template, config])

  // Calculate page breaks via extracted hook
  const pageBreaks = usePageBreaks(contentRef, pageMarkersVisible, previewMode, [
    parsedContent,
    templateStyles,
    zoomPercentage,
  ])

  // Helper function to render skills with configurable tag/separator style
  const renderSkills = (
    skillCategories: SkillCategory[],
    isSidebar: boolean = false,
  ) => {
    const activeConfig = config || template?.default_config
    const tagStyle = activeConfig?.components?.tags?.style || "pill"
    const separator = activeConfig?.components?.tags?.separator || "·"
    const styles = templateStyles

    return skillCategories.map(
      (category: SkillCategory, categoryIndex: number) => (
        <div key={categoryIndex} className="mb-4">
          <h4
            className="text-xs font-semibold mb-2"
            style={{
              fontFamily: templateStyles["--heading-font-family"],
              color: isSidebar
                ? (templateStyles["--on-secondary-color"] as string)
                : (templateStyles["--text-color"] as string),
            }}
          >
            {category.category}
          </h4>
          {tagStyle === "pill" ? (
            // Pill style: rounded background tags
            <div className="flex flex-wrap gap-1">
              {category.skills.map(
                (
                  skill: string | { name?: string; text?: string },
                  skillIndex: number,
                ) => {
                  const skillText =
                    typeof skill === "string"
                      ? skill
                      : skill.name || skill.text || String(skill)
                  return (
                    <span
                      key={skillIndex}
                      className="inline-block px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: templateStyles[
                          "--tag-bg-color"
                        ] as string,
                        color: templateStyles["--tag-text-color"] as string,
                        borderRadius: templateStyles[
                          "--tag-border-radius"
                        ] as string,
                        fontFamily: templateStyles["--heading-font-family"],
                        fontSize:
                          (templateStyles[
                            "--tag-font-size-custom"
                          ] as string) ||
                          (templateStyles["--tag-font-size"] as string),
                        fontWeight:
                          activeConfig?.components?.tags?.fontWeight || 500,
                      }}
                    >
                      {renderMarkdown(skillText)}
                    </span>
                  )
                },
              )}
            </div>
          ) : (
            // Inline style: separated text
            <div
              className="text-sm"
              style={{
                color: isSidebar
                  ? (templateStyles["--on-secondary-color"] as string)
                  : (templateStyles["--text-color"] as string),
                fontSize:
                  (templateStyles["--tag-font-size-custom"] as string) ||
                  (templateStyles["--tag-font-size"] as string),
              }}
            >
              {category.skills.map(
                (
                  skill: string | { name?: string; text?: string },
                  skillIndex: number,
                ) => {
                  const skillText =
                    typeof skill === "string"
                      ? skill
                      : skill.name || skill.text || String(skill)
                  return (
                    <span key={skillIndex}>
                      {skillIndex > 0 &&
                        (separator === "none" ? " " : ` ${separator} `)}
                      {renderMarkdown(skillText)}
                    </span>
                  )
                },
              )}
            </div>
          )}
        </div>
      ),
    )
  }

  // Helper function to render section content consistently
  // Uses shared renderer for non-skills sections to ensure consistency with PDF export
  const renderSectionContent = (
    section: CVSection,
    isSidebar: boolean = false,
    forPDF: boolean = false,
  ) => {
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
          skillCategories = parseSkills(section.content.join("\n"))
        }
      } else if (typeof section.content === "string") {
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
        className={`section-content ${isSidebar ? "sidebar" : ""}`}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHTML) }}
      />
    )
  }

  // Page break indicator component for page-markers mode
  const PageBreakIndicator: React.FC<{ pageNumber: number }> = ({
    pageNumber,
  }) => (
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
              onClick={() => setPdfVersion((v) => v + 1)}
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
      <iframe src={pdfUrl} className="exact-pdf-preview" title="PDF Preview" />
    )
  }

  // Get custom CSS from config if available
  // Safety note: customCSS comes from TemplateConfig (saved by the CV owner), not from
  // untrusted user input like markdown content. It is injected via <style> tags intentionally.
  const customCSS = useMemo(() => {
    const activeConfig = config || template?.default_config
    return activeConfig?.advanced?.customCSS || ""
  }, [config, template?.default_config])

  // Generate CV layout based on template and preview mode
  const renderCV = () => {
    // For exact-pdf mode, render the PDF viewer
    if (previewMode === "exact-pdf") {
      return renderExactPDF()
    }

    if (!parsedContent) return null

    const { frontmatter, sections } = parsedContent
    const styles = templateStyles

    // Get layout type from config
    const activeConfig = config || template?.default_config
    const layoutType = activeConfig?.layout?.templateType || "two-column"

    // Determine layout based on type
    const isSingleColumn = layoutType === "single-column"
    const isSidebarRight = layoutType === "sidebar-right"
    const isTwoColumn =
      layoutType === "two-column" ||
      layoutType === "sidebar-left" ||
      layoutType === "sidebar-right"

    // Legacy template name-based detection (fallback only)
    const useModernLayout =
      template?.name.includes("Modern") ||
      template?.name.includes("Professional")
    const useMinimalLayout =
      isSingleColumn ||
      template?.name.includes("Minimal") ||
      template?.name.includes("Clean")

    // For web mode and page-markers mode, use continuous layouts
    // Separate sections into sidebar and main content
    // Break markers are routed to the same column as the preceding section
    const sidebarTypes = ["skills", "languages", "interests", "tools"]
    const isSidebar = (s: CVSection) =>
      sidebarTypes.some(
        (type: string) =>
          (s.title?.toLowerCase() || "").includes(type) || s.type === type,
      )
    const sidebarSections: CVSection[] = []
    const mainSections: CVSection[] = []
    let lastWasSidebar = false

    for (const s of sections) {
      if (s.breakBefore && !s.title) {
        // Break marker → same column as previous section
        if (lastWasSidebar) {
          sidebarSections.push(s)
        } else {
          mainSections.push(s)
        }
      } else if (isSidebar(s)) {
        sidebarSections.push(s)
        lastWasSidebar = true
      } else {
        mainSections.push(s)
        lastWasSidebar = false
      }
    }

    // Create different layouts based on template and preview mode
    if (useMinimalLayout) {
      return (
        <div
          className="cv-preview-content bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
          style={{
            minHeight: "auto",
            width: "210mm",
            ...templateStyles,
            fontFamily: templateStyles["--font-family"],
            fontSize: templateStyles["--body-font-size"],
            color: templateStyles["--text-color"],
          }}
        >
          {/* Custom CSS Injection */}
          {customCSS && (
            <style dangerouslySetInnerHTML={{ __html: customCSS }} />
          )}
          {/* Minimal Single Column Layout */}
          <div className="p-8">
            {/* Header */}
            <header
              className="text-center mb-6 pb-4"
              style={{
                borderBottom: `2px solid ${templateStyles["--accent-color"]}`,
              }}
            >
              <h1
                className="text-3xl font-bold"
                style={{
                  // Typography
                  fontFamily: templateStyles["--heading-font-family"],
                  fontSize: templateStyles["--name-font-size"],
                  fontWeight: templateStyles["--name-font-weight"],
                  color: templateStyles["--name-color"],
                  letterSpacing: templateStyles["--name-letter-spacing"],
                  textTransform: templateStyles["--name-text-transform"] as any,
                  textAlign: templateStyles["--name-alignment"] as any,
                  lineHeight: templateStyles["--name-line-height"],
                  fontStyle: templateStyles["--name-font-style"] as any,
                  // Spacing
                  marginTop: templateStyles["--name-margin-top"],
                  marginBottom: templateStyles["--name-margin-bottom"],
                  marginLeft: templateStyles["--name-margin-left"],
                  marginRight: templateStyles["--name-margin-right"],
                  padding: templateStyles["--name-padding"],
                  // Background
                  backgroundColor: templateStyles["--name-background-color"],
                  borderRadius: templateStyles["--name-border-radius"],
                  // Border
                  borderStyle: templateStyles["--name-border-style"] as any,
                  borderWidth:
                    templateStyles["--name-border-style"] !== "none"
                      ? templateStyles["--name-border-width"]
                      : undefined,
                  borderColor:
                    templateStyles["--name-border-style"] !== "none"
                      ? templateStyles["--name-border-color"]
                      : undefined,
                  // Shadow
                  boxShadow: templateStyles["--name-shadow"],
                }}
              >
                {frontmatter.name || "Your Name"}
              </h1>
              {/* Name Divider */}
              {templateStyles["--name-divider-style"] &&
                templateStyles["--name-divider-style"] !== "none" && (
                  <div
                    style={{
                      height: templateStyles["--name-divider-width"] || "2px",
                      backgroundColor: templateStyles["--name-divider-color"],
                      width:
                        templateStyles["--name-divider-style"] === "full-width"
                          ? "100%"
                          : "auto",
                      marginTop: templateStyles["--name-divider-gap"] || "4px",
                      marginBottom: "8px",
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  />
                )}
              {frontmatter.title && (
                <p
                  className="mb-4"
                  style={{
                    fontSize: "var(--h3-font-size)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {frontmatter.title}
                </p>
              )}
              {/* Contact Info in Minimal Style */}
              <div
                className="flex justify-center gap-4 text-sm"
                style={{
                  color: templateStyles["--contact-icon-color"],
                  fontSize: templateStyles["--contact-font-size"],
                  gap: templateStyles["--contact-spacing"],
                }}
              >
                {frontmatter.email && <span>{frontmatter.email}</span>}
                {frontmatter.phone && <span>{frontmatter.phone}</span>}
                {frontmatter.location && <span>{frontmatter.location}</span>}
              </div>
            </header>

            {/* All sections in single column */}
            {sections.map((section, index) => {
              // Break-marker section: render only the visual indicator
              if (section.breakBefore && !section.title) {
                return (
                  <div
                    key={`break-${index}`}
                    style={{
                      borderTop: "2px dashed #3b82f6",
                      margin: "8px 0",
                      position: "relative",
                      height: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        transform: "translateY(-50%)",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "2px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      Page Break
                    </span>
                  </div>
                )
              }
              return (
                <section
                  key={`${section.type}-${section.title}-${index}`}
                  style={{
                    marginBottom: templateStyles["--section-spacing"] || "24px",
                  }}
                >
                  <h2
                    className="text-xl font-semibold section-header"
                    style={{
                      // Typography
                      fontFamily: templateStyles["--heading-font-family"],
                      fontSize: templateStyles["--section-header-font-size"],
                      fontWeight:
                        templateStyles["--section-header-font-weight"],
                      color:
                        templateStyles["--section-header-color"] ||
                        templateStyles["--primary-color"],
                      textTransform: templateStyles[
                        "--section-header-text-transform"
                      ] as any,
                      letterSpacing:
                        templateStyles["--section-header-letter-spacing"],
                      lineHeight:
                        templateStyles["--section-header-line-height"],
                      fontStyle: templateStyles[
                        "--section-header-font-style"
                      ] as any,
                      // Spacing
                      padding: templateStyles["--section-header-padding"],
                      marginTop:
                        index === 0
                          ? "0"
                          : templateStyles["--section-header-margin-top"],
                      marginBottom:
                        templateStyles["--section-header-margin-bottom"],
                      marginLeft:
                        templateStyles["--section-header-margin-left"],
                      marginRight:
                        templateStyles["--section-header-margin-right"],
                      // Background
                      backgroundColor:
                        templateStyles["--section-header-background-color"] ||
                        "transparent",
                      borderRadius:
                        templateStyles["--section-header-border-radius"],
                      // Border
                      borderStyle: templateStyles[
                        "--section-header-border-style"
                      ] as any,
                      borderWidth:
                        templateStyles["--section-header-border-style"] !==
                        "none"
                          ? templateStyles["--section-header-border-width"]
                          : undefined,
                      borderColor:
                        templateStyles["--section-header-border-style"] !==
                        "none"
                          ? templateStyles["--section-header-border-color"]
                          : undefined,
                      // Shadow
                      boxShadow: templateStyles["--section-header-shadow"],
                    }}
                  >
                    {section.title}
                  </h2>
                  {/* Section Header Divider */}
                  {templateStyles["--section-header-divider-style"] &&
                    templateStyles["--section-header-divider-style"] !==
                      "none" && (
                      <div
                        style={{
                          height:
                            templateStyles["--section-header-divider-width"] ||
                            "2px",
                          backgroundColor:
                            templateStyles["--section-header-divider-color"],
                          width:
                            templateStyles["--section-header-divider-style"] ===
                            "full-width"
                              ? "100%"
                              : "auto",
                          marginTop:
                            templateStyles["--section-header-divider-gap"] ||
                            "0px",
                          marginBottom: "8px",
                        }}
                      />
                    )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: templateStyles["--paragraph-spacing"],
                    }}
                  >
                    {/* Use shared renderer for consistent web/PDF output */}
                    {renderSectionContent(section, false, false)}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    // Default Modern Two-Column Layout
    return (
      <div
        className="cv-preview-content bg-white shadow-lg max-w-5xl mx-auto print:shadow-none relative overflow-hidden"
        style={{
          minHeight: "auto",
          width: (templateStyles["--page-width"] as string) || "210mm",
          ...templateStyles,
          fontFamily: templateStyles["--font-family"],
          fontSize: templateStyles["--body-font-size"],
          color: templateStyles["--text-color"],
        }}
      >
        {/* Custom CSS Injection */}
        {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
        {/* Page Structure with proper margins */}
        <div className="relative" style={{ minHeight: "auto" }}>
          {/* Two-column layout */}
          <div
            className="flex h-full"
            style={{ flexDirection: isSidebarRight ? "row-reverse" : "row" }}
          >
            {/* Left Sidebar - Contact & Skills */}
            <div
              className="relative"
              style={{
                width: templateStyles["--sidebar-width"] || "84mm",
                minWidth: templateStyles["--sidebar-width"] || "84mm",
                maxWidth: templateStyles["--sidebar-width"] || "84mm",
                minHeight: "auto",
                backgroundColor: templateStyles["--surface-color"] as string,
                overflow: "hidden",
              }}
            >
              <div
                className="relative z-10"
                style={{
                  padding: `${templateStyles["--page-margin-top"] || "20mm"} 6mm ${templateStyles["--page-margin-bottom"] || "20mm"} ${templateStyles["--page-margin-left"] || "6mm"}`,
                }}
              >
                {/* Profile Photo - uses CSS variables for consistent styling with PDF */}
                <div
                  className="mb-4 flex justify-center photo-container"
                  style={{
                    marginTop:
                      templateStyles["--profile-photo-margin-top"] || "0px",
                    marginBottom:
                      templateStyles["--profile-photo-margin-bottom"] || "16px",
                    marginLeft:
                      templateStyles["--profile-photo-margin-left"] || "0px",
                    marginRight:
                      templateStyles["--profile-photo-margin-right"] || "0px",
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="profile-photo"
                      style={{
                        width:
                          templateStyles["--profile-photo-size"] || "160px",
                        height:
                          templateStyles["--profile-photo-size"] || "160px",
                        borderRadius:
                          templateStyles["--profile-photo-border-radius"] ||
                          "50%",
                        border:
                          templateStyles["--profile-photo-border"] ||
                          "3px solid #e2e8f0",
                        objectFit: "cover",
                        opacity: templateStyles["--profile-photo-opacity"] || 1,
                        boxShadow:
                          templateStyles["--profile-photo-shadow"] || "none",
                        filter:
                          templateStyles["--profile-photo-filter"] || "none",
                      }}
                    />
                  ) : (
                    <div
                      className="profile-photo-placeholder"
                      style={{
                        width:
                          templateStyles["--profile-photo-size"] || "160px",
                        height:
                          templateStyles["--profile-photo-size"] || "160px",
                        borderRadius:
                          templateStyles["--profile-photo-border-radius"] ||
                          "50%",
                        border:
                          templateStyles["--profile-photo-border"] ||
                          "3px solid #e2e8f0",
                        backgroundColor: "var(--muted-color)",
                        opacity: templateStyles["--profile-photo-opacity"] || 1,
                        boxShadow:
                          templateStyles["--profile-photo-shadow"] || "none",
                        filter:
                          templateStyles["--profile-photo-filter"] || "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--tiny-font-size)",
                          color: "var(--on-muted-color)",
                        }}
                      >
                        Photo
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {frontmatter && (
                  <div className="mb-8">
                    {/* Contact layout: stacked (column), inline (row wrap), grid (2-column grid) */}
                    <div
                      style={{
                        display:
                          templateStyles["--contact-layout"] === "grid"
                            ? "grid"
                            : "flex",
                        flexDirection:
                          templateStyles["--contact-layout"] === "inline"
                            ? "row"
                            : "column",
                        flexWrap:
                          templateStyles["--contact-layout"] === "inline"
                            ? "wrap"
                            : "nowrap",
                        gridTemplateColumns:
                          templateStyles["--contact-layout"] === "grid"
                            ? "repeat(2, 1fr)"
                            : undefined,
                        gap: templateStyles["--contact-spacing"],
                      }}
                    >
                      {frontmatter.phone && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <Phone
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <a
                            href={`tel:${frontmatter.phone.replace(/\s/g, "")}`}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {frontmatter.phone}
                          </a>
                        </div>
                      )}
                      {frontmatter.email && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <Envelope
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <a
                            href={`mailto:${frontmatter.email}`}
                            className="break-all"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {frontmatter.email}
                          </a>
                        </div>
                      )}
                      {frontmatter.linkedin && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <LinkedinLogo
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <a
                            href={frontmatter.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {frontmatter.linkedin.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                      {frontmatter.github && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <GithubLogo
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <a
                            href={frontmatter.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {frontmatter.github.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                      {frontmatter.website && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <Globe
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <a
                            href={frontmatter.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {frontmatter.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                      {frontmatter.location && (
                        <div
                          className="flex items-center text-sm"
                          style={{
                            color: "var(--on-secondary-color)",
                            fontSize: templateStyles["--contact-font-size"],
                            gap: templateStyles["--contact-spacing"],
                          }}
                        >
                          <MapPin
                            size={
                              parseInt(
                                templateStyles["--contact-icon-size"] as string,
                              ) || 16
                            }
                            className="flex-shrink-0"
                            style={{
                              color: templateStyles["--contact-icon-color"],
                            }}
                          />
                          <span>{frontmatter.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sidebar Sections (Skills, Languages, etc.) */}
                {sidebarSections.map((section, index) => {
                  // Break-marker section: render only the visual indicator
                  if (section.breakBefore && !section.title) {
                    return (
                      <div
                        key={`sidebar-break-${index}`}
                        style={{
                          borderTop: "2px dashed #3b82f6",
                          margin: "8px 0",
                          position: "relative",
                          height: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            transform: "translateY(-50%)",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            fontSize: "9px",
                            padding: "1px 5px",
                            borderRadius: "2px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                          }}
                        >
                          Page Break
                        </span>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={`sidebar-${section.type}-${section.title}-${index}`}
                      className="keep-together"
                      style={{
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                        marginBottom:
                          templateStyles["--section-spacing"] || "24px",
                      }}
                    >
                      {/* Section Header matching PDF style - uses h2 with section-header class like PDF */}
                      <h2
                        className="font-bold uppercase tracking-wide rounded section-header"
                        style={{
                          // Typography
                          fontFamily: templateStyles["--heading-font-family"],
                          fontSize:
                            templateStyles["--section-header-font-size"],
                          fontWeight:
                            templateStyles["--section-header-font-weight"],
                          color:
                            templateStyles["--section-header-color"] ||
                            (templateStyles["--on-tertiary-color"] as string) ||
                            "#ffffff",
                          letterSpacing:
                            templateStyles["--section-header-letter-spacing"],
                          textTransform: templateStyles[
                            "--section-header-text-transform"
                          ] as any,
                          lineHeight:
                            templateStyles["--section-header-line-height"],
                          fontStyle: templateStyles[
                            "--section-header-font-style"
                          ] as any,
                          // Spacing
                          padding: templateStyles["--section-header-padding"],
                          marginBottom:
                            templateStyles["--section-header-margin-bottom"],
                          marginTop:
                            index === 0
                              ? "0"
                              : templateStyles["--section-header-margin-top"],
                          marginLeft:
                            templateStyles["--section-header-margin-left"],
                          marginRight:
                            templateStyles["--section-header-margin-right"],
                          // Background (sidebar uses accent color by default when no user override)
                          backgroundColor:
                            templateStyles[
                              "--section-header-background-color"
                            ] ??
                            ((templateStyles["--accent-color"] as string) ||
                              "#c4956c"),
                          borderRadius:
                            templateStyles["--section-header-border-radius"] ||
                            "4px",
                          // Border
                          borderStyle: templateStyles[
                            "--section-header-border-style"
                          ] as any,
                          borderWidth:
                            templateStyles["--section-header-border-style"] !==
                            "none"
                              ? templateStyles["--section-header-border-width"]
                              : undefined,
                          borderColor:
                            templateStyles["--section-header-border-style"] !==
                            "none"
                              ? templateStyles["--section-header-border-color"]
                              : undefined,
                          // Shadow
                          boxShadow: templateStyles["--section-header-shadow"],
                        }}
                      >
                        {section.title}
                      </h2>
                      {/* Section Header Divider */}
                      {templateStyles["--section-header-divider-style"] &&
                        templateStyles["--section-header-divider-style"] !==
                          "none" && (
                          <div
                            style={{
                              height:
                                templateStyles[
                                  "--section-header-divider-width"
                                ] || "2px",
                              backgroundColor:
                                templateStyles[
                                  "--section-header-divider-color"
                                ],
                              width:
                                templateStyles[
                                  "--section-header-divider-style"
                                ] === "full-width"
                                  ? "100%"
                                  : "auto",
                              marginTop:
                                templateStyles[
                                  "--section-header-divider-gap"
                                ] || "0px",
                              marginBottom: "8px",
                            }}
                          />
                        )}

                      {/* Section Content - use shared renderer for consistent web/PDF output */}
                      <div
                        className="sidebar"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: templateStyles["--paragraph-spacing"],
                        }}
                      >
                        {renderSectionContent(section, true, false)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Main Content */}
            <div
              className="relative"
              style={{
                flex: 1,
                width: templateStyles["--main-width"],
                minHeight: "auto",
                backgroundColor: templateStyles["--background-color"] as string,
              }}
            >
              <div
                className="relative z-10"
                style={{
                  padding: `${templateStyles["--page-margin-top"] || "20mm"} ${templateStyles["--page-margin-right"] || "8mm"} ${templateStyles["--page-margin-bottom"] || "20mm"} 8mm`,
                }}
              >
                {/* Name and Title Header */}
                {frontmatter && (
                  <header
                    className="mb-8"
                    style={{
                      textAlign:
                        (templateStyles["--header-alignment"] as any) || "left",
                    }}
                  >
                    <h1
                      className="font-bold uppercase tracking-wide"
                      style={{
                        // Typography
                        fontSize: templateStyles["--name-font-size"],
                        fontWeight: templateStyles["--name-font-weight"],
                        color: templateStyles["--name-color"],
                        letterSpacing: templateStyles["--name-letter-spacing"],
                        textTransform: templateStyles[
                          "--name-text-transform"
                        ] as any,
                        textAlign: templateStyles["--name-alignment"] as any,
                        fontFamily: templateStyles["--heading-font-family"],
                        lineHeight: templateStyles["--name-line-height"],
                        fontStyle: templateStyles["--name-font-style"] as any,
                        // Spacing
                        marginTop: templateStyles["--name-margin-top"],
                        marginBottom: templateStyles["--name-margin-bottom"],
                        marginLeft: templateStyles["--name-margin-left"],
                        marginRight: templateStyles["--name-margin-right"],
                        padding: templateStyles["--name-padding"],
                        // Background
                        backgroundColor:
                          templateStyles["--name-background-color"],
                        borderRadius: templateStyles["--name-border-radius"],
                        // Border
                        borderStyle: templateStyles[
                          "--name-border-style"
                        ] as any,
                        borderWidth:
                          templateStyles["--name-border-style"] !== "none"
                            ? templateStyles["--name-border-width"]
                            : undefined,
                        borderColor:
                          templateStyles["--name-border-style"] !== "none"
                            ? templateStyles["--name-border-color"]
                            : undefined,
                        // Shadow
                        boxShadow: templateStyles["--name-shadow"],
                      }}
                    >
                      {frontmatter.name || "Your Name"}
                    </h1>
                    {/* Name Divider */}
                    {templateStyles["--name-divider-style"] &&
                      templateStyles["--name-divider-style"] !== "none" && (
                        <div
                          style={{
                            height:
                              templateStyles["--name-divider-width"] || "2px",
                            backgroundColor:
                              templateStyles["--name-divider-color"],
                            width:
                              templateStyles["--name-divider-style"] ===
                              "full-width"
                                ? "100%"
                                : "auto",
                            marginTop:
                              templateStyles["--name-divider-gap"] || "4px",
                            marginBottom: "8px",
                          }}
                        />
                      )}
                    {frontmatter.title && (
                      <p
                        className="font-medium"
                        style={{
                          fontSize: templateStyles["--h3-font-size"],
                          color: templateStyles["--accent-color"] || "#6b7280",
                          textAlign:
                            (templateStyles["--header-alignment"] as any) ||
                            "left",
                        }}
                      >
                        {frontmatter.title}
                      </p>
                    )}
                  </header>
                )}

                {/* Main Content Sections */}
                {mainSections.map((section, index) => {
                  // Break-marker section: render only the visual indicator
                  if (section.breakBefore && !section.title) {
                    return (
                      <div
                        key={`main-break-${index}`}
                        style={{
                          borderTop: "2px dashed #3b82f6",
                          margin: "8px 0",
                          position: "relative",
                          height: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            transform: "translateY(-50%)",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            fontSize: "9px",
                            padding: "1px 5px",
                            borderRadius: "2px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                          }}
                        >
                          Page Break
                        </span>
                      </div>
                    )
                  }
                  return (
                    <section
                      key={`main-${section.type}-${section.title}-${index}`}
                      className="keep-together"
                      style={{
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                        marginBottom:
                          templateStyles["--section-spacing"] || "24px",
                      }}
                    >
                      {/* Section Header matching PDF style exactly */}
                      <h2
                        className="font-bold uppercase tracking-wide rounded section-header"
                        style={{
                          // Typography
                          fontFamily: templateStyles["--heading-font-family"],
                          fontSize:
                            templateStyles["--section-header-font-size"],
                          fontWeight:
                            templateStyles["--section-header-font-weight"],
                          color:
                            templateStyles["--section-header-color"] ||
                            (templateStyles["--on-primary-color"] as string) ||
                            "#ffffff",
                          textTransform: templateStyles[
                            "--section-header-text-transform"
                          ] as any,
                          letterSpacing:
                            templateStyles["--section-header-letter-spacing"],
                          lineHeight:
                            templateStyles["--section-header-line-height"],
                          fontStyle: templateStyles[
                            "--section-header-font-style"
                          ] as any,
                          // Spacing
                          padding: templateStyles["--section-header-padding"],
                          marginTop:
                            index === 0
                              ? "0"
                              : templateStyles["--section-header-margin-top"],
                          marginBottom:
                            templateStyles["--section-header-margin-bottom"],
                          marginLeft:
                            templateStyles["--section-header-margin-left"],
                          marginRight:
                            templateStyles["--section-header-margin-right"],
                          // Background (main content uses primary color by default when no user override)
                          backgroundColor:
                            templateStyles[
                              "--section-header-background-color"
                            ] ??
                            ((templateStyles["--primary-color"] as string) ||
                              "#a8956b"),
                          borderRadius:
                            templateStyles["--section-header-border-radius"] ||
                            "4px",
                          // Border
                          borderStyle: templateStyles[
                            "--section-header-border-style"
                          ] as any,
                          borderWidth:
                            templateStyles["--section-header-border-style"] !==
                            "none"
                              ? templateStyles["--section-header-border-width"]
                              : undefined,
                          borderColor:
                            templateStyles["--section-header-border-style"] !==
                            "none"
                              ? templateStyles["--section-header-border-color"]
                              : undefined,
                          // Shadow
                          boxShadow: templateStyles["--section-header-shadow"],
                        }}
                      >
                        {section.title}
                      </h2>
                      {/* Section Header Divider */}
                      {templateStyles["--section-header-divider-style"] &&
                        templateStyles["--section-header-divider-style"] !==
                          "none" && (
                          <div
                            style={{
                              height:
                                templateStyles[
                                  "--section-header-divider-width"
                                ] || "2px",
                              backgroundColor:
                                templateStyles[
                                  "--section-header-divider-color"
                                ],
                              width:
                                templateStyles[
                                  "--section-header-divider-style"
                                ] === "full-width"
                                  ? "100%"
                                  : "auto",
                              marginTop:
                                templateStyles[
                                  "--section-header-divider-gap"
                                ] || "0px",
                              marginBottom: "8px",
                            }}
                          />
                        )}

                      {/* Section Content - Use shared renderer for consistent web/PDF output */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: templateStyles["--paragraph-spacing"],
                        }}
                      >
                        {renderSectionContent(section, false, false)}
                      </div>
                    </section>
                  )
                })}
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
        <div className="text-center" style={{ color: "var(--text-muted)" }}>
          <h3 className="text-lg font-medium mb-2">No CV Selected</h3>
          <p className="text-sm">
            Create a new CV or select an existing one to see the preview.
          </p>
        </div>
      </div>
    )
  }

  // Calculate zoom styles based on zoom level and percentage
  const getZoomStyles = () => {
    const scale = zoomPercentage / 100
    return {
      transform: `scale(${scale})`,
      transformOrigin: "top center",
    }
  }

  // Mode selector UI component
  const PreviewModeSelector: React.FC = () => (
    <div className="preview-mode-selector">
      <div className="mode-buttons">
        <button
          className={previewMode === "html" ? "active" : ""}
          onClick={() => handleModeChange("html")}
          title="Fast HTML preview"
        >
          <Browser size={16} weight="bold" />
          <span>HTML</span>
        </button>
        <button
          className={previewMode === "exact-pdf" ? "active" : ""}
          onClick={() => handleModeChange("exact-pdf")}
          title="Exact PDF preview from backend"
        >
          <FilePdf size={16} weight="bold" />
          <span>PDF preview</span>
        </button>
      </div>
      {/* Page markers toggle - only visible in HTML mode */}
      {previewMode === "html" && (
        <button
          className={`page-markers-toggle ${pageMarkersVisible ? "active" : ""}`}
          onClick={handlePageMarkersToggle}
          title={pageMarkersVisible ? "Hide page markers" : "Show page markers"}
        >
          {pageMarkersVisible ? (
            <Eye size={16} weight="bold" />
          ) : (
            <EyeSlash size={16} weight="bold" />
          )}
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
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Updating preview...
          </div>
        </div>
      )}

      {/* Mode Selector Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-surface sticky top-0 z-10">
        <PreviewModeSelector />
      </div>

      {/* CV Preview Content */}
      <div
        className={`flex-1 p-6 transition-opacity duration-200 ${isPending ? "opacity-70" : "opacity-100"} ${previewMode === "exact-pdf" ? "p-0" : ""}`}
      >
        {previewMode === "exact-pdf" ? (
          // Exact PDF mode takes full height without zoom transform
          <div className="h-full">{renderCV()}</div>
        ) : (
          // HTML mode uses zoom transform and optional page markers
          <div
            ref={contentRef}
            className="transition-transform duration-200 ease-in-out relative"
            style={getZoomStyles()}
          >
            {renderCV()}
            {/* Page break indicators */}
            {pageMarkersVisible &&
              pageBreaks.map((position, index) => (
                <div
                  key={`page-break-${position}`}
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
