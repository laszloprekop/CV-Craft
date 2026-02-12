/**
 * Client-side markdown parser for live preview.
 * Parses CV markdown content into structured data without relying on backend.
 * Extracted from CVPreview for independent testability.
 */

import type { CVFrontmatter, CVSection, ParsedCVContent } from '../../../shared/types'

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

/**
 * Parse CV markdown content into structured data for the live preview.
 */
export function parseMarkdownContent(content: string): ParsedCVContent {
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
        frontmatter[keyTrimmed] = value
      }
    })
  } else {
    // Extract from plain markdown (first H1 as name, email from content)
    const h1Match = markdownContent.match(/^#\s+(.+)$/m)
    const emailMatch = markdownContent.match(/[\w.-]+@[\w.-]+\.\w+/)
    const phoneMatch = markdownContent.match(
      /(?:📱|phone)[\s*]*:?\s*([+\d\s\-().]+)/i,
    )
    const locationMatch = markdownContent.match(
      /(?:📍|location)[\s*]*:?\s*([^,\n]+)/i,
    )
    const photoMatch = markdownContent.match(
      /!\[(?:Profile|Photo|profile|photo)[^\]]*\]\(([^)]+)\)/,
    )

    frontmatter = {
      name: h1Match ? h1Match[1].trim() : '',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[1].trim() : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      photo: photoMatch ? photoMatch[1].trim() : undefined,
    }
  }

  // Parse sections with better structure parsing
  const sections: CVSection[] = []
  const sectionMatches = markdownContent.split(/^##\s+/m).slice(1)

  sectionMatches.forEach((sectionText: string) => {
    const hasBreak = /<!--\s*break\s*-->/i.test(sectionText)
    const cleanedText = sectionText.replace(/<!--\s*break\s*-->/gi, '')

    const lines = cleanedText.split('\n')
    const title = lines[0].trim()
    const sectionContent = lines.slice(1).join('\n').trim()

    if (title && sectionContent) {
      const sectionType = inferSectionType(title)
      let parsedContent: CVSection['content']

      if (
        sectionType === 'experience' ||
        sectionType === 'education' ||
        sectionType === 'projects'
      ) {
        parsedContent = parseStructuredEntries(sectionContent)
      } else if (sectionType === 'skills') {
        parsedContent = parseSkills(sectionContent) as CVSection['content']
      } else {
        // Check if content is a bullet list
        const lines = sectionContent.split('\n').filter((l: string) => l.trim())
        const isBulletList = lines.length > 0 && lines.every((l: string) => l.trim().match(/^[-*]\s+/))
        if (isBulletList) {
          parsedContent = lines.map((l: string) => ({ text: l.trim().replace(/^[-*]\s+/, '') }))
        } else {
          parsedContent = sectionContent.split('\n\n').filter((p: string) => p.trim())
        }
      }

      sections.push({
        title,
        type: sectionType,
        content: parsedContent,
        level: 2,
      })
    }

    if (hasBreak) {
      sections.push({
        type: 'paragraph',
        title: '',
        content: '',
        breakBefore: true,
      })
    }
  })

  return { frontmatter, sections }
}

/**
 * Infer section type from title (simplified version for client-side parsing).
 */
export function inferSectionType(title: string): CVSection['type'] {
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

function parseStructuredEntries(content: string): StructuredEntry[] {
  const entries: StructuredEntry[] = []
  const entryBlocks = content.split(/^###\s+/m).slice(1)

  entryBlocks.forEach((block: string) => {
    const lines = block.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return

    const titleLine = lines[0].trim()
    let title = '',
      company = '',
      date = '',
      location = ''

    if (titleLine.includes('|')) {
      const parts = titleLine.split('|')
      title = parts[0].trim()
      company = parts[1].trim()
    } else if (titleLine.includes(' at ')) {
      const parts = titleLine.split(' at ')
      title = parts[0].trim()
      company = parts[1].trim()
    } else {
      title = titleLine
    }

    const descLines: string[] = []
    const bullets: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const trimmed = lines[i].trim()

      // Date line (contains a year, often wrapped in italics)
      if (trimmed.match(/^\*?.*\d{4}.*\*?$/) && !date) {
        date = trimmed.replace(/\*/g, '').trim()
      }
      // Bullet list item (starts with - or *)
      else if (trimmed.match(/^[-*]\s+/)) {
        bullets.push(trimmed.replace(/^[-*]\s+/, ''))
      }
      // Location line: "City, State" or "City, Country" pattern (short, no bullet, has comma)
      else if (!location && trimmed.match(/^[A-Z][\w\s]+,\s*[A-Z][\w\s]*$/) && trimmed.length < 50) {
        location = trimmed
      }
      // Description text
      else if (trimmed.length > 0) {
        descLines.push(trimmed)
      }
    }

    entries.push({
      title,
      company,
      date,
      location,
      description: descLines.join(' ').trim() || undefined,
      bullets: bullets.length > 0 ? bullets : undefined,
    })
  })

  return entries
}

function parseSkills(content: string): SkillCategory[] {
  const skillCategories: SkillCategory[] = []
  const lines = content.split('\n').filter((line: string) => line.trim())

  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()

    const boldCategoryMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
    if (boldCategoryMatch) {
      const category = boldCategoryMatch[1].trim()
      const skillsStr = boldCategoryMatch[2].trim()

      if (skillsStr) {
        const skills = skillsStr
          .split(',')
          .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ''))
          .filter(Boolean)
        skillCategories.push({ category, skills })
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        const skills = nextLine
          .split(',')
          .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ''))
          .filter(Boolean)
        skillCategories.push({ category, skills })
        i++
      }
      i++
      continue
    }

    if (trimmed.includes(':')) {
      const [category, skillsStr] = trimmed.split(':')
      const skills = skillsStr
        .trim()
        .split(',')
        .map((s) => s.trim().replace(/^\*\*|\*\*$/g, ''))
        .filter(Boolean)
      skillCategories.push({
        category: category.trim().replace(/^\*\*|\*\*$/g, ''),
        skills,
      })
    }
    i++
  }

  return skillCategories.length > 0
    ? skillCategories
    : [{ category: 'Skills', skills: lines }]
}
