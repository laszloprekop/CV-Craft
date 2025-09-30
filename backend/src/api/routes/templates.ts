/**
 * Template API Routes
 * 
 * REST API endpoints for template management operations
 */

import { Router } from 'express';
import { getDatabase } from '../../database/connection';
import { createTemplateModel } from '../../models/Template';
import { createTemplateService, TemplateServiceError } from '../../services/TemplateService';
import { 
  asyncHandler, 
  createApiResponse, 
  createPaginatedResponse 
} from '../../middleware/errorHandler';
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  validateListTemplates,
  validateTemplateId,
  validateUuid
} from '../../middleware/validation';

const router = Router();

// Initialize dependencies
const getServices = () => {
  const db = getDatabase();
  const templateModel = createTemplateModel(db);
  const templateService = createTemplateService(templateModel);
  return { templateService, templateModel };
};

/**
 * GET /api/templates - List templates
 */
router.get('/', validateListTemplates, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const options = {
    active_only: req.query.active_only === 'false' ? false : true,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
    orderBy: req.query.orderBy as 'created_at' | 'name' | 'version' || 'created_at',
    orderDirection: req.query.orderDirection as 'ASC' | 'DESC' || 'DESC'
  };

  const result = await templateService.list(options);
  
  res.json(createPaginatedResponse(
    result.data,
    result.total,
    options.limit,
    options.offset
  ));
}));

/**
 * POST /api/templates - Create new template
 */
router.post('/', validateCreateTemplate, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const templateData = {
    name: req.body.name,
    description: req.body.description,
    css: req.body.css,
    config_schema: req.body.config_schema,
    default_settings: req.body.default_settings,
    preview_image: req.body.preview_image,
    version: req.body.version
  };

  const template = await templateService.create(templateData);
  
  res.status(201).json(createApiResponse(template, 'Template created successfully'));
}));

/**
 * GET /api/templates/:id - Get template by ID
 */
router.get('/:id', validateTemplateId, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const template = await templateService.getById(req.params.id);
  
  res.json(createApiResponse(template));
}));

/**
 * PUT /api/templates/:id - Update template
 */
router.put('/:id', validateTemplateId, validateUpdateTemplate, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    css: req.body.css,
    config_schema: req.body.config_schema,
    default_settings: req.body.default_settings,
    preview_image: req.body.preview_image,
    is_active: req.body.is_active,
    version: req.body.version
  };

  const template = await templateService.update(req.params.id, updateData);
  
  res.json(createApiResponse(template, 'Template updated successfully'));
}));

/**
 * DELETE /api/templates/:id - Delete template
 */
router.delete('/:id', validateTemplateId, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  await templateService.delete(req.params.id);
  
  res.status(204).send();
}));

/**
 * POST /api/templates/:id/activate - Activate template
 */
router.post('/:id/activate', validateTemplateId, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const template = await templateService.activate(req.params.id);
  
  res.json(createApiResponse(template, 'Template activated successfully'));
}));

/**
 * POST /api/templates/:id/deactivate - Deactivate template
 */
router.post('/:id/deactivate', validateTemplateId, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const template = await templateService.deactivate(req.params.id);
  
  res.json(createApiResponse(template, 'Template deactivated successfully'));
}));

/**
 * GET /api/templates/:id/usage - Get template usage stats
 */
router.get('/:id/usage', validateTemplateId, asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const usage = await templateService.getUsageStats(req.params.id);
  
  res.json(createApiResponse(usage));
}));

/**
 * GET /api/templates/search - Search templates
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  const query = req.query.q as string;
  const activeOnly = req.query.active_only !== 'false';
  
  if (!query || query.trim().length === 0) {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Search query is required',
      details: { validation: 'Query parameter "q" cannot be empty' }
    });
  }

  const templates = await templateService.searchByName(query, activeOnly);
  
  res.json(createApiResponse(templates));
}));

/**
 * POST /api/templates/validate - Validate template data
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const { templateService } = getServices();
  
  try {
    // Validate config schema if provided
    if (req.body.config_schema) {
      templateService.validateConfigSchema(req.body.config_schema);
    }

    // Validate settings against schema if both provided
    if (req.body.config_schema && req.body.default_settings) {
      templateService.validateSettings(req.body.default_settings, req.body.config_schema);
    }

    res.json(createApiResponse({
      valid: true,
      message: 'Template data is valid'
    }));
  } catch (error) {
    if (error instanceof TemplateServiceError) {
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: error.message,
        code: error.code
      });
    } else {
      throw error;
    }
  }
}));

export default router;