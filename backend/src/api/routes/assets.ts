/**
 * Asset API Routes
 * 
 * REST API endpoints for asset management and file upload operations
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { getDatabase } from '../../database/connection';
import { createAssetModel } from '../../models/Asset';
import { createAssetService, AssetServiceError } from '../../services/AssetService';
import { 
  asyncHandler, 
  createApiResponse, 
  createPaginatedResponse 
} from '../../middleware/errorHandler';
import {
  validateUuid,
  validate,
  schemas
} from '../../middleware/validation';
import {
  uploadAsset,
  uploadAssets,
  uploadProfileImage,
  uploadDocument,
  logUpload
} from '../../middleware/upload';
import Joi from 'joi';
import fs from 'fs/promises';

const router = Router();

// Initialize dependencies
const getServices = () => {
  const db = getDatabase();
  const assetModel = createAssetModel(db);
  const assetService = createAssetService(assetModel);
  return { assetService, assetModel };
};

// Asset list query validation
const validateAssetList = validate({
  query: Joi.object({
    cv_id: Joi.string().uuid().optional(),
    file_type: Joi.string().valid('image', 'document', 'other').optional(),
    usage_context: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    orderBy: Joi.string().valid('uploaded_at', 'filename', 'file_size').default('uploaded_at'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC')
  })
});

// Asset update validation
const validateAssetUpdate = validate({
  body: Joi.object({
    filename: Joi.string().trim().min(1).max(255).optional(),
    usage_context: Joi.string().trim().allow('').optional(),
    metadata: Joi.object({
      width: Joi.number().integer().min(1).optional(),
      height: Joi.number().integer().min(1).optional(),
      alt_text: Joi.string().trim().allow('').optional()
    }).unknown(true).optional()
  })
});

// Upload request validation
const validateUploadRequest = validate({
  body: Joi.object({
    cv_id: Joi.string().uuid().required()
      .messages({
        'string.guid': 'CV ID must be a valid UUID',
        'any.required': 'CV ID is required'
      }),
    usage_context: Joi.string().trim().optional(),
    generate_thumbnails: Joi.boolean().default(false)
  })
});

/**
 * POST /api/assets/upload - Upload single asset
 */
router.post('/upload', 
  uploadAsset,
  validateUploadRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { assetService } = getServices();
    
    const uploadOptions = {
      cv_id: req.body.cv_id,
      usage_context: req.body.usage_context,
      generateThumbnails: req.body.generate_thumbnails === 'true' || req.body.generate_thumbnails === true
    };

    const result = await assetService.uploadFile((req as any).uploadedFile, uploadOptions);
    
    res.status(201).json(createApiResponse(result.asset, 'Asset uploaded successfully'));
  })
);

/**
 * POST /api/assets/upload-multiple - Upload multiple assets
 */
router.post('/upload-multiple',
  uploadAssets(5),
  validateUploadRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { assetService } = getServices();
    
    const uploadOptions = {
      cv_id: req.body.cv_id,
      usage_context: req.body.usage_context,
      generateThumbnails: req.body.generate_thumbnails === 'true' || req.body.generate_thumbnails === true
    };

    const uploadedFiles = (req as any).uploadedFiles;
    const results = [];

    for (const file of uploadedFiles) {
      try {
        const result = await assetService.uploadFile(file, uploadOptions);
        results.push(result.asset);
      } catch (error) {
        console.error('Failed to upload file:', file.originalname, error);
        // Continue with other files, but log the error
      }
    }
    
    res.status(201).json(createApiResponse(results, `${results.length} assets uploaded successfully`));
  })
);

/**
 * POST /api/assets/upload-image - Upload profile/cover image
 */
router.post('/upload-image',
  uploadProfileImage,
  validateUploadRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { assetService } = getServices();
    
    const uploadOptions = {
      cv_id: req.body.cv_id,
      usage_context: req.body.usage_context || 'profile_image',
      generateThumbnails: true
    };

    const result = await assetService.uploadFile((req as any).uploadedFile, uploadOptions);
    
    res.status(201).json(createApiResponse(result.asset, 'Image uploaded successfully'));
  })
);

/**
 * POST /api/assets/upload-document - Upload document
 */
router.post('/upload-document',
  uploadDocument,
  validateUploadRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { assetService } = getServices();
    
    const uploadOptions = {
      cv_id: req.body.cv_id,
      usage_context: req.body.usage_context || 'document',
      generateThumbnails: false
    };

    const result = await assetService.uploadFile((req as any).uploadedFile, uploadOptions);
    
    res.status(201).json(createApiResponse(result.asset, 'Document uploaded successfully'));
  })
);

/**
 * GET /api/assets - List assets
 */
router.get('/', validateAssetList, asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const options = {
    cv_id: req.query.cv_id as string,
    file_type: req.query.file_type as 'image' | 'document' | 'other',
    usage_context: req.query.usage_context as string,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
    orderBy: req.query.orderBy as 'uploaded_at' | 'filename' | 'file_size' || 'uploaded_at',
    orderDirection: req.query.orderDirection as 'ASC' | 'DESC' || 'DESC'
  };

  const result = await assetService.list(options);
  
  res.json(createPaginatedResponse(
    result.data,
    result.total,
    options.limit,
    options.offset
  ));
}));

/**
 * GET /api/assets/:id - Get asset by ID
 */
router.get('/:id', validateUuid(), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const asset = await assetService.getById(req.params.id);
  
  res.json(createApiResponse(asset));
}));

/**
 * PUT /api/assets/:id - Update asset metadata
 */
router.put('/:id', validateUuid(), validateAssetUpdate, asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const updateData = {
    filename: req.body.filename,
    usage_context: req.body.usage_context,
    metadata: req.body.metadata
  };

  const asset = await assetService.update(req.params.id, updateData);
  
  res.json(createApiResponse(asset, 'Asset updated successfully'));
}));

/**
 * DELETE /api/assets/:id - Delete asset
 */
router.delete('/:id', validateUuid(), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  await assetService.delete(req.params.id);
  
  res.status(204).send();
}));

/**
 * GET /api/assets/:id/file - Download/serve asset file
 */
router.get('/:id/file', validateUuid(), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const asset = await assetService.getById(req.params.id);
  const filePath = assetService.getAssetPath(asset);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    return res.status(404).json({
      error: 'FILE_NOT_FOUND',
      message: 'Asset file not found on disk'
    });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', asset.mime_type);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

  // For images, display inline; for other files, force download
  if (asset.file_type === 'image') {
    res.setHeader('Content-Disposition', `inline; filename="${asset.filename}"`);
  } else {
    res.setHeader('Content-Disposition', `attachment; filename="${asset.filename}"`);
  }

  // Send file
  res.sendFile(filePath);
}));

/**
 * GET /api/assets/:id/info - Get asset metadata only
 */
router.get('/:id/info', validateUuid(), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const asset = await assetService.getById(req.params.id);
  
  // Return asset without the file content
  const assetInfo = {
    ...asset,
    public_url: assetService.getPublicUrl(asset)
  };
  
  res.json(createApiResponse(assetInfo));
}));

/**
 * GET /api/assets/cv/:cv_id - Get assets for specific CV
 */
router.get('/cv/:cv_id', validateUuid('cv_id'), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const assets = await assetService.getByCV(req.params.cv_id);
  
  res.json(createApiResponse(assets));
}));

/**
 * DELETE /api/assets/cv/:cv_id - Delete all assets for a CV
 */
router.delete('/cv/:cv_id', validateUuid('cv_id'), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const deletedCount = await assetService.deleteAllForCV(req.params.cv_id);
  
  res.json(createApiResponse({ 
    deleted_count: deletedCount 
  }, `${deletedCount} assets deleted`));
}));

/**
 * GET /api/assets/stats - Get storage statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const stats = await assetService.getStorageStats();
  
  res.json(createApiResponse(stats));
}));

/**
 * GET /api/assets/stats/cv/:cv_id - Get storage usage for specific CV
 */
router.get('/stats/cv/:cv_id', validateUuid('cv_id'), asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const usage = await assetService.getCVStorageUsage(req.params.cv_id);
  
  res.json(createApiResponse({ 
    cv_id: req.params.cv_id,
    storage_used: usage,
    storage_used_mb: Math.round(usage / 1024 / 1024 * 100) / 100
  }));
}));

/**
 * POST /api/assets/cleanup - Clean up orphaned files
 */
router.post('/cleanup', asyncHandler(async (req, res) => {
  const { assetService } = getServices();
  
  const result = await assetService.cleanupOrphanedFiles();
  
  res.json(createApiResponse(result, 'Cleanup completed'));
}));

/**
 * GET /api/assets/types - Get supported file types
 */
router.get('/types/supported', asyncHandler(async (req, res) => {
  const supportedTypes = {
    images: {
      mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      extensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
      max_size: '10MB'
    },
    documents: {
      mime_types: [
        'application/pdf',
        'text/plain', 
        'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      extensions: ['.pdf', '.txt', '.md', '.doc', '.docx'],
      max_size: '20MB'
    }
  };
  
  res.json(createApiResponse(supportedTypes));
}));

// Error handling for asset service errors
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof AssetServiceError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message
    });
  }
  next(error);
});

export default router;