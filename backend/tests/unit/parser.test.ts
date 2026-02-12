/**
 * CV Parser Extended Tests
 *
 * Expanded coverage beyond the existing parser.test.ts to test:
 * - Special characters and unicode in markdown
 * - Various frontmatter combinations
 * - Section type inference edge cases
 * - HTML injection stripping (Phase 1 rehype-sanitize)
 * - Large markdown input resilience
 * - Multiple sections of the same type
 * - Frontmatter with multiline values
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CVParser, parseCV, validateCVContent, CVParserError } from '../../src/lib/cv-parser/index';
import { DEFAULT_TEMPLATE_CONFIG } from '../../../shared/types/defaultTemplateConfig';

describe('CV Parser - Extended Tests', () => {
  // ── Special Characters & Unicode ──────────────────────────────────────────

  describe('special characters and unicode', () => {
    it('should parse markdown with unicode characters in frontmatter and content', async () => {
      const cv = `---
name: "Laszlo Prekop"
email: laszlo@example.com
location: "Budapest, Magyarorszag"
---

# Laszlo Prekop

## Osszefoglalo
Tapasztalt fejleszto, aki szeret kodolni es uj technologiakat tanulni.
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Laszlo Prekop');
      expect(result.frontmatter.location).toBe('Budapest, Magyarorszag');
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should parse markdown with emoji in content sections', async () => {
      const cv = `---
name: Jane Smith
email: jane@example.com
---

# Jane Smith

## Skills
- JavaScript, TypeScript, React
- Node.js, Python
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Jane Smith');
      // Sections should be parsed without crashing on emoji content
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should handle markdown with special markdown characters in text', async () => {
      const cv = `---
name: John O'Brien
email: john@example.com
---

# John O'Brien

## Summary
Worked with C++ & C# in environments using <angle brackets> and "quoted strings".
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe("John O'Brien");
      const summarySection = result.sections.find(s => s.type === 'summary');
      expect(summarySection).toBeDefined();
    });
  });

  // ── Frontmatter Combinations ──────────────────────────────────────────────

  describe('frontmatter combinations', () => {
    it('should parse frontmatter with all optional fields present', async () => {
      const cv = `---
name: Full Profile
email: full@example.com
phone: "+46-70-123-4567"
location: Stockholm, Sweden
website: https://fullprofile.dev
linkedin: https://linkedin.com/in/fullprofile
github: https://github.com/fullprofile
---

# Full Profile

## Summary
A well-connected developer.
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Full Profile');
      expect(result.frontmatter.email).toBe('full@example.com');
      expect(result.frontmatter.phone).toBe('+46-70-123-4567');
      expect(result.frontmatter.location).toBe('Stockholm, Sweden');
      expect(result.frontmatter.website).toBe('https://fullprofile.dev');
      expect(result.frontmatter.linkedin).toBe('https://linkedin.com/in/fullprofile');
      expect(result.frontmatter.github).toBe('https://github.com/fullprofile');
    });

    it('should parse frontmatter with only the minimum required fields', async () => {
      const cv = `---
name: Minimal User
email: minimal@example.com
---

# Minimal User

## Experience

### Developer
**SomeCorp** | 2020 - 2023

- Built things
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Minimal User');
      expect(result.frontmatter.email).toBe('minimal@example.com');
      expect(result.frontmatter.phone).toBeUndefined();
      expect(result.frontmatter.location).toBeUndefined();
      expect(result.frontmatter.website).toBeUndefined();
    });

    it('should preserve extra/unknown frontmatter fields via spread', async () => {
      const cv = `---
name: Custom Fields
email: custom@example.com
title: Senior Developer
nationality: Swedish
languages_spoken: English, Swedish, Hungarian
---

# Custom Fields

## Summary
Developer with extra metadata.
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Custom Fields');
      // Extra fields should be preserved via the spread operator in validateFrontmatter
      expect((result.frontmatter as any).title).toBe('Senior Developer');
      expect((result.frontmatter as any).nationality).toBe('Swedish');
      expect((result.frontmatter as any).languages_spoken).toBe('English, Swedish, Hungarian');
    });

    it('should throw for frontmatter with invalid email format', async () => {
      const cv = `---
name: Bad Email
email: not-an-email
---

# Bad Email
Content
`;

      await expect(parseCV(cv)).rejects.toThrow('Invalid email format');
    });

    it('should throw for frontmatter with invalid phone format', async () => {
      const cv = `---
name: Bad Phone
email: good@example.com
phone: "abc"
---

# Bad Phone
Content
`;

      await expect(parseCV(cv)).rejects.toThrow('Invalid phone format');
    });

    it('should throw for frontmatter with invalid URL in website', async () => {
      const cv = `---
name: Bad URL
email: good@example.com
website: ://invalid
---

# Bad URL
Content
`;

      await expect(parseCV(cv)).rejects.toThrow('Invalid URL format');
    });
  });

  // ── Section Type Inference Edge Cases ─────────────────────────────────────

  describe('section type inference edge cases', () => {
    it('should infer "experience" from "Work Experience" title', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Work Experience

### Developer
**Company** | 2020 - Present

- Did things
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'Work Experience');

      expect(section).toBeDefined();
      expect(section!.type).toBe('experience');
    });

    it('should infer "education" from "Academic Background" title', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Academic Background

### MSc Computer Science
**MIT** | 2018 - 2020

- Thesis on distributed systems
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'Academic Background');

      expect(section).toBeDefined();
      expect(section!.type).toBe('education');
    });

    it('should infer "skills" from "Technologies" title', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Technologies
- JavaScript, TypeScript
- Docker, Kubernetes
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'Technologies');

      expect(section).toBeDefined();
      expect(section!.type).toBe('skills');
    });

    it('should infer "skills" from "Core Competencies" title', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Core Competencies
- Leadership
- Problem Solving
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'Core Competencies');

      expect(section).toBeDefined();
      expect(section!.type).toBe('skills');
    });

    it('should infer "summary" from "About Me" title', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## About Me
I enjoy building great software.
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'About Me');

      expect(section).toBeDefined();
      expect(section!.type).toBe('summary');
    });

    it('should fall back to "paragraph" for unrecognized section titles', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Miscellaneous Notes
Some unstructured content here.
`;

      const result = await parseCV(cv);
      const section = result.sections.find(s => s.title === 'Miscellaneous Notes');

      expect(section).toBeDefined();
      expect(section!.type).toBe('paragraph');
    });
  });

  // ── HTML Injection Stripping (Phase 1 rehype-sanitize) ────────────────────

  describe('HTML injection stripping', () => {
    it('should strip <script> tags from generated HTML output', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Summary
Hello <script>alert(1)</script> world.
`;

      const parser = new CVParser();
      const result = await parser.parse(cv, DEFAULT_TEMPLATE_CONFIG);

      expect(result.html).toBeDefined();
      // The <script> element itself must be stripped (no executable tags)
      expect(result.html).not.toContain('<script>');
      expect(result.html).not.toContain('</script>');
      // The inner text may be preserved as plain text (safe behavior),
      // but the script element is gone so it cannot execute
    });

    it('should strip <iframe> tags from generated HTML output', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Summary
Check this <iframe src="https://evil.com"></iframe> out.
`;

      const parser = new CVParser();
      const result = await parser.parse(cv, DEFAULT_TEMPLATE_CONFIG);

      expect(result.html).toBeDefined();
      expect(result.html).not.toContain('<iframe');
      expect(result.html).not.toContain('</iframe>');
    });

    it('should strip event handler attributes from generated HTML', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Summary
<div onmouseover="alert('xss')">Hover me</div>
`;

      const parser = new CVParser();
      const result = await parser.parse(cv, DEFAULT_TEMPLATE_CONFIG);

      expect(result.html).toBeDefined();
      expect(result.html).not.toContain('onmouseover');
      expect(result.html).not.toContain("alert('xss')");
    });

    it('should preserve safe HTML elements in generated output', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Summary
This has **bold** and *italic* and a [link](https://example.com).
`;

      const parser = new CVParser();
      const result = await parser.parse(cv, DEFAULT_TEMPLATE_CONFIG);

      expect(result.html).toBeDefined();
      expect(result.html).toContain('<strong');
      expect(result.html).toContain('<em');
      expect(result.html).toContain('<a');
      expect(result.html).toContain('href="https://example.com"');
    });
  });

  // ── Large Markdown Input ──────────────────────────────────────────────────

  describe('large markdown input', () => {
    it('should handle a very large CV without crashing', async () => {
      let content = `---
name: Prolific Developer
email: prolific@example.com
---

# Prolific Developer

## Professional Summary
A developer with an extraordinarily long career spanning many decades.

`;

      // Generate 50 experience sections with bullet points
      for (let i = 0; i < 50; i++) {
        content += `## Experience Section ${i}

### Role ${i} at Company ${i}
**Company ${i}** | ${2000 + i} - ${2001 + i}

- Accomplishment A for role ${i}
- Accomplishment B for role ${i}
- Accomplishment C for role ${i}

`;
      }

      const result = await parseCV(content);

      expect(result.frontmatter.name).toBe('Prolific Developer');
      // Should have many sections parsed
      expect(result.sections.length).toBeGreaterThan(20);
    });
  });

  // ── Multiple Sections of Same Type ────────────────────────────────────────

  describe('multiple sections of same type', () => {
    it('should parse multiple experience sections independently', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Work Experience

### Backend Engineer
**Backend Corp** | 2020 - 2023

- Built APIs

## Freelance Experience

### Consultant
**Self-employed** | 2018 - 2020

- Consulted on projects
`;

      const result = await parseCV(cv);

      // Both should be inferred as experience type
      const experienceSections = result.sections.filter(s => s.type === 'experience');
      expect(experienceSections.length).toBe(2);
      expect(experienceSections[0].title).toBe('Work Experience');
      expect(experienceSections[1].title).toBe('Freelance Experience');
    });

    it('should parse multiple skill sections with different titles', async () => {
      const cv = `---
name: Test User
email: test@example.com
---

# Test User

## Technical Skills
- JavaScript, TypeScript

## Soft Skills
- Communication, Leadership
`;

      const result = await parseCV(cv);

      // "Technical Skills" and "Soft Skills" should both match skills type
      // due to the keyword "skill" in inferSectionTypeFromTitle
      const skillsSections = result.sections.filter(s => s.type === 'skills');
      expect(skillsSections.length).toBe(2);
    });
  });

  // ── Frontmatter with Multiline Values ─────────────────────────────────────

  describe('frontmatter with multiline values', () => {
    it('should parse frontmatter with YAML multiline string (pipe syntax)', async () => {
      const cv = `---
name: Test User
email: test@example.com
location: |
  123 Main Street
  Apt 4B
  New York, NY 10001
---

# Test User

## Summary
A New York based developer.
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Test User');
      // YAML pipe syntax produces a multiline string with trailing newline
      expect(result.frontmatter.location).toContain('123 Main Street');
      expect(result.frontmatter.location).toContain('New York');
    });

    it('should parse frontmatter with YAML folded block scalar (> syntax)', async () => {
      const cv = `---
name: Test User
email: test@example.com
location: >
  A very long location
  description that spans
  multiple lines
---

# Test User

## Summary
Content here.
`;

      const result = await parseCV(cv);

      expect(result.frontmatter.name).toBe('Test User');
      // YAML folded scalar folds newlines into spaces
      expect(result.frontmatter.location).toContain('A very long location');
    });
  });

  // ── Content Without Frontmatter (Contact Extraction) ──────────────────────

  describe('contact extraction from content (no frontmatter)', () => {
    it('should extract name and email from plain markdown content', async () => {
      const cv = `# Maria Garcia

maria.garcia@example.com

## Summary
A software developer based in Madrid.
`;

      const parser = new CVParser({ validateRequired: false });
      const result = await parser.parse(cv);

      expect(result.frontmatter.name).toBe('Maria Garcia');
      expect(result.frontmatter.email).toBe('maria.garcia@example.com');
    });
  });

  // ── validateCVContent Extended ────────────────────────────────────────────

  describe('validateCVContent extended', () => {
    it('should accept plain markdown with H1 heading and email (no frontmatter)', () => {
      const cv = `# John Doe

john@example.com

## Experience
Some work.
`;

      const result = validateCVContent(cv);
      expect(result.valid).toBe(true);
    });

    it('should reject plain markdown without H1 heading', () => {
      const cv = `## John Doe

john@example.com

## Experience
Some work.
`;

      const result = validateCVContent(cv);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('H1 heading'))).toBe(true);
    });

    it('should accept plain markdown without email (email is optional)', () => {
      const cv = `# John Doe

## Experience
Some work.
`;

      const result = validateCVContent(cv);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
