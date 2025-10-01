/**
 * Request Validation Middleware
 * 
 * Joi-based request validation for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationSchemas {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}

/**
 * Validation middleware factory
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate path parameters
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { validation: errors.join('; ') }
      });
    }

    next();
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // UUID parameter validation
  uuid: Joi.string().uuid().required(),

  // Pagination query parameters
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  }),

  // CV creation schema
  createCV: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Name cannot be empty',
        'string.max': 'Name must be 100 characters or less',
        'any.required': 'Name is required'
      }),
    content: Joi.string().min(1).required()
      .messages({
        'string.empty': 'Content cannot be empty',
        'any.required': 'Content is required'
      }),
    template_id: Joi.string().trim().min(1).required()
      .messages({
        'string.empty': 'Template ID cannot be empty',
        'any.required': 'Template ID is required'
      }),
    settings: Joi.object().optional()
  }),

  // CV update schema
  updateCV: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    content: Joi.string().min(1).optional(),
    template_id: Joi.string().trim().min(1).optional(),
    settings: Joi.object().optional(),
    config: Joi.object().optional(),
    status: Joi.string().valid('active', 'archived').optional()
  }),

  // CV duplicate schema
  duplicateCV: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Name cannot be empty',
        'string.max': 'Name must be 100 characters or less',
        'any.required': 'Name is required'
      })
  }),

  // CV list query parameters
  listCVs: Joi.object({
    status: Joi.string().valid('active', 'archived', 'deleted').optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    orderBy: Joi.string().valid('created_at', 'updated_at', 'name').default('updated_at'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // Export request schema
  createExport: Joi.object({
    export_type: Joi.string().valid('pdf', 'web_package').required()
      .messages({
        'any.only': 'Export type must be either "pdf" or "web_package"',
        'any.required': 'Export type is required'
      }),
    settings: Joi.object().optional()
  }),

  // Preview request schema
  generatePreview: Joi.object({
    mode: Joi.string().valid('web', 'pdf').default('web'),
    settings: Joi.object().optional()
  }),

  // Asset upload validation (for multipart form data)
  uploadAsset: Joi.object({
    usage_context: Joi.string().optional()
  }),

  // Template creation schema
  createTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Name cannot be empty',
        'string.max': 'Name must be 50 characters or less',
        'any.required': 'Name is required'
      }),
    description: Joi.string().optional(),
    css: Joi.string().min(1).required()
      .messages({
        'string.empty': 'CSS cannot be empty',
        'any.required': 'CSS is required'
      }),
    config_schema: Joi.object({
      type: Joi.string().valid('object').required(),
      properties: Joi.object().required(),
      required: Joi.array().items(Joi.string()).optional()
    }).required()
      .messages({
        'any.required': 'Config schema is required'
      }),
    default_settings: Joi.object().required()
      .messages({
        'any.required': 'Default settings are required'
      }),
    preview_image: Joi.string().optional(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).optional()
      .messages({
        'string.pattern.base': 'Version must be in semver format (e.g., 1.0.0)'
      })
  }),

  // Template update schema
  updateTemplate: Joi.object({
    name: Joi.string().trim().min(1).max(50).optional(),
    description: Joi.string().optional(),
    css: Joi.string().min(1).optional(),
    config_schema: Joi.object({
      type: Joi.string().valid('object').required(),
      properties: Joi.object().required(),
      required: Joi.array().items(Joi.string()).optional()
    }).optional(),
    default_settings: Joi.object().optional(),
    preview_image: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).optional()
      .messages({
        'string.pattern.base': 'Version must be in semver format (e.g., 1.0.0)'
      })
  }),

  // Template list query parameters
  listTemplates: Joi.object({
    active_only: Joi.boolean().default(true),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    orderBy: Joi.string().valid('created_at', 'name', 'version').default('created_at'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC')
  })
};

/**
 * Middleware to validate UUID parameters
 */
export const validateUuid = (paramName: string = 'id') => {
  return validate({
    params: Joi.object({
      [paramName]: schemas.uuid
    })
  });
};

/**
 * Middleware to validate pagination query parameters
 */
export const validatePagination = validate({
  query: schemas.pagination
});

/**
 * CV-specific validation middlewares
 */
export const validateCreateCV = validate({
  body: schemas.createCV
});

export const validateUpdateCV = validate({
  body: schemas.updateCV
});

export const validateDuplicateCV = validate({
  body: schemas.duplicateCV
});

export const validateListCVs = validate({
  query: schemas.listCVs
});

/**
 * Template-specific validation middlewares
 */
export const validateCreateTemplate = validate({
  body: schemas.createTemplate
});

export const validateUpdateTemplate = validate({
  body: schemas.updateTemplate
});

export const validateListTemplates = validate({
  query: schemas.listTemplates
});

/**
 * Middleware to validate template ID parameter (allows both UUID and string IDs)
 */
export const validateTemplateId = validate({
  params: Joi.object({
    id: Joi.string().trim().min(1).required()
      .messages({
        'string.empty': 'Template ID cannot be empty',
        'any.required': 'Template ID is required'
      })
  })
});

export const validateCreateExport = validate({
  body: schemas.createExport
});

export const validateGeneratePreview = validate({
  body: schemas.generatePreview
});