/**
 * CV API Routes
 * 
 * REST API endpoints for CV management operations
 */

import { Router } from 'express';
import { getDatabase } from '../../database/connection';
import { createCVInstanceModel } from '../../models/CVInstance';
import { createTemplateModel } from '../../models/Template';
import { createCVService, CVServiceError } from '../../services/CVService';
import {
  asyncHandler,
  createApiResponse,
  createPaginatedResponse
} from '../../middleware/errorHandler';
import {
  validateCreateCV,
  validateUpdateCV,
  validateDuplicateCV,
  validateListCVs,
  validateUuid
} from '../../middleware/validation';

const router = Router();

// Initialize dependencies
const getServices = () => {
  const db = getDatabase();
  const cvModel = createCVInstanceModel(db);
  const templateModel = createTemplateModel(db);
  const cvService = createCVService(cvModel, templateModel);
  return { cvService, cvModel };
};

/**
 * GET /api/cvs - List CV instances
 */
router.get('/', validateListCVs, asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const options = {
    status: req.query.status as 'active' | 'archived' | 'deleted' | undefined,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
    orderBy: req.query.orderBy as 'created_at' | 'updated_at' | 'name' || 'updated_at',
    orderDirection: req.query.orderDirection as 'ASC' | 'DESC' || 'DESC'
  };

  const result = await cvService.list(options);
  
  res.json(createPaginatedResponse(
    result.data,
    result.total,
    options.limit,
    options.offset
  ));
}));

/**
 * POST /api/cvs - Create new CV instance
 */
router.post('/', validateCreateCV, asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cvData = {
    name: req.body.name,
    content: req.body.content,
    template_id: req.body.template_id,
    settings: req.body.settings
  };

  const cv = await cvService.create(cvData);
  
  res.status(201).json(createApiResponse(cv, 'CV created successfully'));
}));

/**
 * GET /api/cvs/:id - Get CV instance by ID
 */
router.get('/:id', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cv = await cvService.getById(req.params.id);
  
  res.json(createApiResponse(cv));
}));

/**
 * PUT /api/cvs/:id - Update CV instance
 */
router.put('/:id', validateUuid('id'), validateUpdateCV, asyncHandler(async (req, res) => {
  const { cvService } = getServices();

  const updateData = {
    name: req.body.name,
    content: req.body.content,
    template_id: req.body.template_id,
    photo_asset_id: req.body.photo_asset_id,
    settings: req.body.settings,
    config: req.body.config,
    status: req.body.status
  };

  const cv = await cvService.update(req.params.id, updateData);

  res.json(createApiResponse(cv, 'CV updated successfully'));
}));

/**
 * DELETE /api/cvs/:id - Delete CV instance
 */
router.delete('/:id', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  await cvService.delete(req.params.id);
  
  res.status(204).send();
}));

/**
 * POST /api/cvs/:id/duplicate - Duplicate CV instance
 */
router.post('/:id/duplicate', validateUuid('id'), validateDuplicateCV, asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cv = await cvService.duplicate(req.params.id, req.body.name);
  
  res.status(201).json(createApiResponse(cv, 'CV duplicated successfully'));
}));

/**
 * POST /api/cvs/:id/archive - Archive CV instance
 */
router.post('/:id/archive', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cv = await cvService.archive(req.params.id);
  
  res.json(createApiResponse(cv, 'CV archived successfully'));
}));

/**
 * POST /api/cvs/:id/restore - Restore CV from archive
 */
router.post('/:id/restore', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cv = await cvService.restore(req.params.id);
  
  res.json(createApiResponse(cv, 'CV restored successfully'));
}));

/**
 * GET /api/cvs/:id/stats - Get CV statistics
 */
router.get('/:id/stats', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const stats = await cvService.getStats(req.params.id);
  
  res.json(createApiResponse(stats));
}));

/**
 * POST /api/cvs/:id/reparse - Re-parse CV content
 */
router.post('/:id/reparse', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const cv = await cvService.reparse(req.params.id);
  
  res.json(createApiResponse(cv, 'CV content re-parsed successfully'));
}));

/**
 * GET /api/cvs/search - Search CVs
 */
router.get('/search', validateListCVs, asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const query = req.query.q as string || '';
  const options = {
    status: req.query.status as 'active' | 'archived' | 'deleted' | undefined,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
    orderBy: req.query.orderBy as 'created_at' | 'updated_at' | 'name' || 'updated_at',
    orderDirection: req.query.orderDirection as 'ASC' | 'DESC' || 'DESC'
  };

  const result = await cvService.search(query, options);
  
  res.json(createPaginatedResponse(
    result.data,
    result.total,
    options.limit,
    options.offset
  ));
}));

/**
 * POST /api/cvs/validate - Validate CV content
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const content = req.body.content;
  if (!content || typeof content !== 'string') {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Content is required and must be a string'
    });
  }

  const validation = cvService.validateContent(content);
  
  res.json(createApiResponse({
    valid: validation.valid,
    errors: validation.errors
  }));
}));

/**
 * GET /api/cvs/:id/preview-pdf - Get PDF preview for live viewing
 * Returns the PDF as a binary stream for display in an iframe
 */
router.get('/:id/preview-pdf', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();

  try {
    console.log('[preview-pdf] Starting PDF generation for CV:', req.params.id);

    // Export as PDF to a temporary location
    const exportResult = await cvService.exportCV(req.params.id, 'pdf');
    console.log('[preview-pdf] Export result:', exportResult);

    // Get the file path and send it as a PDF
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), exportResult.file_path);
    console.log('[preview-pdf] Reading PDF from:', filePath);

    const pdfBuffer = await fs.readFile(filePath);
    console.log('[preview-pdf] PDF buffer size:', pdfBuffer.length);

    // Set headers for PDF display (not download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.send(pdfBuffer);
  } catch (error) {
    console.error('[preview-pdf] Error generating PDF:', error);
    if (error instanceof CVServiceError && error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'CV not found'
      });
    }
    throw error;
  }
}));

/**
 * POST /api/cvs/:id/export - Export CV to different formats
 */
router.post('/:id/export', validateUuid('id'), asyncHandler(async (req, res) => {
  const { cvService } = getServices();
  
  const exportType = req.body.type as 'pdf' | 'web_package';
  if (!exportType || !['pdf', 'web_package'].includes(exportType)) {
    return res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Export type must be either "pdf" or "web_package"'
    });
  }

  try {
    const exportResult = await cvService.exportCV(req.params.id, exportType);
    
    res.json(createApiResponse({
      filename: exportResult.filename,
      file_path: exportResult.file_path,
      export_type: exportType,
      size: exportResult.size,
      generated_at: exportResult.generated_at
    }, 'CV exported successfully'));
  } catch (error) {
    if (error instanceof CVServiceError && error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'CV not found'
      });
    }
    throw error;
  }
}));

export default router;