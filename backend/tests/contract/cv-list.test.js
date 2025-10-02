/**
 * Contract Test: GET /api/cvs (T010)
 * 
 * Tests CV list endpoint according to API contract
 * MUST FAIL initially - this is TDD requirement
 */

const request = require('supertest')

// Mock the app for now - this allows tests to properly fail with meaningful API errors
const express = require('express')
const mockApp = express()

// Add minimal route setup to test the contract, not the implementation
mockApp.get('/api/cvs', (req, res) => {
  // This should fail initially - no real implementation
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'CV list endpoint not implemented' })
})

describe('Contract: GET /api/cvs', () => {
  let server

  beforeAll(async () => {
    server = mockApp
  })

  afterAll(async () => {
    if (server && server.close) {
      server.close()
    }
  })

  it('should return paginated CV list with correct structure', async () => {
    const response = await request(server)
      .get('/api/cvs')
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

  it('should support pagination parameters', async () => {
    const response = await request(server)
      .get('/api/cvs?limit=5&offset=10')
      .expect(200)

    expect(response.body.limit).toBe(5)
    expect(response.body.offset).toBe(10)
  })

  it('should support status filtering', async () => {
    const response = await request(server)
      .get('/api/cvs?status=active')
      .expect(200)

    expect(response.body).toHaveProperty('data')
  })

  it('should return 400 for invalid pagination parameters', async () => {
    await request(server)
      .get('/api/cvs?limit=-1')
      .expect(400)
  })
})