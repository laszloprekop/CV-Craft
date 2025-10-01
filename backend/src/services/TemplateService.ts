/**
 * Template Service
 * 
 * Business logic layer for template operations, including validation and CSS processing
 */

import { TemplateModel, CreateTemplateData, UpdateTemplateData, ListTemplatesOptions } from '../models/Template';
import type { Template, TemplateConfig, TemplateConfigSchema, TemplateSettings } from '../../../shared/types';
import { DEFAULT_TEMPLATE_CONFIG } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTemplateServiceData {
  name: string;
  description?: string;
  css: string;
  config_schema: TemplateConfigSchema;
  default_config?: TemplateConfig;
  default_settings: TemplateSettings;
  preview_image?: string;
  version?: string;
}

export interface UpdateTemplateServiceData {
  name?: string;
  description?: string;
  css?: string;
  config_schema?: TemplateConfigSchema;
  default_config?: TemplateConfig;
  default_settings?: TemplateSettings;
  preview_image?: string;
  is_active?: boolean;
  version?: string;
}

export class TemplateService {
  constructor(private templateModel: TemplateModel) {}

  /**
   * Create a new template with validation
   */
  async create(data: CreateTemplateServiceData): Promise<Template> {
    // Validate template data
    this.validateTemplateData(data);

    // Validate and process CSS
    const processedCSS = await this.validateAndProcessCSS(data.css);

    // Validate config schema
    this.validateConfigSchema(data.config_schema);

    // Validate default settings against schema
    this.validateSettings(data.default_settings, data.config_schema);

    const createData: CreateTemplateData = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      css: processedCSS,
      config_schema: data.config_schema,
      default_config: data.default_config || DEFAULT_TEMPLATE_CONFIG,
      default_settings: data.default_settings,
      preview_image: data.preview_image,
      version: data.version || '1.0.0'
    };

    return this.templateModel.create(createData);
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<Template> {
    const template = this.templateModel.findById(id);
    if (!template) {
      throw new TemplateServiceError('Template not found', 'NOT_FOUND');
    }
    return template;
  }

  /**
   * List templates with filtering and pagination
   */
  async list(options: ListTemplatesOptions = {}): Promise<{ data: Template[]; total: number }> {
    return this.templateModel.list(options);
  }

  /**
   * Update template with validation
   */
  async update(id: string, data: UpdateTemplateServiceData): Promise<Template> {
    // Validate the template exists
    const existingTemplate = await this.getById(id);

    const updateData: UpdateTemplateData = {};

    if (data.name !== undefined) {
      this.validateName(data.name);
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.css !== undefined) {
      updateData.css = await this.validateAndProcessCSS(data.css);
    }

    if (data.config_schema !== undefined) {
      this.validateConfigSchema(data.config_schema);
      updateData.config_schema = data.config_schema;
      
      // If config schema is being updated, validate current default settings still work
      const settingsToValidate = data.default_settings || existingTemplate.default_settings;
      this.validateSettings(settingsToValidate, data.config_schema);
    }

    if (data.default_config !== undefined) {
      updateData.default_config = data.default_config;
    }

    if (data.default_settings !== undefined) {
      const schemaToValidate = data.config_schema || existingTemplate.config_schema;
      this.validateSettings(data.default_settings, schemaToValidate);
      updateData.default_settings = data.default_settings;
    }

    if (data.preview_image !== undefined) {
      updateData.preview_image = data.preview_image;
    }

    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
    }

    if (data.version !== undefined) {
      this.validateVersion(data.version);
      updateData.version = data.version;
    }

    return this.templateModel.update(id, updateData);
  }

  /**
   * Delete template (with usage check)
   */
  async delete(id: string): Promise<void> {
    // Check if template exists
    await this.getById(id);

    // Check if template is in use
    const inUse = this.templateModel.isInUse(id);
    if (inUse) {
      throw new TemplateServiceError(
        'Cannot delete template that is in use by CV instances', 
        'TEMPLATE_IN_USE'
      );
    }

    return this.templateModel.delete(id);
  }

  /**
   * Deactivate template (soft delete)
   */
  async deactivate(id: string): Promise<Template> {
    return this.templateModel.deactivate(id);
  }

  /**
   * Activate template
   */
  async activate(id: string): Promise<Template> {
    return this.templateModel.activate(id);
  }

  /**
   * Search templates by name
   */
  async searchByName(name: string, activeOnly: boolean = true): Promise<Template[]> {
    if (!name.trim()) {
      throw new TemplateServiceError('Search name cannot be empty', 'INVALID_SEARCH');
    }
    return this.templateModel.findByName(name.trim(), activeOnly);
  }

  /**
   * Get template usage stats
   */
  async getUsageStats(id: string): Promise<{ in_use: boolean; cv_count: number }> {
    // Check if template exists
    await this.getById(id);

    const inUse = this.templateModel.isInUse(id);
    
    // For now, just return basic usage info
    // In a more complete implementation, we could count exact CV instances
    return {
      in_use: inUse,
      cv_count: inUse ? 1 : 0 // Placeholder - would need proper count query
    };
  }

  /**
   * Validate template configuration schema
   */
  validateConfigSchema(schema: TemplateConfigSchema): void {
    if (!schema || typeof schema !== 'object') {
      throw new TemplateServiceError('Config schema must be an object', 'INVALID_SCHEMA');
    }

    if (schema.type !== 'object') {
      throw new TemplateServiceError('Config schema type must be "object"', 'INVALID_SCHEMA');
    }

    if (!schema.properties || typeof schema.properties !== 'object') {
      throw new TemplateServiceError('Config schema must have properties', 'INVALID_SCHEMA');
    }

    // Validate each property
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (!prop.type || !['string', 'number', 'boolean', 'object'].includes(prop.type)) {
        throw new TemplateServiceError(
          `Invalid property type for ${key}: ${prop.type}`, 
          'INVALID_SCHEMA'
        );
      }
    }
  }

  /**
   * Validate template settings against config schema
   */
  validateSettings(settings: TemplateSettings, schema: TemplateConfigSchema): void {
    if (!settings || typeof settings !== 'object') {
      throw new TemplateServiceError('Settings must be an object', 'INVALID_SETTINGS');
    }

    // Check required properties
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in settings)) {
          throw new TemplateServiceError(
            `Missing required setting: ${requiredField}`, 
            'INVALID_SETTINGS'
          );
        }
      }
    }

    // Validate each setting against schema
    for (const [key, value] of Object.entries(settings)) {
      const property = schema.properties[key];
      if (property) {
        this.validateSettingValue(key, value, property);
      }
    }
  }

  // Private validation methods

  private validateTemplateData(data: CreateTemplateServiceData): void {
    this.validateName(data.name);
    
    if (!data.css || typeof data.css !== 'string') {
      throw new TemplateServiceError('CSS is required and must be a string', 'INVALID_CSS');
    }

    if (data.version) {
      this.validateVersion(data.version);
    }
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new TemplateServiceError('Name is required and must be a string', 'INVALID_NAME');
    }

    if (name.length > 50) {
      throw new TemplateServiceError('Name must be 50 characters or less', 'INVALID_NAME');
    }

    if (name.trim().length === 0) {
      throw new TemplateServiceError('Name cannot be empty', 'INVALID_NAME');
    }
  }

  private validateVersion(version: string): void {
    if (!version || typeof version !== 'string') {
      throw new TemplateServiceError('Version must be a string', 'INVALID_VERSION');
    }

    // Validate semantic versioning format
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    if (!semverRegex.test(version)) {
      throw new TemplateServiceError(
        'Version must follow semantic versioning (e.g., 1.0.0)', 
        'INVALID_VERSION'
      );
    }
  }

  private async validateAndProcessCSS(css: string): Promise<string> {
    if (!css || typeof css !== 'string') {
      throw new TemplateServiceError('CSS is required and must be a string', 'INVALID_CSS');
    }

    // Basic CSS validation - check for balanced braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new TemplateServiceError('CSS has unbalanced braces', 'INVALID_CSS');
    }

    // TODO: More sophisticated CSS validation could be added here
    // For now, return as-is
    return css.trim();
  }

  private validateSettingValue(key: string, value: any, property: any): void {
    const expectedType = property.type;
    const actualType = typeof value;

    if (expectedType === 'string' && actualType !== 'string') {
      throw new TemplateServiceError(
        `Setting ${key} must be a string`, 
        'INVALID_SETTINGS'
      );
    }

    if (expectedType === 'number' && actualType !== 'number') {
      throw new TemplateServiceError(
        `Setting ${key} must be a number`, 
        'INVALID_SETTINGS'
      );
    }

    if (expectedType === 'boolean' && actualType !== 'boolean') {
      throw new TemplateServiceError(
        `Setting ${key} must be a boolean`, 
        'INVALID_SETTINGS'
      );
    }

    // Validate enum values
    if (property.enum && !property.enum.includes(value)) {
      throw new TemplateServiceError(
        `Setting ${key} must be one of: ${property.enum.join(', ')}`, 
        'INVALID_SETTINGS'
      );
    }
  }
}

/**
 * Template Service Error class
 */
export class TemplateServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TemplateServiceError';
  }
}

/**
 * Factory function to create Template service
 */
export function createTemplateService(templateModel: TemplateModel): TemplateService {
  return new TemplateService(templateModel);
}