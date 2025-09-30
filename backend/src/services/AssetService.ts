/**
 * Asset Service
 * 
 * Business logic for asset management including file upload, validation, and storage
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import sharp from 'sharp';
import type { Asset } from '../../../shared/types';
import type { AssetModel, CreateAssetData, UpdateAssetData, ListAssetsOptions } from '../models/Asset';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface AssetUploadOptions {
  cv_id: string;
  usage_context?: string;
  generateThumbnails?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface AssetProcessingResult {
  asset: Asset;
  thumbnailPaths?: string[];
}

export interface AssetValidationOptions {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  requireImageDimensions?: boolean;
}

export class AssetServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AssetServiceError';
  }
}

export class AssetService {
  private readonly storageBasePath: string;
  private readonly publicBasePath: string;
  
  private readonly defaultValidation: AssetValidationOptions = {
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
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.txt', '.md', '.doc', '.docx']
  };

  constructor(
    private assetModel: AssetModel,
    storageBasePath: string = './storage/assets',
    publicBasePath: string = '/assets'
  ) {
    this.storageBasePath = path.resolve(storageBasePath);
    this.publicBasePath = publicBasePath;
  }

  /**
   * Upload and process a file
   */
  async uploadFile(
    file: UploadedFile,
    options: AssetUploadOptions,
    validation?: Partial<AssetValidationOptions>
  ): Promise<AssetProcessingResult> {
    const validationRules = { ...this.defaultValidation, ...validation };
    
    // Validate file
    this.validateFile(file, validationRules);
    
    // Generate unique ID and file paths
    const assetId = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${assetId}${fileExtension}`;
    const storagePath = path.join(this.storageBasePath, fileName);
    const relativePath = fileName;
    
    // Ensure storage directory exists
    await this.ensureStorageDirectory();
    
    // Save file to storage
    await fs.writeFile(storagePath, file.buffer);
    
    // Process image metadata if applicable
    let metadata: any = {};
    if (this.isImageFile(file.mimetype)) {
      metadata = await this.extractImageMetadata(file.buffer);
    }
    
    // Create asset data
    const assetData: CreateAssetData = {
      id: assetId,
      cv_id: options.cv_id,
      filename: file.originalname,
      file_type: this.determineFileType(file.mimetype),
      mime_type: file.mimetype,
      file_size: file.size,
      storage_path: relativePath,
      usage_context: options.usage_context,
      metadata
    };
    
    // Save to database
    const asset = this.assetModel.create(assetData);
    
    // Generate thumbnails for images if requested
    let thumbnailPaths: string[] = [];
    if (options.generateThumbnails && this.isImageFile(file.mimetype) && file.mimetype !== 'image/svg+xml') {
      thumbnailPaths = await this.generateThumbnails(assetId, file.buffer, fileExtension);
    }
    
    return {
      asset,
      thumbnailPaths
    };
  }

  /**
   * Get asset by ID
   */
  async getById(id: string): Promise<Asset> {
    const asset = this.assetModel.findById(id);
    if (!asset) {
      throw new AssetServiceError('Asset not found', 'ASSET_NOT_FOUND', 404);
    }
    return asset;
  }

  /**
   * List assets with filtering and pagination
   */
  async list(options: ListAssetsOptions = {}): Promise<{ data: Asset[]; total: number }> {
    return this.assetModel.list(options);
  }

  /**
   * Update asset metadata
   */
  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    const existingAsset = await this.getById(id);
    
    // Only allow updating certain fields
    const allowedUpdates: UpdateAssetData = {};
    
    if (data.filename !== undefined) {
      allowedUpdates.filename = data.filename.trim();
    }
    
    if (data.usage_context !== undefined) {
      allowedUpdates.usage_context = data.usage_context.trim() || undefined;
    }
    
    if (data.metadata !== undefined) {
      allowedUpdates.metadata = data.metadata;
    }
    
    return this.assetModel.update(id, allowedUpdates);
  }

  /**
   * Delete asset and its files
   */
  async delete(id: string): Promise<void> {
    const asset = await this.getById(id);
    
    // Delete physical file
    const filePath = path.join(this.storageBasePath, asset.storage_path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, continue with database deletion
      console.warn(`Failed to delete asset file: ${filePath}`, error);
    }
    
    // Delete thumbnails if they exist
    await this.deleteThumbnails(asset.id);
    
    // Delete from database
    this.assetModel.delete(id);
  }

  /**
   * Get assets by CV ID
   */
  async getByCV(cvId: string): Promise<Asset[]> {
    return this.assetModel.findByCV(cvId);
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    total_count: number;
    total_size: number;
    by_type: { type: string; count: number; size: number }[];
    by_cv: { cv_id: string; count: number; size: number }[];
  }> {
    return this.assetModel.getStats();
  }

  /**
   * Get storage usage for specific CV
   */
  async getCVStorageUsage(cvId: string): Promise<number> {
    return this.assetModel.getStorageUsedByCV(cvId);
  }

  /**
   * Delete all assets for a CV
   */
  async deleteAllForCV(cvId: string): Promise<number> {
    const assets = await this.getByCV(cvId);
    
    // Delete physical files
    for (const asset of assets) {
      const filePath = path.join(this.storageBasePath, asset.storage_path);
      try {
        await fs.unlink(filePath);
        await this.deleteThumbnails(asset.id);
      } catch (error) {
        console.warn(`Failed to delete asset file: ${filePath}`, error);
      }
    }
    
    // Delete from database
    return this.assetModel.deleteAllForCV(cvId);
  }

  /**
   * Get asset file path for serving
   */
  getAssetPath(asset: Asset): string {
    return path.join(this.storageBasePath, asset.storage_path);
  }

  /**
   * Get public URL for asset
   */
  getPublicUrl(asset: Asset): string {
    return `${this.publicBasePath}/${asset.storage_path}`;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: UploadedFile, validation: AssetValidationOptions): void {
    // Check file size
    if (file.size > validation.maxFileSize) {
      throw new AssetServiceError(
        `File too large. Maximum size is ${Math.round(validation.maxFileSize / 1024 / 1024)}MB`,
        'FILE_TOO_LARGE',
        413
      );
    }

    // Check mime type
    if (!validation.allowedMimeTypes.includes(file.mimetype)) {
      throw new AssetServiceError(
        `File type not allowed: ${file.mimetype}`,
        'INVALID_FILE_TYPE',
        415
      );
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!validation.allowedExtensions.includes(extension)) {
      throw new AssetServiceError(
        `File extension not allowed: ${extension}`,
        'INVALID_FILE_EXTENSION',
        415
      );
    }

    // Validate filename
    if (!file.originalname || file.originalname.trim().length === 0) {
      throw new AssetServiceError(
        'Invalid filename',
        'INVALID_FILENAME'
      );
    }
  }

  /**
   * Determine file type category
   */
  private determineFileType(mimeType: string): 'image' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    const documentTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (documentTypes.includes(mimeType)) {
      return 'document';
    }
    
    return 'other';
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Extract image metadata using Sharp
   */
  private async extractImageMetadata(buffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      console.warn('Failed to extract image metadata:', error);
      return {};
    }
  }

  /**
   * Generate thumbnails for images
   */
  private async generateThumbnails(assetId: string, buffer: Buffer, extension: string): Promise<string[]> {
    const thumbnailSizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 }
    ];

    const thumbnailPaths: string[] = [];

    for (const size of thumbnailSizes) {
      try {
        const thumbnailFileName = `${assetId}_${size.name}${extension}`;
        const thumbnailPath = path.join(this.storageBasePath, 'thumbnails', thumbnailFileName);
        
        // Ensure thumbnails directory exists
        await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
        
        // Generate thumbnail
        await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
          
        thumbnailPaths.push(path.relative(this.storageBasePath, thumbnailPath));
      } catch (error) {
        console.warn(`Failed to generate ${size.name} thumbnail:`, error);
      }
    }

    return thumbnailPaths;
  }

  /**
   * Delete thumbnails for an asset
   */
  private async deleteThumbnails(assetId: string): Promise<void> {
    const thumbnailSizes = ['small', 'medium', 'large'];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const size of thumbnailSizes) {
      for (const ext of extensions) {
        const thumbnailFileName = `${assetId}_${size}${ext}`;
        const thumbnailPath = path.join(this.storageBasePath, 'thumbnails', thumbnailFileName);
        
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          // Thumbnail might not exist, continue
        }
      }
    }
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageBasePath, { recursive: true });
      await fs.mkdir(path.join(this.storageBasePath, 'thumbnails'), { recursive: true });
    } catch (error) {
      throw new AssetServiceError(
        'Failed to create storage directory',
        'STORAGE_ERROR',
        500
      );
    }
  }

  /**
   * Clean up orphaned files (files in storage but not in database)
   */
  async cleanupOrphanedFiles(): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];

    try {
      const files = await fs.readdir(this.storageBasePath);
      
      for (const file of files) {
        if (file === 'thumbnails') continue; // Skip thumbnails directory
        
        const filePath = path.join(this.storageBasePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          // Extract asset ID from filename (assuming UUID format)
          const assetId = path.parse(file).name;
          
          if (!this.assetModel.exists(assetId)) {
            try {
              await fs.unlink(filePath);
              deleted.push(file);
            } catch (error) {
              errors.push(`Failed to delete ${file}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to read storage directory: ${error}`);
    }

    return { deleted, errors };
  }
}

/**
 * Factory function to create Asset service
 */
export function createAssetService(
  assetModel: AssetModel,
  storageBasePath?: string,
  publicBasePath?: string
): AssetService {
  return new AssetService(assetModel, storageBasePath, publicBasePath);
}