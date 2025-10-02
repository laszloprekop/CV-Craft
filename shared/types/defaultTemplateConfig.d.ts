/**
 * Default Template Configuration
 *
 * Provides a comprehensive default configuration for CV templates
 */
import type { TemplateConfig } from './index';
export declare const DEFAULT_TEMPLATE_CONFIG: TemplateConfig;
/**
 * Create a customized template config by merging with defaults
 */
export declare function createTemplateConfig(overrides?: Partial<TemplateConfig>): TemplateConfig;
/**
 * Validate template config structure
 */
export declare function validateTemplateConfig(config: any): config is TemplateConfig;
//# sourceMappingURL=defaultTemplateConfig.d.ts.map