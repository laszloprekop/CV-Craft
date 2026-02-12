/**
 * CV Parser Library Tests
 */

import { CVParser, parseCV, validateCVContent, CVParserError } from './index';

describe('CV Parser Library', () => {
  const sampleCV = `---
name: John Doe
email: john.doe@example.com
phone: +1-555-012-3456
location: San Francisco, CA
website: https://johndoe.dev
---

# John Doe
**Software Engineer**

## Professional Summary
Experienced software engineer with 5+ years developing scalable applications.

## Experience

### Senior Software Engineer | Tech Corp
*January 2020 - Present*

- Led development of customer-facing applications
- Mentored junior developers

## Skills
- JavaScript, TypeScript, React
- Node.js, Express.js, PostgreSQL
`;

  describe('parseCV function', () => {
    test('should parse valid CV content successfully', async () => {
      const result = await parseCV(sampleCV);
      
      expect(result).toHaveProperty('frontmatter');
      expect(result).toHaveProperty('sections');
      
      // Validate frontmatter
      expect(result.frontmatter.name).toBe('John Doe');
      expect(result.frontmatter.email).toBe('john.doe@example.com');
      expect(result.frontmatter.phone).toBe('+1-555-012-3456');
      expect(result.frontmatter.location).toBe('San Francisco, CA');
      expect(result.frontmatter.website).toBe('https://johndoe.dev');
      
      // Validate sections (H2-level sections from markdown)
      expect(result.sections.length).toBeGreaterThan(0);
      const titles = result.sections.map((s: any) => s.title);
      expect(titles).toContain('Professional Summary');
      expect(titles).toContain('Experience');
      expect(titles).toContain('Skills');
    });

    test('should parse content without frontmatter by extracting from body', async () => {
      const noFrontmatterCV = `
# John Doe
Content without frontmatter
`;

      const result = await parseCV(noFrontmatterCV);
      // Parser falls back to extracting contact info from content
      expect(result).toHaveProperty('frontmatter');
      expect(result.frontmatter.name).toBe('John Doe');
    });

    test('should accept frontmatter without email (email is optional)', async () => {
      const partialCV = `---
name: John Doe
---

# John Doe
Content
`;

      const result = await parseCV(partialCV);
      expect(result.frontmatter.name).toBe('John Doe');
      expect(result.frontmatter.email).toBeUndefined();
    });
  });

  describe('validateCVContent function', () => {
    test('should validate correct CV content', () => {
      const result = validateCVContent(sampleCV);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing name', () => {
      const invalidCV = `---
email: test@example.com
---
Content`;

      const result = validateCVContent(invalidCV);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Frontmatter must include a valid "name" field');
    });

    test('should detect invalid email', () => {
      const invalidCV = `---
name: Test User
email: invalid-email
---
Content`;

      const result = validateCVContent(invalidCV);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email format is invalid');
    });
  });
});