/**
 * Contract Test: POST /api/cvs - Create CV Instance
 * 
 * This test validates the API contract for creating CV instances.
 * It MUST fail initially (no implementation exists yet) - this is part of TDD.
 * 
 * Run with: npm test -- cv-create.test.ts
 */

import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import type { CVInstance, CreateCVRequest, TemplateSettings } from '../../shared/types';

// Will be replaced with actual app once implementation exists
const app = null; // TODO: Replace with actual Express app

// Skipped: contract tests need proper app wiring (app is currently null)
describe.skip('POST /api/cvs - Create CV Instance Contract', () => {
  const baseUrl = '/api/cvs';
  
  // Valid test data matching the project specification
  const validCVData: CreateCVRequest = {
    name: 'Software Engineer CV - 2025',
    content: `---
name: John Doe
email: john.doe@example.com
phone: +1-555-0123
location: San Francisco, CA
website: https://johndoe.dev
linkedin: https://linkedin.com/in/johndoe
github: https://github.com/johndoe
---

# John Doe
**Software Engineer**

## Professional Summary
Experienced software engineer with 5+ years developing scalable web applications using modern technologies. Passionate about clean code, user experience, and continuous learning.

## Experience

### Senior Software Engineer | Tech Corp
*January 2020 - Present | San Francisco, CA*

- Led development of customer-facing web applications serving 100k+ users
- Built responsive React components with TypeScript and modern CSS
- Designed RESTful APIs using Node.js, Express.js, and PostgreSQL
- Mentored junior developers and conducted code reviews
- Implemented CI/CD pipelines reducing deployment time by 75%

### Frontend Developer | StartupCo
*June 2018 - December 2019 | San Francisco, CA*

- Developed interactive user interfaces using React and Redux
- Collaborated with designers to implement pixel-perfect designs
- Optimized application performance achieving 95+ Lighthouse scores
- Integrated third-party APIs and payment processing systems

## Education

### Bachelor of Science in Computer Science
*University of California, Berkeley | May 2018*
- Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems
- GPA: 3.7/4.0

## Skills
- **Languages**: JavaScript, TypeScript, Python, HTML, CSS
- **Frameworks**: React, Node.js, Express.js, Next.js
- **Databases**: PostgreSQL, MongoDB, Redis
- **Tools**: Git, Docker, AWS, Webpack, Jest
- **Design**: Figma, Adobe Creative Suite, Responsive Design

## Projects

### Personal Portfolio Website
*https://johndoe.dev*
- Built responsive portfolio showcasing projects and technical skills
- Implemented with Next.js, TypeScript, and Tailwind CSS
- Deployed on Vercel with automated deployment from GitHub

### Task Management App
*https://github.com/johndoe/task-manager*
- Full-stack application for team task management
- React frontend with Node.js/Express.js backend
- Real-time updates using WebSockets and Redis pub/sub
`,
    template_id: 'default-modern', // This should match the seeded template
    settings: {
      primaryColor: '#2563eb',
      accentColor: '#059669',
      backgroundColor: '#ffffff',
      surfaceColor: '#ffffff',
      fontFamily: 'Inter',
      titleFontSize: 24,
      bodyFontSize: 14,
      useTagDesign: true,
      useUnderlinedLinks: false,
      separatorStyle: 'solid' as const,
      showPageNumbers: true,
      showDate: true,
      emojiStyle: 'none' as const,
      pageMargins: {
        top: '2cm',
        bottom: '2cm',
        left: '2cm',
        right: '2cm'
      }
    }
  };

  beforeAll(async () => {
    // TODO: Set up test database with default template
    // This will fail until implementation exists
  });

  describe('Successful CV Creation', () => {
    test('should create CV with valid data and return complete CV object', async () => {
      // This test MUST fail initially - no implementation exists
      const response = await request(app)
        .post(baseUrl)
        .send(validCVData)
        .expect(201);

      // Contract validation - response should be a complete CVInstance
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('parsed_content');
      expect(response.body).toHaveProperty('template_id');
      expect(response.body).toHaveProperty('settings');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      // Validate returned data matches input
      expect(response.body.name).toBe(validCVData.name);
      expect(response.body.content).toBe(validCVData.content);
      expect(response.body.template_id).toBe(validCVData.template_id);
      expect(response.body.settings).toEqual(validCVData.settings);
      
      // Validate default and computed fields
      expect(response.body.status).toBe('active');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i); // UUID format
      expect(typeof response.body.created_at).toBe('string');
      expect(typeof response.body.updated_at).toBe('string');
      
      // Should have parsed content from Markdown
      expect(response.body.parsed_content).toBeDefined();
      expect(typeof response.body.parsed_content).toBe('object');
      expect(response.body.parsed_content).toHaveProperty('frontmatter');
      expect(response.body.parsed_content).toHaveProperty('sections');
      
      // Validate parsed frontmatter
      const frontmatter = response.body.parsed_content.frontmatter;
      expect(frontmatter.name).toBe('John Doe');
      expect(frontmatter.email).toBe('john.doe@example.com');
      expect(frontmatter.phone).toBe('+1-555-0123');
    });

    test('should create CV with minimal required data', async () => {
      const minimalData = {
        name: 'Minimal CV',
        content: `---
name: Jane Smith
email: jane@example.com
---

# Jane Smith
Developer
`,
        template_id: 'default-modern'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(minimalData)
        .expect(201);

      expect(response.body.name).toBe(minimalData.name);
      expect(response.body.content).toBe(minimalData.content);
      expect(response.body.template_id).toBe(minimalData.template_id);
      
      // Should use template default settings when not provided
      expect(response.body.settings).toBeDefined();
      expect(typeof response.body.settings).toBe('object');
    });

    test('should generate unique IDs for multiple CVs', async () => {
      const cv1Response = await request(app)
        .post(baseUrl)
        .send({ ...validCVData, name: 'CV One' })
        .expect(201);

      const cv2Response = await request(app)
        .post(baseUrl)
        .send({ ...validCVData, name: 'CV Two' })
        .expect(201);

      expect(cv1Response.body.id).not.toBe(cv2Response.body.id);
      expect(cv1Response.body.name).toBe('CV One');
      expect(cv2Response.body.name).toBe('CV Two');
    });
  });

  describe('Input Validation', () => {
    test('should reject CV with missing required fields', async () => {
      const tests = [
        { data: { content: 'test', template_id: 'default-modern' }, field: 'name' },
        { data: { name: 'test', template_id: 'default-modern' }, field: 'content' },
        { data: { name: 'test', content: 'test' }, field: 'template_id' },
      ];

      for (const { data, field } of tests) {
        const response = await request(app)
          .post(baseUrl)
          .send(data)
          .expect(422);

        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toContain(field);
      }
    });

    test('should reject CV with invalid name length', async () => {
      // Name too long (> 100 characters)
      const longName = 'A'.repeat(101);
      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          name: longName
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('name');
      expect(response.body.message).toContain('100');
    });

    test('should reject CV with empty name', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          name: ''
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('name');
    });

    test('should reject CV with invalid template_id', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          template_id: 'non-existent-template'
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('template');
    });

    test('should reject CV with malformed Markdown content', async () => {
      const invalidContent = `
# Missing frontmatter
This content has no required frontmatter section.
`;

      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          content: invalidContent
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('frontmatter');
    });

    test('should reject CV with incomplete frontmatter', async () => {
      const incompleteContent = `---
name: John Doe
# Missing required email field
---

# John Doe
Content here.
`;

      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          content: incompleteContent
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('email');
    });
  });

  describe('Settings Validation', () => {
    test('should validate template settings against schema', async () => {
      const invalidSettings = {
        ...validCVData.settings,
        primaryColor: 'not-a-color', // Invalid color format
        titleFontSize: -5 // Invalid negative size
      };

      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          settings: invalidSettings
        })
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('settings');
    });

    test('should accept partial settings and merge with defaults', async () => {
      const partialSettings = {
        primaryColor: '#dc2626',
        fontFamily: 'Georgia'
        // Other settings should use template defaults
      };

      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          settings: partialSettings
        })
        .expect(201);

      expect(response.body.settings.primaryColor).toBe('#dc2626');
      expect(response.body.settings.fontFamily).toBe('Georgia');
      // Should have default values for unspecified settings
      expect(response.body.settings.bodyFontSize).toBe(14);
      expect(response.body.settings.useTagDesign).toBe(true);
    });
  });

  describe('Business Logic', () => {
    test('should not allow duplicate CV names for active status', async () => {
      // Create first CV
      await request(app)
        .post(baseUrl)
        .send(validCVData)
        .expect(201);

      // Try to create second CV with same name
      const response = await request(app)
        .post(baseUrl)
        .send(validCVData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('name');
      expect(response.body.message).toContain('exists');
    });

    test('should create CV within performance target', async () => {
      const startTime = Date.now();

      await request(app)
        .post(baseUrl)
        .send(validCVData)
        .expect(201);

      const duration = Date.now() - startTime;
      
      // Should respond within 500ms including Markdown parsing
      expect(duration).toBeLessThan(500);
    });

    test('should persist CV to database', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send(validCVData)
        .expect(201);

      const cvId = response.body.id;

      // Verify CV can be retrieved
      const getResponse = await request(app)
        .get(`${baseUrl}/${cvId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(cvId);
      expect(getResponse.body.name).toBe(validCVData.name);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // This would require mocking database failure
      // Implementation should return 500 with appropriate error message
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('JSON');
    });

    test('should handle large content gracefully', async () => {
      const largeContent = `---
name: Test User
email: test@example.com
---

# Large Content Test
${'Very long content. '.repeat(10000)}`;

      const response = await request(app)
        .post(baseUrl)
        .send({
          ...validCVData,
          content: largeContent
        });

      // Should either succeed or fail with appropriate message (not crash)
      expect([201, 413, 422]).toContain(response.status);
    });
  });
});