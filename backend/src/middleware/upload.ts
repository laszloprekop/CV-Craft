/**
 * File Upload Middleware
 * 
 * Multer-based middleware for handling file uploads with validation and processing
 */

import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

export interface UploadOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  fieldName?: string;
  maxFiles?: number;
}

export interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Default upload configuration for CV assets
 */
const defaultAssetOptions: UploadOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.txt', '.md', '.doc', '.docx'],
  fieldName: 'file',
  maxFiles: 1
};

/**
 * Create file filter function for multer
 */
function createFileFilter(options: UploadOptions) {
  return (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    // Check mime type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error(`File type not allowed: ${file.mimetype}`));
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = path.extname(file.originalname).toLowerCase();
      if (!options.allowedExtensions.includes(extension)) {
        return callback(new Error(`File extension not allowed: ${extension}`));
      }
    }

    // Validate filename
    if (!file.originalname || file.originalname.trim().length === 0) {
      return callback(new Error('Invalid filename'));
    }

    // Check for potentially dangerous filenames
    const dangerousPattern = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousPattern.test(file.originalname)) {
      return callback(new Error('Filename contains invalid characters'));
    }

    callback(null, true);
  };
}

/**
 * Create multer upload middleware
 */
function createUploadMiddleware(options: UploadOptions) {
  const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for processing
    limits: {
      fileSize: options.maxFileSize,
      files: options.maxFiles || 1,
      fields: 10,
      fieldNameSize: 100,
      fieldSize: 1024 * 1024 // 1MB for form fields
    },
    fileFilter: createFileFilter(options)
  });

  return options.maxFiles === 1 
    ? upload.single(options.fieldName || 'file')
    : upload.array(options.fieldName || 'files', options.maxFiles);
}

/**
 * Error handling middleware for multer errors
 */
export function handleUploadErrors() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
      let message: string;
      let statusCode = 400;

      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File too large';
          statusCode = 413;
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected field name';
          break;
        case 'LIMIT_FIELD_KEY':
          message = 'Field name too long';
          break;
        case 'LIMIT_FIELD_VALUE':
          message = 'Field value too long';
          break;
        case 'LIMIT_FIELD_COUNT':
          message = 'Too many fields';
          break;
        case 'LIMIT_PART_COUNT':
          message = 'Too many parts';
          break;
        default:
          message = 'File upload error';
      }

      return res.status(statusCode).json({
        error: 'UPLOAD_ERROR',
        message,
        details: { code: error.code }
      });
    }

    // Handle custom file filter errors
    if (error.message && typeof error.message === 'string') {
      if (error.message.includes('File type not allowed') || 
          error.message.includes('File extension not allowed')) {
        return res.status(415).json({
          error: 'INVALID_FILE_TYPE',
          message: error.message
        });
      }

      if (error.message.includes('Invalid filename') || 
          error.message.includes('invalid characters')) {
        return res.status(400).json({
          error: 'INVALID_FILENAME',
          message: error.message
        });
      }
    }

    next(error);
  };
}

/**
 * Middleware to validate required file upload
 */
export function requireFile(fieldName: string = 'file') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
      return res.status(400).json({
        error: 'MISSING_FILE',
        message: `File upload is required in field '${fieldName}'`
      });
    }
    next();
  };
}

/**
 * Middleware to convert multer file to our UploadedFileInfo interface
 */
export function convertFileFormat() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      // Convert single file
      (req as any).uploadedFile = {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer,
        size: req.file.size
      } as UploadedFileInfo;
    }

    if (req.files && Array.isArray(req.files)) {
      // Convert file array
      (req as any).uploadedFiles = req.files.map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size
      })) as UploadedFileInfo[];
    }

    next();
  };
}

/**
 * Pre-configured upload middleware for CV assets
 */
export const uploadAsset = [
  createUploadMiddleware(defaultAssetOptions),
  handleUploadErrors(),
  requireFile(),
  convertFileFormat()
];

/**
 * Pre-configured upload middleware for CV assets (multiple files)
 */
export function uploadAssets(maxFiles: number = 5) {
  return [
    createUploadMiddleware({
      ...defaultAssetOptions,
      maxFiles,
      fieldName: 'files'
    }),
    handleUploadErrors(),
    requireFile('files'),
    convertFileFormat()
  ];
}

/**
 * Pre-configured upload middleware for profile images
 */
export const uploadProfileImage = [
  createUploadMiddleware({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    fieldName: 'image',
    maxFiles: 1
  }),
  handleUploadErrors(),
  requireFile('image'),
  convertFileFormat()
];

/**
 * Pre-configured upload middleware for document uploads
 */
export const uploadDocument = [
  createUploadMiddleware({
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.txt', '.md', '.doc', '.docx'],
    fieldName: 'document',
    maxFiles: 1
  }),
  handleUploadErrors(),
  requireFile('document'),
  convertFileFormat()
];

/**
 * Custom upload middleware factory
 */
export function createCustomUpload(options: UploadOptions) {
  return [
    createUploadMiddleware({ ...defaultAssetOptions, ...options }),
    handleUploadErrors(),
    requireFile(options.fieldName),
    convertFileFormat()
  ];
}

/**
 * Middleware to log upload information (for debugging)
 */
export function logUpload() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      console.log('File uploaded:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    if (req.files && Array.isArray(req.files)) {
      console.log(`${req.files.length} files uploaded:`, 
        req.files.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size
        }))
      );
    }

    next();
  };
}

/**
 * Type declarations for Express Request object extensions
 */
declare global {
  namespace Express {
    interface Request {
      uploadedFile?: UploadedFileInfo;
      uploadedFiles?: UploadedFileInfo[];
    }
  }
}