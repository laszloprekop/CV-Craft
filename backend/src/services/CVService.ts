/**
 * CV Service
 * 
 * Business logic layer for CV operations, integrating with CV Parser and database models
 */

import { CVInstanceModel, CreateCVInstanceData, UpdateCVInstanceData, ListCVInstancesOptions } from '../models/CVInstance';
import { CVParser, parseCV, validateCVContent } from '../lib/cv-parser';
import { getPDFGenerator } from '../lib/pdf-generator';
import type { CVInstance, ParsedCVContent, TemplateSettings, TemplateConfig, Template } from '../../../shared/types';
import path from 'path';
import fs from 'fs/promises';
import { TemplateModel } from '../models/Template';

export interface CreateCVServiceData {
  name: string;
  content: string;
  template_id: string;
  config?: TemplateConfig;
  settings?: TemplateSettings;
}

export interface UpdateCVServiceData {
  name?: string;
  content?: string;
  template_id?: string;
  config?: TemplateConfig;
  settings?: TemplateSettings;
  status?: 'active' | 'archived';
}

/**
 * CV Export Result interface
 */
export interface CVExportResult {
  filename: string;
  file_path: string;
  size: number;
  generated_at: string;
}

export class CVService {
  constructor(
    private cvModel: CVInstanceModel,
    private templateModel: TemplateModel,
    private parser: CVParser = new CVParser()
  ) {}

  /**
   * Create a new CV with Markdown parsing and validation
   */
  async create(data: CreateCVServiceData): Promise<CVInstance> {
    // Validate CV content format
    const validation = validateCVContent(data.content);
    if (!validation.valid) {
      throw new CVServiceError(
        `Invalid CV content: ${validation.errors.join(', ')}`,
        'INVALID_CONTENT'
      );
    }

    // Get template to access its config
    const template = this.templateModel.findById(data.template_id);
    if (!template) {
      throw new CVServiceError(`Template not found: ${data.template_id}`, 'TEMPLATE_NOT_FOUND');
    }

    // Merge template config with user config
    const finalConfig = data.config || template.default_config;

    // Parse Markdown content with config for HTML generation
    let parsedContent: ParsedCVContent;
    try {
      parsedContent = await parseCV(data.content, {}, finalConfig);
    } catch (error) {
      throw new CVServiceError(
        `Failed to parse CV content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR'
      );
    }

    // Create CV instance
    const createData: CreateCVInstanceData = {
      name: data.name,
      content: data.content,
      parsed_content: parsedContent,
      template_id: data.template_id,
      config: data.config,
      settings: data.settings,
      metadata: {
        parsed_at: new Date().toISOString(),
        sections_count: parsedContent.sections.length,
        has_photo: !!parsedContent.frontmatter.photo,
        word_count: this.calculateWordCount(data.content)
      }
    };

    return this.cvModel.create(createData);
  }

  /**
   * Get CV by ID
   */
  async getById(id: string): Promise<CVInstance> {
    const cv = this.cvModel.findById(id);
    if (!cv) {
      throw new CVServiceError('CV not found', 'NOT_FOUND');
    }
    return cv;
  }

  /**
   * List CVs with filtering and pagination
   */
  async list(options: ListCVInstancesOptions = {}) {
    return this.cvModel.list(options);
  }

  /**
   * Update CV with optional content re-parsing
   */
  async update(id: string, data: UpdateCVServiceData): Promise<CVInstance> {
    // Get existing CV to access template and config
    const existingCV = this.cvModel.findById(id);
    if (!existingCV) {
      throw new CVServiceError(`CV not found: ${id}`, 'NOT_FOUND');
    }

    const updateData: UpdateCVInstanceData = {
      name: data.name,
      template_id: data.template_id,
      config: data.config,
      settings: data.settings,
      status: data.status
    };

    // If content is being updated, re-parse it
    if (data.content !== undefined) {
      // Validate new content
      const validation = validateCVContent(data.content);
      if (!validation.valid) {
        throw new CVServiceError(
          `Invalid CV content: ${validation.errors.join(', ')}`,
          'INVALID_CONTENT'
        );
      }

      // Get template for config
      const template_id = data.template_id || existingCV.template_id;
      const template = this.templateModel.findById(template_id);
      if (!template) {
        throw new CVServiceError(`Template not found: ${template_id}`, 'TEMPLATE_NOT_FOUND');
      }

      // Use provided config or existing config or template default
      const finalConfig = data.config || existingCV.config || template.default_config;

      // Parse new content with config for HTML generation
      let parsedContent: ParsedCVContent;
      try {
        parsedContent = await parseCV(data.content, {}, finalConfig);
      } catch (error) {
        throw new CVServiceError(
          `Failed to parse CV content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'PARSE_ERROR'
        );
      }

      updateData.content = data.content;
      updateData.parsed_content = parsedContent;

      // Update metadata
      updateData.metadata = {
        ...existingCV.metadata,
        parsed_at: new Date().toISOString(),
        sections_count: parsedContent.sections.length,
        has_photo: !!parsedContent.frontmatter.photo,
        word_count: this.calculateWordCount(data.content),
        last_content_update: new Date().toISOString()
      };
    }

    return this.cvModel.update(id, updateData);
  }

  /**
   * Delete CV (soft delete)
   */
  async delete(id: string): Promise<void> {
    return this.cvModel.delete(id);
  }

  /**
   * Duplicate CV with new name
   */
  async duplicate(id: string, newName: string): Promise<CVInstance> {
    return this.cvModel.duplicate(id, newName);
  }

  /**
   * Archive CV
   */
  async archive(id: string): Promise<CVInstance> {
    return this.update(id, { status: 'archived' });
  }

  /**
   * Restore CV from archive
   */
  async restore(id: string): Promise<CVInstance> {
    return this.update(id, { status: 'active' });
  }

  /**
   * Get CV statistics
   */
  async getStats(id: string): Promise<CVStats> {
    const cv = await this.getById(id);
    
    if (!cv.parsed_content) {
      throw new CVServiceError('CV content not parsed', 'UNPARSED_CONTENT');
    }

    const stats: CVStats = {
      sections_count: cv.parsed_content.sections.length,
      word_count: cv.metadata?.word_count || this.calculateWordCount(cv.content),
      character_count: cv.content.length,
      has_contact_info: this.hasRequiredContactInfo(cv.parsed_content.frontmatter),
      sections: cv.parsed_content.sections.map(section => ({
        title: section.title || 'Untitled',
        type: section.type,
        word_count: this.calculateSectionWordCount(section)
      })),
      last_updated: cv.updated_at,
      template_id: cv.template_id,
      status: cv.status
    };

    return stats;
  }

  /**
   * Search CVs by content
   */
  async search(query: string, options: ListCVInstancesOptions = {}): Promise<{ data: CVInstance[]; total: number }> {
    // For now, implement basic name search
    // TODO: Implement full-text search across content
    const allCVs = this.cvModel.list(options);
    
    if (!query.trim()) {
      return allCVs;
    }

    const filteredData = allCVs.data.filter(cv => 
      cv.name.toLowerCase().includes(query.toLowerCase()) ||
      cv.content.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filteredData,
      total: filteredData.length
    };
  }

  /**
   * Validate CV content before operations
   */
  validateContent(content: string): { valid: boolean; errors: string[] } {
    return validateCVContent(content);
  }

  /**
   * Re-parse existing CV content (useful for migrations)
   */
  async reparse(id: string): Promise<CVInstance> {
    const cv = await this.getById(id);

    // Get template for config
    const template = this.templateModel.findById(cv.template_id);
    if (!template) {
      throw new CVServiceError(`Template not found: ${cv.template_id}`, 'TEMPLATE_NOT_FOUND');
    }

    // Use existing config or template default
    const finalConfig = cv.config || template.default_config;

    try {
      const parsedContent = await parseCV(cv.content, {}, finalConfig);
      
      return this.cvModel.update(id, {
        parsed_content: parsedContent,
        metadata: {
          ...cv.metadata,
          parsed_at: new Date().toISOString(),
          sections_count: parsedContent.sections.length,
          has_photo: !!parsedContent.frontmatter.photo,
          word_count: this.calculateWordCount(cv.content),
          reparsed_at: new Date().toISOString()
        }
      });
    } catch (error) {
      throw new CVServiceError(
        `Failed to re-parse CV content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR'
      );
    }
  }

  /**
   * Export CV to PDF or web package
   */
  async exportCV(id: string, exportType: 'pdf' | 'web_package', configOverride?: TemplateConfig): Promise<CVExportResult> {
    const cv = await this.getById(id);

    if (!cv.parsed_content) {
      throw new CVServiceError('CV content not parsed', 'UNPARSED_CONTENT');
    }

    // Get template
    const template = this.templateModel.findById(cv.template_id);
    if (!template) {
      throw new CVServiceError('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    // Generate filename based on CV data
    const name = cv.parsed_content.frontmatter.name || 'CV';
    const safeName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const filename = exportType === 'pdf'
      ? `${safeName}_CV.pdf`
      : `${safeName}_CV_web.zip`;

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const outputPath = path.join(exportsDir, filename);

    if (exportType === 'pdf') {
      // Generate PDF using Puppeteer
      const pdfGenerator = getPDFGenerator();

      // Use override config if provided, otherwise CV's config, otherwise template default
      const config = configOverride || cv.config || template.default_config;

      const result = await pdfGenerator.generatePDF({
        cv,
        template,
        config,
        outputPath
      });

      return {
        filename: result.filename,
        file_path: `/exports/${result.filename}`,
        size: result.size,
        generated_at: new Date().toISOString()
      };
    } else {
      // TODO: Implement web package generation with HTML/CSS/assets
      throw new CVServiceError('Web package export not yet implemented', 'NOT_IMPLEMENTED');
    }
  }

  // Private helper methods

  /**
   * Calculate word count in content
   */
  private calculateWordCount(content: string): number {
    // Remove frontmatter and count words in body
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
    return withoutFrontmatter
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  /**
   * Calculate word count for a section
   */
  private calculateSectionWordCount(section: { content: string | unknown[] | unknown }): number {
    if (typeof section.content === 'string') {
      return section.content
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 0).length;
    }

    if (Array.isArray(section.content)) {
      return section.content
        .map((item: unknown) => typeof item === 'string' ? item : JSON.stringify(item))
        .join(' ')
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 0).length;
    }

    return 0;
  }

  /**
   * Check if frontmatter has required contact information
   */
  private hasRequiredContactInfo(frontmatter: { name?: string; email?: string }): boolean {
    return !!(frontmatter.name && frontmatter.email);
  }
}

/**
 * CV Statistics interface
 */
export interface CVStats {
  sections_count: number;
  word_count: number;
  character_count: number;
  has_contact_info: boolean;
  sections: Array<{
    title: string;
    type: string;
    word_count: number;
  }>;
  last_updated: string;
  template_id: string;
  status: string;
}

/**
 * CV Service Error class
 */
export class CVServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CVServiceError';
  }
}

/**
 * Factory function to create CV service with dependencies
 */
export function createCVService(cvModel: CVInstanceModel, templateModel: TemplateModel): CVService {
  return new CVService(cvModel, templateModel);
}