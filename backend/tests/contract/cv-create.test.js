/**
 * Contract Test: POST /api/cvs (T011)
 * 
 * Tests CV creation endpoint according to API contract
 * MUST FAIL initially - this is TDD requirement
 */

const request = require('supertest')
const { v4: uuidv4 } = require('uuid')
const app = require('../../src/app').createApp // Will fail until implemented

describe('Contract: POST /api/cvs', () => {
  let server

  const validCVData = {
    name: 'Software Engineer CV',
    content: `---
name: John Doe
email: john@example.com
phone: +1-555-0123
---

# John Doe
Software Engineer

## Experience
- Senior Developer at Tech Corp (2020-present)
- Junior Developer at StartupCo (2018-2020)

## Skills
- JavaScript, TypeScript, React, Node.js
- Database design, API development
`,
    template_id: 'default-modern'
  }

  beforeAll(async () => {
    server = await app()
  })

  afterAll(async () => {
    if (server && server.close) {
      server.close()
    }
  })

  it('should create CV with valid data', async () => {
    const response = await request(server)
      .post('/api/cvs')
      .send(validCVData)
      .expect(201)

    // Validate response structure matches API contract
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('success', true)
    expect(response.body).toHaveProperty('message')
    
    const cv = response.body.data
    expect(cv).toHaveProperty('id')
    expect(cv).toHaveProperty('name', validCVData.name)
    expect(cv).toHaveProperty('content', validCVData.content)
    expect(cv).toHaveProperty('template_id', validCVData.template_id)
    expect(cv).toHaveProperty('status', 'active')
    expect(cv).toHaveProperty('created_at')
    expect(cv).toHaveProperty('updated_at')
    expect(cv).toHaveProperty('parsed_content')
  })

  it('should return 400 for missing required fields', async () => {
    const response = await request(server)
      .post('/api/cvs')
      .send({ name: 'Test CV' }) // Missing content and template_id
      .expect(400)

    expect(response.body).toHaveProperty('error')
    expect(response.body.error).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid markdown content', async () => {
    const response = await request(server)
      .post('/api/cvs')
      .send({
        ...validCVData,
        content: 'Invalid content without frontmatter'
      })
      .expect(400)

    expect(response.body).toHaveProperty('error')
  })

  it('should return 422 for non-existent template_id', async () => {
    const response = await request(server)
      .post('/api/cvs')
      .send({
        ...validCVData,
        template_id: uuidv4() // Non-existent template
      })
      .expect(422)

    expect(response.body).toHaveProperty('error')
  })

  it('should auto-generate parsed_content from markdown', async () => {
    const response = await request(server)
      .post('/api/cvs')
      .send(validCVData)
      .expect(201)

    const cv = response.body.data
    expect(cv.parsed_content).toBeTruthy()
    expect(cv.parsed_content).toHaveProperty('frontmatter')
    expect(cv.parsed_content).toHaveProperty('sections')
    expect(cv.parsed_content.frontmatter).toHaveProperty('name', 'John Doe')
    expect(cv.parsed_content.frontmatter).toHaveProperty('email', 'john@example.com')
  })
})