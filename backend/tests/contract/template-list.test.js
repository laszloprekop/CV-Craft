/**
 * Contract Test: GET /api/templates (T016)
 * 
 * Tests template list endpoint according to API contract
 * MUST FAIL initially - this is TDD requirement
 */

const request = require('supertest')
const app = require('../../src/app').createApp // Will fail until implemented

describe('Contract: GET /api/templates', () => {
  let server

  beforeAll(async () => {
    server = await app()
    // TODO: Seed test database with templates
  })

  afterAll(async () => {
    if (server && server.close) {
      server.close()
    }
  })

  it('should return paginated template list with correct structure', async () => {
    const response = await request(server)
      .get('/api/templates')
      .expect(200)

    // Validate response structure matches API contract
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('total')
    expect(response.body).toHaveProperty('limit')
    expect(response.body).toHaveProperty('offset')
    expect(response.body).toHaveProperty('success', true)
    
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(typeof response.body.total).toBe('number')
  })

  it('should return templates with required fields', async () => {
    const response = await request(server)
      .get('/api/templates')
      .expect(200)

    if (response.body.data.length > 0) {
      const template = response.body.data[0]
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('css')
      expect(template).toHaveProperty('config_schema')
      expect(template).toHaveProperty('default_settings')
      expect(template).toHaveProperty('is_active')
      expect(template).toHaveProperty('created_at')
      expect(template).toHaveProperty('version')
    }
  })

  it('should support active_only filter', async () => {
    const response = await request(server)
      .get('/api/templates?active_only=true')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    // All returned templates should be active
    response.body.data.forEach(template => {
      expect(template.is_active).toBe(true)
    })
  })

  it('should support pagination parameters', async () => {
    const response = await request(server)
      .get('/api/templates?limit=3&offset=5')
      .expect(200)

    expect(response.body.limit).toBe(3)
    expect(response.body.offset).toBe(5)
  })

  it('should include default template in results', async () => {
    const response = await request(server)
      .get('/api/templates')
      .expect(200)

    const hasDefaultTemplate = response.body.data.some(
      template => template.id === 'default-modern' || template.name.includes('Default')
    )
    expect(hasDefaultTemplate).toBe(true)
  })
})