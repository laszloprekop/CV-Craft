/**
 * Validation Middleware Tests
 *
 * Tests for Joi-based request validation middleware used across API endpoints.
 * Covers UUID validation, CV CRUD validation, and list query parameter validation
 * including the orderBy whitelist introduced in Phase 1 security fixes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validate,
  validateUuid,
  validateCreateCV,
  validateUpdateCV,
  validateListCVs,
  schemas
} from '../../src/middleware/validation';
import type { Request, Response, NextFunction } from 'express';

// ── Test Helpers ──────────────────────────────────────────────────────────────

const mockReq = (params = {}, body = {}, query = {}) =>
  ({
    params,
    body,
    query
  } as any);

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Validation Middleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  // ── validateUuid ──────────────────────────────────────────────────────────

  describe('validateUuid()', () => {
    it('should call next() for a valid UUID v4', () => {
      const req = mockReq({ id: '550e8400-e29b-41d4-a716-446655440000' });
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() for another valid UUID', () => {
      const req = mockReq({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should return 422 for a completely invalid UUID', () => {
      const req = mockReq({ id: 'not-a-uuid' });
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'VALIDATION_ERROR' })
      );
    });

    it('should return 422 for an empty string', () => {
      const req = mockReq({ id: '' });
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when UUID param is missing entirely', () => {
      const req = mockReq({});
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should validate a custom-named param', () => {
      const req = mockReq({ cvId: '550e8400-e29b-41d4-a716-446655440000' });
      const res = mockRes();

      validateUuid('cvId')(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should reject SQL injection attempts in UUID param', () => {
      const req = mockReq({ id: "'; DROP TABLE cv_instances; --" });
      const res = mockRes();

      validateUuid()(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ── validateCreateCV ──────────────────────────────────────────────────────

  describe('validateCreateCV', () => {
    const validBody = {
      name: 'My CV',
      content: '# John Doe\nSome content',
      template_id: 'professional-v1'
    };

    it('should call next() when all required fields are present', () => {
      const req = mockReq({}, validBody);
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when optional settings field is included', () => {
      const req = mockReq({}, { ...validBody, settings: { color: 'blue' } });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should return 422 when name is missing', () => {
      const req = mockReq({}, { content: 'some content', template_id: 'tpl' });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed'
        })
      );
    });

    it('should return 422 when content is missing', () => {
      const req = mockReq({}, { name: 'My CV', template_id: 'tpl' });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when template_id is missing', () => {
      const req = mockReq({}, { name: 'My CV', content: 'content' });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when name is an empty string', () => {
      const req = mockReq({}, { ...validBody, name: '' });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when name exceeds 100 characters', () => {
      const req = mockReq({}, { ...validBody, name: 'A'.repeat(101) });
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when body is completely empty', () => {
      const req = mockReq({}, {});
      const res = mockRes();

      validateCreateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ── validateUpdateCV ──────────────────────────────────────────────────────

  describe('validateUpdateCV', () => {
    it('should call next() for a partial update with only name', () => {
      const req = mockReq({}, { name: 'Updated Name' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() for a partial update with only content', () => {
      const req = mockReq({}, { content: '# Updated content' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() for a partial update with config object', () => {
      const req = mockReq({}, { config: { fontSize: 14, fontFamily: 'Arial' } });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() for a valid status update', () => {
      const req = mockReq({}, { status: 'archived' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should return 422 for an invalid status value', () => {
      const req = mockReq({}, { status: 'deleted' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should call next() when photo_asset_id is a valid UUID', () => {
      const req = mockReq({}, { photo_asset_id: '550e8400-e29b-41d4-a716-446655440000' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() when photo_asset_id is null (clearing photo)', () => {
      const req = mockReq({}, { photo_asset_id: null });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should return 422 when photo_asset_id is not a valid UUID', () => {
      const req = mockReq({}, { photo_asset_id: 'not-a-uuid' });
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should call next() with an empty body (no fields to update)', () => {
      const req = mockReq({}, {});
      const res = mockRes();

      validateUpdateCV(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── validateListCVs ───────────────────────────────────────────────────────

  describe('validateListCVs', () => {
    it('should call next() with no query params (defaults apply)', () => {
      const req = mockReq({}, {}, {});
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() with valid pagination params', () => {
      const req = mockReq({}, {}, { limit: 10, offset: 20 });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() with valid orderBy "created_at"', () => {
      const req = mockReq({}, {}, { orderBy: 'created_at' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() with valid orderBy "updated_at"', () => {
      const req = mockReq({}, {}, { orderBy: 'updated_at' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next() with valid orderBy "name"', () => {
      const req = mockReq({}, {}, { orderBy: 'name' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should reject orderBy with SQL injection attempt (Phase 1 whitelist)', () => {
      const req = mockReq({}, {}, { orderBy: 'name; DROP TABLE cv_instances' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'VALIDATION_ERROR' })
      );
    });

    it('should reject orderBy with an arbitrary column name not in whitelist', () => {
      const req = mockReq({}, {}, { orderBy: 'content' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should reject invalid orderDirection values', () => {
      const req = mockReq({}, {}, { orderDirection: 'SIDEWAYS' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should reject limit exceeding maximum (100)', () => {
      const req = mockReq({}, {}, { limit: 999 });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should reject negative offset', () => {
      const req = mockReq({}, {}, { offset: -1 });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should call next() with valid status filter', () => {
      const req = mockReq({}, {}, { status: 'active' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should reject invalid status values', () => {
      const req = mockReq({}, {}, { status: 'published' });
      const res = mockRes();

      validateListCVs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  // ── validate() factory ────────────────────────────────────────────────────

  describe('validate() factory', () => {
    it('should combine body and params validation errors', () => {
      const middleware = validate({
        params: schemas.uuid.label('id'),
        body: schemas.createCV
      });

      // Wrap uuid in an object so params validation triggers on missing id
      const middlewareWithParamObj = validate({
        params: require('joi').object({ id: schemas.uuid }),
        body: schemas.createCV
      });

      const req = mockReq({}, {}); // missing both params.id and body fields
      const res = mockRes();

      middlewareWithParamObj(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      // Should contain errors from both params and body validation
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.details.validation).toContain('Params');
      expect(jsonCall.details.validation).toContain('Body');
    });
  });
});
