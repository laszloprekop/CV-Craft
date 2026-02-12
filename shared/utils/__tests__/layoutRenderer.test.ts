import { describe, it, expect } from 'vitest'
import {
  isSidebarSection,
  splitSections,
  generateCVDocument,
  generateTwoColumnBody,
  generateSingleColumnBody,
  generateBackgroundHTML,
  renderSkillsSection,
  generateCVCSS,
} from '../layoutRenderer'
import { DEFAULT_TEMPLATE_CONFIG } from '../../types/defaultTemplateConfig'
import type { CVFrontmatter, CVSection, ParsedCVContent, TemplateConfig } from '../../types'
import type { CVDocumentOptions } from '../layoutRenderer'

// ─── Test helpers ─────────────────────────────────────────────────────────────

const baseFrontmatter: CVFrontmatter = {
  name: 'Test User',
  email: 'test@example.com',
}

function makeSection(overrides: Partial<CVSection>): CVSection {
  return {
    type: 'skills',
    title: 'Skills',
    content: [{ category: 'Languages', skills: ['JS'] }],
    ...overrides,
  } as CVSection
}

function makeParsedContent(overrides?: {
  frontmatter?: Partial<CVFrontmatter>
  sections?: CVSection[]
}): ParsedCVContent {
  return {
    frontmatter: { ...baseFrontmatter, ...overrides?.frontmatter },
    sections: overrides?.sections ?? [],
  }
}

const baseDocOptions: CVDocumentOptions = {
  mode: 'web',
  pagination: false,
  columnBreaks: 'css',
  fullDocument: false,
}

// ─── isSidebarSection ─────────────────────────────────────────────────────────

describe('isSidebarSection', () => {
  describe('returns true for sidebar section types', () => {
    it.each([
      ['skills', 'Skills'],
      ['languages', 'Languages'],
      ['interests', 'Interests'],
    ] as const)('returns true for type=%s', (type, title) => {
      expect(isSidebarSection(makeSection({ type, title }))).toBe(true)
    })

    it('returns true for tools section type', () => {
      expect(
        isSidebarSection(makeSection({ type: 'skills', title: 'Tools' }))
      ).toBe(true)
    })
  })

  describe('returns true when title contains sidebar keywords (case insensitive)', () => {
    it('matches title containing "skills" regardless of case', () => {
      expect(
        isSidebarSection(makeSection({ type: 'heading', title: 'Technical SKILLS' }))
      ).toBe(true)
    })

    it('matches title containing "languages"', () => {
      expect(
        isSidebarSection(makeSection({ type: 'heading', title: 'Programming Languages' }))
      ).toBe(true)
    })

    it('matches title containing "interests"', () => {
      expect(
        isSidebarSection(makeSection({ type: 'heading', title: 'Personal Interests' }))
      ).toBe(true)
    })

    it('matches title containing "tools"', () => {
      expect(
        isSidebarSection(makeSection({ type: 'heading', title: 'Development Tools' }))
      ).toBe(true)
    })
  })

  describe('returns false for non-sidebar section types', () => {
    it.each([
      ['experience', 'Work Experience'],
      ['education', 'Education'],
      ['summary', 'Summary'],
      ['projects', 'Projects'],
      ['certifications', 'Certifications & Awards'],
    ] as const)('returns false for type=%s, title=%s', (type, title) => {
      expect(isSidebarSection(makeSection({ type, title }))).toBe(false)
    })
  })

  describe('returns false when title does not match sidebar keywords', () => {
    it('returns false for generic heading', () => {
      expect(
        isSidebarSection(makeSection({ type: 'heading', title: 'About Me' }))
      ).toBe(false)
    })

    it('returns false for paragraph type with unrelated title', () => {
      expect(
        isSidebarSection(makeSection({ type: 'paragraph', title: 'Overview' }))
      ).toBe(false)
    })
  })
})

// ─── splitSections ────────────────────────────────────────────────────────────

describe('splitSections', () => {
  it('splits sections correctly into sidebar and main arrays', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'skills', title: 'Skills' }),
      makeSection({ type: 'experience', title: 'Work Experience' }),
      makeSection({ type: 'languages', title: 'Languages' }),
      makeSection({ type: 'education', title: 'Education' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    expect(sidebarSections).toHaveLength(2)
    expect(mainSections).toHaveLength(2)
    expect(sidebarSections[0].title).toBe('Skills')
    expect(sidebarSections[1].title).toBe('Languages')
    expect(mainSections[0].title).toBe('Work Experience')
    expect(mainSections[1].title).toBe('Education')
  })

  it('routes break markers to the same column as the preceding section (sidebar)', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'skills', title: 'Skills' }),
      makeSection({ type: 'heading', title: undefined, content: '', breakBefore: true }),
      makeSection({ type: 'experience', title: 'Work Experience' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    // Break marker follows sidebar section -> should go to sidebar
    expect(sidebarSections).toHaveLength(2)
    expect(sidebarSections[1].breakBefore).toBe(true)
    expect(mainSections).toHaveLength(1)
  })

  it('routes break markers to the same column as the preceding section (main)', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'experience', title: 'Work Experience' }),
      makeSection({ type: 'heading', title: undefined, content: '', breakBefore: true }),
      makeSection({ type: 'skills', title: 'Skills' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    // Break marker follows main section -> should go to main
    expect(mainSections).toHaveLength(2)
    expect(mainSections[1].breakBefore).toBe(true)
    expect(sidebarSections).toHaveLength(1)
  })

  it('routes initial break marker to main when no preceding section', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'heading', title: undefined, content: '', breakBefore: true }),
      makeSection({ type: 'skills', title: 'Skills' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    // lastWasSidebar defaults to false, so first break marker goes to main
    expect(mainSections).toHaveLength(1)
    expect(mainSections[0].breakBefore).toBe(true)
    expect(sidebarSections).toHaveLength(1)
    expect(sidebarSections[0].title).toBe('Skills')
  })

  it('returns empty arrays for empty input', () => {
    const { sidebarSections, mainSections } = splitSections([])

    expect(sidebarSections).toEqual([])
    expect(mainSections).toEqual([])
  })

  it('returns empty main when all sections are sidebar', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'skills', title: 'Skills' }),
      makeSection({ type: 'languages', title: 'Languages' }),
      makeSection({ type: 'interests', title: 'Interests' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    expect(sidebarSections).toHaveLength(3)
    expect(mainSections).toHaveLength(0)
  })

  it('returns empty sidebar when all sections are main', () => {
    const sections: CVSection[] = [
      makeSection({ type: 'experience', title: 'Work Experience' }),
      makeSection({ type: 'education', title: 'Education' }),
      makeSection({ type: 'summary', title: 'Summary' }),
    ]

    const { sidebarSections, mainSections } = splitSections(sections)

    expect(sidebarSections).toHaveLength(0)
    expect(mainSections).toHaveLength(3)
  })
})

// ─── generateCVDocument ───────────────────────────────────────────────────────

describe('generateCVDocument', () => {
  it('returns an object with css, html, and cssVariables properties', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      baseDocOptions
    )

    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('css')
    expect(result).toHaveProperty('cssVariables')
    expect(typeof result.html).toBe('string')
    expect(typeof result.css).toBe('string')
    expect(typeof result.cssVariables).toBe('object')
  })

  it('with fullDocument=false, returns body HTML only (no DOCTYPE)', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: false }
    )

    expect(result.html).not.toContain('<!DOCTYPE html>')
    expect(result.html).not.toContain('<head>')
    expect(result.html).not.toContain('<style>')
  })

  it('with fullDocument=true, returns HTML with DOCTYPE, head, body, and style tags', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: true }
    )

    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('<head>')
    expect(result.html).toContain('<body>')
    expect(result.html).toContain('<style>')
    expect(result.html).toContain('</html>')
  })

  it('HTML contains frontmatter name', () => {
    const result = generateCVDocument(
      makeParsedContent({ frontmatter: { name: 'Jane Doe', email: 'jane@test.com' } }),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: true }
    )

    expect(result.html).toContain('Jane Doe')
  })

  it('CSS contains :root with CSS variables', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      baseDocOptions
    )

    expect(result.css).toContain(':root')
    expect(result.css).toContain('--')
  })

  it('cssVariables object contains CSS variable keys', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      baseDocOptions
    )

    const keys = Object.keys(result.cssVariables)
    expect(keys.length).toBeGreaterThan(0)
    expect(keys.some(k => k.startsWith('--'))).toBe(true)
  })

  it('with fontsURL, includes Google Fonts link tag', () => {
    const fontsURL = 'https://fonts.googleapis.com/css2?family=Inter&display=swap'
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: true, fontsURL }
    )

    expect(result.html).toContain(`href="${fontsURL}"`)
    expect(result.html).toContain('fonts.googleapis.com')
    expect(result.html).toContain('fonts.gstatic.com')
  })

  it('without fontsURL, no Google Fonts link tags', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: true }
    )

    expect(result.html).not.toContain('fonts.googleapis.com')
    expect(result.html).not.toContain('fonts.gstatic.com')
  })

  it('fullDocument=true includes title from frontmatter name', () => {
    const result = generateCVDocument(
      makeParsedContent({ frontmatter: { name: 'Alice', email: 'a@b.com' } }),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, fullDocument: true }
    )

    expect(result.html).toContain('<title>Alice</title>')
  })

  it('columnBreaks=css includes background divs', () => {
    const result = generateCVDocument(
      makeParsedContent(),
      DEFAULT_TEMPLATE_CONFIG,
      { ...baseDocOptions, columnBreaks: 'css' }
    )

    expect(result.html).toContain('bg-sidebar')
    expect(result.html).toContain('bg-main')
  })
})

// ─── generateTwoColumnBody ────────────────────────────────────────────────────

describe('generateTwoColumnBody', () => {
  it('returns HTML with sidebar-container and main-content divs', () => {
    const html = generateTwoColumnBody(
      baseFrontmatter,
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('sidebar-container')
    expect(html).toContain('main-content')
  })

  it('contains cv-name with frontmatter name', () => {
    const html = generateTwoColumnBody(
      { name: 'John Smith', email: 'john@test.com' },
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('cv-name')
    expect(html).toContain('John Smith')
  })

  it('contains job-title when frontmatter has title', () => {
    const html = generateTwoColumnBody(
      { name: 'Test', email: 'test@test.com', title: 'Software Engineer' },
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('job-title')
    expect(html).toContain('Software Engineer')
  })

  it('omits job-title when frontmatter has no title', () => {
    const html = generateTwoColumnBody(
      { name: 'Test', email: 'test@test.com' },
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).not.toContain('job-title')
  })

  it('renders sidebar sections inside sidebar-container', () => {
    const sidebarSections: CVSection[] = [
      makeSection({ type: 'skills', title: 'Skills' }),
    ]

    const html = generateTwoColumnBody(
      baseFrontmatter,
      sidebarSections,
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    // Skills section should appear in the output
    expect(html).toContain('Skills')
    expect(html).toContain('sidebar-container')
  })

  it('escapes HTML special characters in name', () => {
    const html = generateTwoColumnBody(
      { name: '<script>alert("xss")</script>', email: 'x@x.com' },
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('contains name-divider element', () => {
    const html = generateTwoColumnBody(
      baseFrontmatter,
      [],
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('name-divider')
  })
})

// ─── generateSingleColumnBody ─────────────────────────────────────────────────

describe('generateSingleColumnBody', () => {
  it('returns HTML with single-column-layout class', () => {
    const html = generateSingleColumnBody(
      baseFrontmatter,
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('single-column-layout')
  })

  it('contains header HTML from frontmatter', () => {
    const html = generateSingleColumnBody(
      { name: 'Jane Doe', email: 'jane@test.com' },
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('Jane Doe')
    expect(html).toContain('jane@test.com')
  })

  it('contains cv-content wrapper', () => {
    const html = generateSingleColumnBody(
      baseFrontmatter,
      [],
      DEFAULT_TEMPLATE_CONFIG
    )

    expect(html).toContain('cv-content')
  })
})

// ─── generateBackgroundHTML ───────────────────────────────────────────────────

describe('generateBackgroundHTML', () => {
  it('returns HTML with sidebar-bg and main-bg divs', () => {
    const html = generateBackgroundHTML('#f0f0f0', '#ffffff')

    expect(html).toContain('sidebar-bg')
    expect(html).toContain('main-bg')
  })

  it('uses provided sidebar color for background', () => {
    const html = generateBackgroundHTML('#abcdef', '#ffffff')

    expect(html).toContain('background: #abcdef')
  })

  it('uses provided main color for background', () => {
    const html = generateBackgroundHTML('#f0f0f0', '#112233')

    expect(html).toContain('background: #112233')
  })

  it('returns a complete HTML document', () => {
    const html = generateBackgroundHTML('#000', '#fff')

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html>')
    expect(html).toContain('<body>')
    expect(html).toContain('</html>')
  })

  it('sets correct A4 dimensions', () => {
    const html = generateBackgroundHTML('#000', '#fff')

    expect(html).toContain('210mm')
    expect(html).toContain('297mm')
  })
})

// ─── renderSkillsSection ──────────────────────────────────────────────────────

describe('renderSkillsSection', () => {
  it('renders pill-style tags by default', () => {
    const section = makeSection({
      type: 'skills',
      title: 'Skills',
      content: [{ category: 'Languages', skills: ['JavaScript', 'TypeScript'] }],
    })

    const html = renderSkillsSection(section, DEFAULT_TEMPLATE_CONFIG)

    expect(html).toContain('skill-tag')
    expect(html).toContain('JavaScript')
    expect(html).toContain('TypeScript')
  })

  it('renders inline style when config specifies inline', () => {
    const config = {
      ...DEFAULT_TEMPLATE_CONFIG,
      components: {
        ...DEFAULT_TEMPLATE_CONFIG.components,
        tags: {
          ...DEFAULT_TEMPLATE_CONFIG.components.tags,
          style: 'inline' as const,
          separator: '|' as const,
        },
      },
    }

    const section = makeSection({
      type: 'skills',
      title: 'Skills',
      content: [{ category: 'Languages', skills: ['JS', 'TS'] }],
    })

    const html = renderSkillsSection(section, config)

    expect(html).toContain('skill-inline')
    expect(html).toContain('JS')
    expect(html).toContain('|')
  })

  it('renders category title', () => {
    const section = makeSection({
      type: 'skills',
      title: 'Skills',
      content: [{ category: 'Frontend', skills: ['React'] }],
    })

    const html = renderSkillsSection(section, DEFAULT_TEMPLATE_CONFIG)

    expect(html).toContain('skill-category-title')
    expect(html).toContain('Frontend')
  })

  it('parses string content in "Category: skill1, skill2" format', () => {
    const section = makeSection({
      type: 'skills',
      title: 'Skills',
      content: ['Backend: Node.js, Python, Go'],
    })

    const html = renderSkillsSection(section, DEFAULT_TEMPLATE_CONFIG)

    expect(html).toContain('Backend')
    expect(html).toContain('Node.js')
    expect(html).toContain('Python')
  })

  it('wraps output in cv-section with data-type="skills"', () => {
    const section = makeSection({
      type: 'skills',
      title: 'Technical Skills',
      content: [],
    })

    const html = renderSkillsSection(section, DEFAULT_TEMPLATE_CONFIG)

    expect(html).toContain('data-type="skills"')
    expect(html).toContain('section-header')
    expect(html).toContain('Technical Skills')
  })
})

// ─── generateCVCSS ────────────────────────────────────────────────────────────

describe('generateCVCSS', () => {
  it('generates CSS with :root CSS variables', () => {
    const css = generateCVCSS(DEFAULT_TEMPLATE_CONFIG)

    expect(css).toContain(':root')
    expect(css).toContain('--')
  })

  it('includes two-column CSS by default', () => {
    const css = generateCVCSS(DEFAULT_TEMPLATE_CONFIG)

    // Two-column layout CSS should be included
    expect(css.length).toBeGreaterThan(100)
  })

  it('omits two-column CSS when includeTwoColumn is false', () => {
    const cssWith = generateCVCSS(DEFAULT_TEMPLATE_CONFIG, { includeTwoColumn: true })
    const cssWithout = generateCVCSS(DEFAULT_TEMPLATE_CONFIG, { includeTwoColumn: false })

    // Without two-column, the CSS should be shorter
    expect(cssWithout.length).toBeLessThan(cssWith.length)
  })

  it('includes custom CSS from config when includeCustomCSS is true', () => {
    const config: TemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      advanced: {
        ...DEFAULT_TEMPLATE_CONFIG.advanced,
        customCSS: '.my-custom-class { color: red; }',
      },
    }

    const css = generateCVCSS(config, { includeCustomCSS: true })

    expect(css).toContain('.my-custom-class')
    expect(css).toContain('color: red')
  })

  it('excludes custom CSS when includeCustomCSS is false', () => {
    const config: TemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      advanced: {
        ...DEFAULT_TEMPLATE_CONFIG.advanced,
        customCSS: '.should-not-appear { display: none; }',
      },
    }

    const css = generateCVCSS(config, { includeCustomCSS: false })

    expect(css).not.toContain('.should-not-appear')
  })
})
