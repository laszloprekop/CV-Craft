/**
 * CV Parser Library Tests
 */

import { CVParser, parseCV, validateCVContent, CVParserError } from './index';

describe('CV Parser Library', () => {
  const sampleCV = `---
name: John Doe
email: john.doe@example.com
phone: +1-555-0123
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
      expect(result.frontmatter.phone).toBe('+1-555-0123');
      expect(result.frontmatter.location).toBe('San Francisco, CA');
      expect(result.frontmatter.website).toBe('https://johndoe.dev');
      
      // Validate sections
      expect(result.sections.length).toBeGreaterThan(0);
      const titles = result.sections.map((s: any) => s.title);
      expect(titles).toContain('John Doe');
      expect(titles).toContain('Professional Summary');
      expect(titles).toContain('Experience');
      expect(titles).toContain('Skills');
    });

    test('should throw error for missing frontmatter', async () => {
      const invalidCV = `
# John Doe
Content without frontmatter
`;

      await expect(parseCV(invalidCV)).rejects.toThrow(CVParserError);
    });

    test('should throw error for missing required fields', async () => {
      const invalidCV = `---
name: John Doe
# Missing email
---

# John Doe
Content
`;

      await expect(parseCV(invalidCV)).rejects.toThrow('email');
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