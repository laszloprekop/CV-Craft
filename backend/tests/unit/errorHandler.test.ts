import { describe, it, expect, vi, beforeEach } from 'vitest'
import { errorHandler, notFoundHandler, createApiResponse, createPaginatedResponse } from '../../src/middleware/errorHandler'
import { CVInstanceError } from '../../src/models/CVInstance'
import type { Request, Response, NextFunction } from 'express'

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    url: '/api/test',
    method: 'GET',
    path: '/api/test',
    ...overrides,
  } as Request
}

function mockRes(): Response {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

describe('errorHandler', () => {
  const next = vi.fn() as NextFunction

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('handles CVInstanceError NOT_FOUND with 404', () => {
    const err = new CVInstanceError('CV not found', 'NOT_FOUND')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'NOT_FOUND', message: 'CV not found' }),
    )
  })

  it('handles CVInstanceError DUPLICATE_NAME with 409', () => {
    const err = new CVInstanceError('Name exists', 'DUPLICATE_NAME')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'DUPLICATE_NAME' }),
    )
  })

  it('handles CVInstanceError VALIDATION_ERROR with 422', () => {
    const err = new CVInstanceError('Invalid data', 'VALIDATION_ERROR')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(422)
  })

  it('handles CVInstanceError DATABASE_ERROR with 500', () => {
    const err = new CVInstanceError('DB failed', 'DATABASE_ERROR')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('handles CVInstanceError with unknown code as 500', () => {
    const err = new CVInstanceError('Unknown', 'UNKNOWN_CODE')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('handles ValidationError with 422', () => {
    const err = new Error('field is required')
    err.name = 'ValidationError'
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
      }),
    )
  })

  it('handles JSON SyntaxError with 400', () => {
    const err = new SyntaxError('Unexpected token') as SyntaxError & { body: string }
    ;(err as any).body = 'invalid'
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'INVALID_JSON' }),
    )
  })

  it('handles Not Found error with 404', () => {
    const err = new Error('Not Found')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('handles generic errors with 500', () => {
    const err = new Error('Something broke')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INTERNAL_ERROR',
        message: 'An internal server error occurred',
      }),
    )
  })

  it('includes stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const err = new Error('Dev error')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    const jsonArg = (res.json as any).mock.calls[0][0]
    expect(jsonArg.stack).toBeDefined()

    process.env.NODE_ENV = originalEnv
  })

  it('excludes stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const err = new Error('Prod error')
    const res = mockRes()

    errorHandler(err, mockReq(), res, next)

    const jsonArg = (res.json as any).mock.calls[0][0]
    expect(jsonArg.stack).toBeUndefined()

    process.env.NODE_ENV = originalEnv
  })
})

describe('notFoundHandler', () => {
  it('returns 404 with route info', () => {
    const req = mockReq({ method: 'GET', path: '/api/unknown' })
    const res = mockRes()

    notFoundHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'NOT_FOUND',
        message: 'Route GET /api/unknown not found',
      }),
    )
  })
})

describe('createApiResponse', () => {
  it('wraps data with success flag', () => {
    const result = createApiResponse({ id: '123' })
    expect(result).toEqual({ data: { id: '123' }, success: true })
  })

  it('includes message when provided', () => {
    const result = createApiResponse({ id: '123' }, 'Created')
    expect(result).toEqual({ data: { id: '123' }, success: true, message: 'Created' })
  })
})

describe('createPaginatedResponse', () => {
  it('returns paginated structure', () => {
    const result = createPaginatedResponse([{ id: '1' }], 10, 5, 0)
    expect(result).toEqual({
      data: [{ id: '1' }],
      total: 10,
      limit: 5,
      offset: 0,
      success: true,
    })
  })
})
