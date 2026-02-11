/**
 * Saved Theme API Routes
 *
 * REST API endpoints for saved theme preset management
 */

import { Router } from 'express';
import { getDatabase } from '../../database/connection';
import { createSavedThemeModel } from '../../models/SavedTheme';
import { createSavedThemeService, SavedThemeServiceError } from '../../services/SavedThemeService';
import { asyncHandler, createApiResponse } from '../../middleware/errorHandler';

const router = Router();

const getService = () => {
  const db = getDatabase();
  const model = createSavedThemeModel(db);
  return createSavedThemeService(model);
};

/**
 * GET /api/saved-themes - List all saved themes
 */
router.get('/', asyncHandler(async (_req, res) => {
  const service = getService();
  const themes = await service.list();
  res.json(createApiResponse(themes));
}));

/**
 * POST /api/saved-themes - Create a new saved theme
 */
router.post('/', asyncHandler(async (req, res) => {
  const service = getService();
  const { name, config, template_id } = req.body;

  if (!name || !config) {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'name and config are required',
    });
  }

  try {
    const theme = await service.create(name, config, template_id || 'default-modern');
    res.status(201).json(createApiResponse(theme, 'Theme saved successfully'));
  } catch (err) {
    if (err instanceof SavedThemeServiceError) {
      const status = err.code === 'DUPLICATE_NAME' ? 409 : err.code === 'NOT_FOUND' ? 404 : 422;
      return res.status(status).json({ error: err.code, message: err.message });
    }
    throw err;
  }
}));

/**
 * GET /api/saved-themes/:id - Get a saved theme by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const service = getService();

  try {
    const theme = await service.getById(req.params.id);
    res.json(createApiResponse(theme));
  } catch (err) {
    if (err instanceof SavedThemeServiceError && err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: err.message });
    }
    throw err;
  }
}));

/**
 * PUT /api/saved-themes/:id - Update a saved theme
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const service = getService();
  const { name, config } = req.body;

  try {
    const theme = await service.update(req.params.id, { name, config });
    res.json(createApiResponse(theme, 'Theme updated successfully'));
  } catch (err) {
    if (err instanceof SavedThemeServiceError) {
      const status = err.code === 'DUPLICATE_NAME' ? 409 : err.code === 'NOT_FOUND' ? 404 : 422;
      return res.status(status).json({ error: err.code, message: err.message });
    }
    throw err;
  }
}));

/**
 * DELETE /api/saved-themes/:id - Delete a saved theme
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const service = getService();

  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof SavedThemeServiceError && err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: err.message });
    }
    throw err;
  }
}));

export default router;
