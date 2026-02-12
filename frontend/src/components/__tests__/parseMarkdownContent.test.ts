import { describe, it, expect } from 'vitest'
import { parseMarkdownContent, inferSectionType } from '../parseMarkdownContent'

describe('parseMarkdownContent', () => {
  describe('frontmatter parsing', () => {
    it('parses frontmatter from YAML between --- markers', () => {
      const content = `---
name: John Doe
email: john@example.com
phone: +1 555-1234
location: New York
---

## Experience
Some content here`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.name).toBe('John Doe')
      expect(result.frontmatter.email).toBe('john@example.com')
      expect(result.frontmatter.phone).toBe('+1 555-1234')
      expect(result.frontmatter.location).toBe('New York')
    })

    it('returns empty frontmatter defaults when no frontmatter is present', () => {
      const content = 'Just some plain text without any structure.'
      const result = parseMarkdownContent(content)
      expect(result.frontmatter.name).toBe('')
      expect(result.frontmatter.email).toBe('')
    })

    it('extracts name from H1 when no frontmatter', () => {
      const content = `# Jane Smith

## Experience
Did some things`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.name).toBe('Jane Smith')
    })

    it('extracts email from content when no frontmatter', () => {
      const content = `# Jane Smith
Contact: jane@example.com

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.email).toBe('jane@example.com')
    })

    it('extracts phone from content with phone: prefix when no frontmatter', () => {
      const content = `# Jane Smith
phone: +46 70 123 4567

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.phone).toBe('+46 70 123 4567')
    })

    it('extracts phone from content with emoji prefix when no frontmatter', () => {
      const content = `# Jane Smith
📱 +46 70 123 4567

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.phone).toBe('+46 70 123 4567')
    })

    it('extracts location from content with location: prefix when no frontmatter', () => {
      const content = `# Jane Smith
location: Stockholm

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.location).toBe('Stockholm')
    })

    it('extracts location from content with emoji prefix when no frontmatter', () => {
      const content = `# Jane Smith
📍 Gothenburg

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.location).toBe('Gothenburg')
    })

    it('extracts photo URL from ![Profile](url) syntax', () => {
      const content = `# Jane Smith
![Profile](https://example.com/photo.jpg)

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.photo).toBe('https://example.com/photo.jpg')
    })

    it('extracts photo URL from ![Photo](url) syntax', () => {
      const content = `# Jane Smith
![Photo](/images/headshot.png)

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.photo).toBe('/images/headshot.png')
    })

    it('handles frontmatter with colon in value (e.g., URLs)', () => {
      const content = `---
name: John Doe
email: john@example.com
website: https://example.com
---

## Summary
Hello`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.website).toBe('https://example.com')
    })
  })

  describe('section parsing', () => {
    it('splits sections by ## headings', () => {
      const content = `---
name: Test
email: test@test.com
---

## Summary
A brief summary.

## Experience
Some experience.

## Education
Some education.`

      const result = parseMarkdownContent(content)
      expect(result.sections).toHaveLength(3)
    })

    it('returns sections with correct title and type', () => {
      const content = `---
name: Test
email: test@test.com
---

## Work Experience
Did some work.

## Education
Studied something.`

      const result = parseMarkdownContent(content)
      expect(result.sections[0].title).toBe('Work Experience')
      expect(result.sections[0].type).toBe('experience')
      expect(result.sections[1].title).toBe('Education')
      expect(result.sections[1].type).toBe('education')
    })

    it('returns empty sections for content without ## headings', () => {
      const content = `---
name: Test
email: test@test.com
---

Just some paragraphs of text without any section headings.`

      const result = parseMarkdownContent(content)
      expect(result.sections).toHaveLength(0)
    })

    it('handles <!-- break --> markers as breakBefore sections', () => {
      const content = `---
name: Test
email: test@test.com
---

## Experience
Some experience content.

<!-- break -->

## Education
Some education content.`

      const result = parseMarkdownContent(content)
      // The break marker appears before ## Education, so it is within the Experience section text
      // After splitting by ##, the "Education" block contains <!-- break -->
      // Actually, the break is between sections in the raw markdown.
      // Let's verify what the parser produces:
      const breakSections = result.sections.filter((s) => s.breakBefore === true)
      expect(breakSections.length).toBeGreaterThanOrEqual(1)
    })

    it('creates a breakBefore section from <!-- break --> inside a ## section', () => {
      const content = `---
name: Test
email: test@test.com
---

## Experience
Some experience.
<!-- break -->
More experience after break.`

      const result = parseMarkdownContent(content)
      const breakSection = result.sections.find((s) => s.breakBefore === true)
      expect(breakSection).toBeDefined()
      expect(breakSection!.type).toBe('paragraph')
      expect(breakSection!.title).toBe('')
    })

    it('sets level to 2 for all regular sections', () => {
      const content = `---
name: Test
email: test@test.com
---

## Skills
JavaScript, TypeScript`

      const result = parseMarkdownContent(content)
      expect(result.sections[0].level).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('handles empty string input', () => {
      const result = parseMarkdownContent('')
      expect(result.frontmatter.name).toBe('')
      expect(result.frontmatter.email).toBe('')
      expect(result.sections).toHaveLength(0)
    })

    it('handles content with only frontmatter (no sections)', () => {
      const content = `---
name: John Doe
email: john@example.com
---`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.name).toBe('John Doe')
      expect(result.frontmatter.email).toBe('john@example.com')
      expect(result.sections).toHaveLength(0)
    })

    it('handles content with only sections (no frontmatter)', () => {
      const content = `## Summary
A professional summary.

## Skills
JavaScript, TypeScript`

      const result = parseMarkdownContent(content)
      expect(result.frontmatter.name).toBe('')
      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].type).toBe('summary')
      expect(result.sections[1].type).toBe('skills')
    })
  })
})

describe('inferSectionType', () => {
  it("maps 'Experience' to 'experience'", () => {
    expect(inferSectionType('Experience')).toBe('experience')
  })

  it("maps 'Work History' to 'experience' (contains 'work')", () => {
    expect(inferSectionType('Work History')).toBe('experience')
  })

  it("maps 'Education' to 'education'", () => {
    expect(inferSectionType('Education')).toBe('education')
  })

  it("maps 'Skills' to 'skills'", () => {
    expect(inferSectionType('Skills')).toBe('skills')
  })

  it("maps 'Projects' to 'projects'", () => {
    expect(inferSectionType('Projects')).toBe('projects')
  })

  it("maps 'Languages' to 'languages'", () => {
    expect(inferSectionType('Languages')).toBe('languages')
  })

  it("maps 'Certifications' to 'certifications'", () => {
    expect(inferSectionType('Certifications')).toBe('certifications')
  })

  it("maps 'Interests' to 'interests'", () => {
    expect(inferSectionType('Interests')).toBe('interests')
  })

  it("maps 'Hobbies' to 'interests'", () => {
    expect(inferSectionType('Hobbies')).toBe('interests')
  })

  it("maps 'References' to 'references'", () => {
    expect(inferSectionType('References')).toBe('references')
  })

  it("maps 'Summary' to 'summary'", () => {
    expect(inferSectionType('Summary')).toBe('summary')
  })

  it("maps 'About Me' to 'summary'", () => {
    expect(inferSectionType('About Me')).toBe('summary')
  })

  it("maps 'Unknown Section' to 'paragraph' (fallback)", () => {
    expect(inferSectionType('Unknown Section')).toBe('paragraph')
  })
})

describe('structured entries (experience/education sections)', () => {
  it('parses ### sub-headings as entry titles', () => {
    const content = `---
name: Test
email: test@test.com
---

## Experience

### Software Engineer
*2020 - 2023*
Built cool stuff.`

    const result = parseMarkdownContent(content)
    const entries = result.sections[0].content as any[]
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('Software Engineer')
  })

  it('splits "Title | Company" format', () => {
    const content = `---
name: Test
email: test@test.com
---

## Experience

### Software Engineer | Acme Corp
*2020 - 2023*
Built things.`

    const result = parseMarkdownContent(content)
    const entries = result.sections[0].content as any[]
    expect(entries[0].title).toBe('Software Engineer')
    expect(entries[0].company).toBe('Acme Corp')
  })

  it('splits "Title at Company" format', () => {
    const content = `---
name: Test
email: test@test.com
---

## Experience

### Software Engineer at Google
*2020 - 2023*
Built things.`

    const result = parseMarkdownContent(content)
    const entries = result.sections[0].content as any[]
    expect(entries[0].title).toBe('Software Engineer')
    expect(entries[0].company).toBe('Google')
  })

  it('handles plain title without separator', () => {
    const content = `---
name: Test
email: test@test.com
---

## Experience

### Freelance Developer
*2020 - 2023*
Did freelance work.`

    const result = parseMarkdownContent(content)
    const entries = result.sections[0].content as any[]
    expect(entries[0].title).toBe('Freelance Developer')
    expect(entries[0].company).toBe('')
  })

  it('extracts date lines matching year patterns', () => {
    const content = `---
name: Test
email: test@test.com
---

## Experience

### Developer | Startup Inc
*Jan 2020 - Dec 2023*
Built an app.`

    const result = parseMarkdownContent(content)
    const entries = result.sections[0].content as any[]
    expect(entries[0].date).toBe('Jan 2020 - Dec 2023')
  })

  it('parses education entries the same way as experience', () => {
    const content = `---
name: Test
email: test@test.com
---

## Education

### BSc Computer Science | University of Example
*2016 - 2020*
Graduated with honors.`

    const result = parseMarkdownContent(content)
    expect(result.sections[0].type).toBe('education')
    const entries = result.sections[0].content as any[]
    expect(entries[0].title).toBe('BSc Computer Science')
    expect(entries[0].company).toBe('University of Example')
    expect(entries[0].date).toBe('2016 - 2020')
  })
})

describe('skills parsing', () => {
  it('parses "**Category:** skill1, skill2" format', () => {
    const content = `---
name: Test
email: test@test.com
---

## Skills

**Frontend**: React, Vue, Angular
**Backend**: Node.js, Express`

    const result = parseMarkdownContent(content)
    const skills = result.sections[0].content as any[]
    expect(skills).toHaveLength(2)
    expect(skills[0].category).toBe('Frontend')
    expect(skills[0].skills).toEqual(['React', 'Vue', 'Angular'])
    expect(skills[1].category).toBe('Backend')
    expect(skills[1].skills).toEqual(['Node.js', 'Express'])
  })

  it('parses "Category: skill1, skill2" format (without bold)', () => {
    const content = `---
name: Test
email: test@test.com
---

## Skills

Frontend: React, Vue, Angular`

    const result = parseMarkdownContent(content)
    const skills = result.sections[0].content as any[]
    expect(skills).toHaveLength(1)
    expect(skills[0].category).toBe('Frontend')
    expect(skills[0].skills).toEqual(['React', 'Vue', 'Angular'])
  })

  it('handles category with skills on next line', () => {
    const content = `---
name: Test
email: test@test.com
---

## Skills

**Programming**
JavaScript, TypeScript, Python`

    const result = parseMarkdownContent(content)
    const skills = result.sections[0].content as any[]
    expect(skills).toHaveLength(1)
    expect(skills[0].category).toBe('Programming')
    expect(skills[0].skills).toEqual(['JavaScript', 'TypeScript', 'Python'])
  })

  it('returns fallback { category: "Skills", skills: lines } when no categories found', () => {
    const content = `---
name: Test
email: test@test.com
---

## Skills

JavaScript
TypeScript
Python`

    const result = parseMarkdownContent(content)
    const skills = result.sections[0].content as any[]
    expect(skills).toHaveLength(1)
    expect(skills[0].category).toBe('Skills')
    expect(skills[0].skills).toEqual(['JavaScript', 'TypeScript', 'Python'])
  })
})
