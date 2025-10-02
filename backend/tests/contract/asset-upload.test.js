/**
 * Contract Test: POST /api/assets/upload (T018)
 * 
 * Tests asset upload endpoint according to API contract
 * MUST FAIL initially - this is TDD requirement
 */

const request = require('supertest')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const app = require('../../src/app').createApp // Will fail until implemented

describe('Contract: POST /api/assets/upload', () => {
  let server
  const validCVId = uuidv4()

  beforeAll(async () => {
    server = await app()
    // TODO: Seed test database with valid CV
  })

  afterAll(async () => {
    if (server && server.close) {
      server.close()
    }
  })

  it('should upload image file successfully', async () => {
    // Create a simple test image buffer (1x1 PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const response = await request(server)
      .post('/api/assets/upload')
      .attach('file', testImageBuffer, 'test-image.png')
      .field('cv_id', validCVId)
      .field('usage_context', 'profile_photo')
      .expect(201)

    // Validate response structure matches API contract
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('success', true)
    expect(response.body).toHaveProperty('message')
    
    const asset = response.body.data
    expect(asset).toHaveProperty('id')
    expect(asset).toHaveProperty('cv_id', validCVId)
    expect(asset).toHaveProperty('filename', 'test-image.png')
    expect(asset).toHaveProperty('file_type', 'image')
    expect(asset).toHaveProperty('mime_type', 'image/png')
    expect(asset).toHaveProperty('file_size')
    expect(asset).toHaveProperty('storage_path')
    expect(asset).toHaveProperty('usage_context', 'profile_photo')
    expect(asset).toHaveProperty('uploaded_at')
  })

  it('should return 400 for missing cv_id', async () => {
    const testImageBuffer = Buffer.from('test', 'utf8')

    const response = await request(server)
      .post('/api/assets/upload')
      .attach('file', testImageBuffer, 'test.png')
      .expect(400)

    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR')
  })

  it('should return 400 for missing file', async () => {
    const response = await request(server)
      .post('/api/assets/upload')
      .field('cv_id', validCVId)
      .expect(400)

    expect(response.body).toHaveProperty('error', 'MISSING_FILE')
  })

  it('should return 415 for unsupported file type', async () => {
    const testBuffer = Buffer.from('test content', 'utf8')

    const response = await request(server)
      .post('/api/assets/upload')
      .attach('file', testBuffer, 'test.exe')
      .field('cv_id', validCVId)
      .expect(415)

    expect(response.body).toHaveProperty('error', 'INVALID_FILE_TYPE')
  })

  it('should return 413 for file too large', async () => {
    // Create a large buffer (>10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a')

    const response = await request(server)
      .post('/api/assets/upload')
      .attach('file', largeBuffer, 'large-file.png')
      .field('cv_id', validCVId)
      .expect(413)

    expect(response.body).toHaveProperty('error', 'UPLOAD_ERROR')
  })

  it('should return 422 for non-existent cv_id', async () => {
    const testImageBuffer = Buffer.from('test', 'utf8')
    const nonExistentCVId = uuidv4()

    const response = await request(server)
      .post('/api/assets/upload')
      .attach('file', testImageBuffer, 'test.png')
      .field('cv_id', nonExistentCVId)
      .expect(422)

    expect(response.body).toHaveProperty('error')
  })
})