/**
 * Contract Test: GET /api/cvs/:id (T012)
 * 
 * Tests CV retrieval endpoint according to API contract
 * MUST FAIL initially - this is TDD requirement
 */

const request = require('supertest')
const { v4: uuidv4 } = require('uuid')
const app = require('../../src/app').createApp // Will fail until implemented

describe('Contract: GET /api/cvs/:id', () => {
  let server
  const validCVId = uuidv4()
  const nonExistentCVId = uuidv4()

  beforeAll(async () => {
    server = await app()
    // TODO: Seed test database with valid CV
  })

  afterAll(async () => {
    if (server && server.close) {
      server.close()
    }
  })

  it('should return CV with correct structure for valid ID', async () => {
    const response = await request(server)
      .get(`/api/cvs/${validCVId}`)
      .expect(200)

    // Validate response structure matches API contract
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('success', true)
    
    const cv = response.body.data
    expect(cv).toHaveProperty('id', validCVId)
    expect(cv).toHaveProperty('name')
    expect(cv).toHaveProperty('content')
    expect(cv).toHaveProperty('parsed_content')
    expect(cv).toHaveProperty('template_id')
    expect(cv).toHaveProperty('settings')
    expect(cv).toHaveProperty('status')
    expect(cv).toHaveProperty('created_at')
    expect(cv).toHaveProperty('updated_at')
    expect(cv).toHaveProperty('metadata')
  })

  it('should return 404 for non-existent CV ID', async () => {
    const response = await request(server)
      .get(`/api/cvs/${nonExistentCVId}`)
      .expect(404)

    expect(response.body).toHaveProperty('error', 'CV_NOT_FOUND')
    expect(response.body).toHaveProperty('message')
  })

  it('should return 400 for invalid UUID format', async () => {
    const response = await request(server)
      .get('/api/cvs/invalid-uuid')
      .expect(400)

    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR')
  })

  it('should include parsed_content with frontmatter and sections', async () => {
    const response = await request(server)
      .get(`/api/cvs/${validCVId}`)
      .expect(200)

    const cv = response.body.data
    expect(cv.parsed_content).toBeTruthy()
    expect(cv.parsed_content).toHaveProperty('frontmatter')
    expect(cv.parsed_content).toHaveProperty('sections')
    expect(Array.isArray(cv.parsed_content.sections)).toBe(true)
  })
})