import { describe, it, expect } from 'vitest'
import { renderInlineMarkdown, renderHeader, renderSections } from '../sectionRenderer'
import type { CVSection, CVFrontmatter } from '../../types'

// ─── renderInlineMarkdown ────────────────────────────────────────────────────

describe('renderInlineMarkdown', () => {
  describe('bold', () => {
    it('converts **text** to <strong>', () => {
      expect(renderInlineMarkdown('**bold**')).toBe('<strong>bold</strong>')
    })

    it('converts __text__ to <strong>', () => {
      expect(renderInlineMarkdown('__bold__')).toBe('<strong>bold</strong>')
    })
  })

  describe('italic', () => {
    it('converts *text* to <em>', () => {
      expect(renderInlineMarkdown('*italic*')).toBe('<em>italic</em>')
    })

    it('converts _text_ to <em>', () => {
      expect(renderInlineMarkdown('_italic_')).toBe('<em>italic</em>')
    })
  })

  describe('inline code', () => {
    it('converts `code` to <code>', () => {
      expect(renderInlineMarkdown('`code`')).toBe('<code>code</code>')
    })
  })

  describe('links', () => {
    it('converts [text](url) to <a> tag', () => {
      expect(renderInlineMarkdown('[click](https://example.com)')).toBe(
        '<a href="https://example.com">click</a>'
      )
    })

    it('sanitizes javascript: URLs to #', () => {
      expect(renderInlineMarkdown('[xss](javascript:void)')).toBe(
        '<a href="#">xss</a>'
      )
    })

    it('allows mailto: links', () => {
      expect(renderInlineMarkdown('[email](mailto:a@b.com)')).toBe(
        '<a href="mailto:a@b.com">email</a>'
      )
    })
  })

  describe('nested formatting', () => {
    it('handles **bold *italic*** (bold wrapping italic)', () => {
      const result = renderInlineMarkdown('**bold *italic***')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('italic')
    })
  })

  describe('HTML escaping', () => {
    it('escapes <script> tags', () => {
      const result = renderInlineMarkdown('<script>alert(1)</script>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('escapes & character', () => {
      expect(renderInlineMarkdown('A & B')).toBe('A &amp; B')
    })

    it('escapes " character', () => {
      expect(renderInlineMarkdown('say "hi"')).toBe('say &quot;hi&quot;')
    })

    it("escapes ' character", () => {
      expect(renderInlineMarkdown("it's")).toBe('it&#039;s')
    })

    it('escapes < and > characters', () => {
      expect(renderInlineMarkdown('a < b > c')).toBe('a &lt; b &gt; c')
    })
  })

  describe('line breaks', () => {
    it('converts \\n to <br/>', () => {
      expect(renderInlineMarkdown('line1\nline2')).toBe('line1<br/>line2')
    })
  })

  describe('plain text', () => {
    it('returns plain text unchanged (no markdown)', () => {
      expect(renderInlineMarkdown('hello world')).toBe('hello world')
    })
  })
})

// ─── renderHeader ────────────────────────────────────────────────────────────

describe('renderHeader', () => {
  it('renders all frontmatter fields present', () => {
    const fm: CVFrontmatter = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-0100',
      location: 'New York, NY',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      title: 'Senior Developer',
    }
    const html = renderHeader(fm)

    expect(html).toContain('John Doe')
    expect(html).toContain('Senior Developer')
    expect(html).toContain('john@example.com')
    expect(html).toContain('+1 555-0100')
    expect(html).toContain('New York, NY')
    expect(html).toContain('href="https://linkedin.com/in/johndoe"')
    expect(html).toContain('LinkedIn')
    expect(html).toContain('href="https://github.com/johndoe"')
    expect(html).toContain('GitHub')
  })

  it('renders minimal frontmatter (name + email only)', () => {
    const fm: CVFrontmatter = { name: 'Jane Doe', email: 'jane@example.com' }
    const html = renderHeader(fm)

    expect(html).toContain('Jane Doe')
    expect(html).toContain('jane@example.com')
    // Optional fields should not produce filled content
    expect(html).not.toContain('cv-title')
    expect(html).not.toContain('contact-phone')
    expect(html).not.toContain('contact-location')
    expect(html).not.toContain('contact-linkedin')
    expect(html).not.toContain('contact-github')
  })

  it('omits title tag when title is missing', () => {
    const fm: CVFrontmatter = { name: 'No Title', email: 'a@b.com' }
    const html = renderHeader(fm)

    expect(html).not.toContain('cv-title')
  })

  it('escapes HTML in name field', () => {
    const fm: CVFrontmatter = { name: '<b>Hacker</b>', email: 'a@b.com' }
    const html = renderHeader(fm)

    expect(html).not.toContain('<b>Hacker</b>')
    expect(html).toContain('&lt;b&gt;Hacker&lt;/b&gt;')
  })

  it('applies class prefix to all elements', () => {
    const fm: CVFrontmatter = { name: 'Test', email: 'a@b.com', title: 'Dev' }
    const html = renderHeader(fm, 'pdf-')

    expect(html).toContain('class="pdf-cv-header"')
    expect(html).toContain('class="pdf-cv-name"')
    expect(html).toContain('class="pdf-name-divider"')
    expect(html).toContain('class="pdf-cv-title"')
    expect(html).toContain('class="pdf-cv-contact"')
    expect(html).toContain('class="pdf-contact-email"')
  })

  it('defaults to empty prefix when none provided', () => {
    const fm: CVFrontmatter = { name: 'Test', email: 'a@b.com' }
    const html = renderHeader(fm)

    expect(html).toContain('class="cv-header"')
    expect(html).toContain('class="cv-name"')
  })
})

// ─── renderSections ──────────────────────────────────────────────────────────

describe('renderSections', () => {
  it('renders an experience section with entries', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Experience',
        content: [
          {
            title: 'Software Engineer',
            company: 'Acme Corp',
            date: '2020 - Present',
            location: 'Remote',
            description: 'Built things.',
            bullets: ['Led team of 5', 'Shipped v2.0'],
          },
        ],
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain('Experience')
    expect(html).toContain('Software Engineer')
    expect(html).toContain('Acme Corp')
    expect(html).toContain('2020 - Present')
    expect(html).toContain('Remote')
    expect(html).toContain('Built things.')
    expect(html).toContain('Led team of 5')
    expect(html).toContain('Shipped v2.0')
  })

  it('renders a skills section with categories', () => {
    const sections: CVSection[] = [
      {
        type: 'skills',
        title: 'Skills',
        content: [
          { category: 'Languages', skills: ['TypeScript', 'Python'] },
          { category: 'Tools', skills: ['Git', 'Docker'] },
        ],
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain('Skills')
    expect(html).toContain('Languages')
    expect(html).toContain('TypeScript')
    expect(html).toContain('Python')
    expect(html).toContain('Tools')
    expect(html).toContain('Git')
    expect(html).toContain('Docker')
    expect(html).toContain('skill-category')
  })

  it('renders a paragraph/text section with string content', () => {
    const sections: CVSection[] = [
      {
        type: 'summary',
        title: 'Summary',
        content: 'I am a **developer** with 10 years of experience.',
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain('Summary')
    expect(html).toContain('<strong>developer</strong>')
    expect(html).toContain('content-text')
  })

  it('renders multiple sections in order', () => {
    const sections: CVSection[] = [
      { type: 'summary', title: 'Summary', content: 'Brief summary.' },
      {
        type: 'experience',
        title: 'Experience',
        content: [
          { title: 'Dev', company: 'Co', bullets: ['Did stuff'] },
        ],
      },
      {
        type: 'skills',
        title: 'Skills',
        content: [{ category: 'Lang', skills: ['JS'] }],
      },
    ]
    const html = renderSections(sections)

    const summaryIdx = html.indexOf('Summary')
    const expIdx = html.indexOf('Experience')
    const skillsIdx = html.indexOf('Skills')

    expect(summaryIdx).toBeLessThan(expIdx)
    expect(expIdx).toBeLessThan(skillsIdx)
  })

  it('returns empty string for empty sections array', () => {
    expect(renderSections([])).toBe('')
  })

  it('renders a break-only section as a forced-break div', () => {
    const sections: CVSection[] = [
      { type: 'paragraph', title: '', content: '', breakBefore: true },
    ]
    const html = renderSections(sections)

    expect(html).toContain('forced-break')
    // Should NOT render a full section wrapper
    expect(html).not.toContain('cv-section')
  })

  it('applies classPrefix to all section elements', () => {
    const sections: CVSection[] = [
      { type: 'summary', title: 'About', content: 'Hello' },
    ]
    const html = renderSections(sections, { classPrefix: 'pdf-' })

    expect(html).toContain('class="pdf-cv-section"')
    expect(html).toContain('class="pdf-section-header"')
    expect(html).toContain('class="pdf-section-content"')
    expect(html).toContain('class="pdf-content-text"')
  })

  it('uses pipe separator by default for entry meta', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Work',
        content: [{ title: 'Dev', company: 'Co', date: '2024', location: 'NY' }],
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain(' | ')
  })

  it('uses dot separator when metaSeparator option is dot', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Work',
        content: [{ title: 'Dev', company: 'Co', date: '2024' }],
      },
    ]
    const html = renderSections(sections, { metaSeparator: 'dot' })

    // The dot separator is ' · '
    expect(html).toContain(' · ')
  })

  it('renders skills as simple strings when not categorized', () => {
    const sections: CVSection[] = [
      {
        type: 'skills',
        title: 'Skills',
        content: ['JavaScript', 'TypeScript'],
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain('skill-item')
    expect(html).toContain('JavaScript')
    expect(html).toContain('TypeScript')
  })

  it('renders newline separator with individual <p> tags per meta item', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Work',
        content: [{ title: 'Dev', company: 'Co', date: '2024', location: 'LA' }],
      },
    ]
    const html = renderSections(sections, { metaSeparator: 'newline' })

    // Each meta item should be its own <p class="entry-meta">
    const metaCount = (html.match(/entry-meta/g) || []).length
    expect(metaCount).toBe(3) // company, date, location each get their own <p>
  })

  it('handles entry with no title gracefully', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Work',
        content: [{ description: 'Did work without a title.' }],
      },
    ]
    const html = renderSections(sections)

    expect(html).toContain('Did work without a title.')
    // Should not contain entry-header since no title
    expect(html).not.toContain('entry-header')
  })

  it('renders pagination classes when pagination option is true', () => {
    const sections: CVSection[] = [
      {
        type: 'experience',
        title: 'Work',
        content: [
          {
            title: 'Dev',
            company: 'Co',
            bullets: ['First bullet', 'Second bullet'],
          },
        ],
      },
    ]
    const html = renderSections(sections, { pagination: true })

    expect(html).toContain('entry-start')
    expect(html).toContain('entry-bullet-bridge')
  })
})

// ─── escapeHtml (tested via renderInlineMarkdown / renderHeader) ─────────────

describe('escapeHtml (via public API)', () => {
  it('escapes < to &lt;', () => {
    expect(renderInlineMarkdown('<')).toBe('&lt;')
  })

  it('escapes > to &gt;', () => {
    expect(renderInlineMarkdown('>')).toBe('&gt;')
  })

  it('escapes & to &amp;', () => {
    expect(renderInlineMarkdown('&')).toBe('&amp;')
  })

  it('escapes " to &quot;', () => {
    expect(renderInlineMarkdown('"')).toBe('&quot;')
  })

  it("escapes ' to &#039;", () => {
    expect(renderInlineMarkdown("'")).toBe('&#039;')
  })
})
