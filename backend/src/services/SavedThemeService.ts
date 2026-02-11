/**
 * SavedTheme Service
 *
 * Business logic for saved theme preset operations
 */

import { SavedThemeModel, SavedThemeData } from '../models/SavedTheme';
import type { TemplateConfig } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class SavedThemeService {
  constructor(private model: SavedThemeModel) {}

  async create(name: string, config: TemplateConfig, templateId: string): Promise<SavedThemeData> {
    this.validateName(name);

    const existing = this.model.findByName(name);
    if (existing) {
      throw new SavedThemeServiceError('A theme with this name already exists', 'DUPLICATE_NAME');
    }

    return this.model.create({
      id: uuidv4(),
      name: name.trim(),
      config,
      template_id: templateId,
    });
  }

  async list(): Promise<SavedThemeData[]> {
    return this.model.list();
  }

  async getById(id: string): Promise<SavedThemeData> {
    const theme = this.model.findById(id);
    if (!theme) {
      throw new SavedThemeServiceError('Saved theme not found', 'NOT_FOUND');
    }
    return theme;
  }

  async update(id: string, data: { name?: string; config?: TemplateConfig }): Promise<SavedThemeData> {
    await this.getById(id);

    if (data.name !== undefined) {
      this.validateName(data.name);
      const existing = this.model.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new SavedThemeServiceError('A theme with this name already exists', 'DUPLICATE_NAME');
      }
      data.name = data.name.trim();
    }

    return this.model.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    this.model.delete(id);
  }

  private validateName(name: string): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new SavedThemeServiceError('Theme name is required', 'INVALID_NAME');
    }
    if (name.length > 100) {
      throw new SavedThemeServiceError('Theme name must be 100 characters or less', 'INVALID_NAME');
    }
  }
}

export class SavedThemeServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SavedThemeServiceError';
  }
}

export function createSavedThemeService(model: SavedThemeModel): SavedThemeService {
  return new SavedThemeService(model);
}
