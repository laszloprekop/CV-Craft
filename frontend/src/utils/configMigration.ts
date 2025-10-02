/**
 * Template Config Migration Utilities
 *
 * Migrates old config structures to new font sizing system
 */

import type { TemplateConfig } from '../../../shared/types'

/**
 * Migrate old fontSize structure to new baseFontSize + fontScale structure
 *
 * Old structure:
 *   typography.fontSize: { h1: "32px", h2: "24px", ... }
 *
 * New structure:
 *   typography.baseFontSize: "10pt"
 *   typography.fontScale: { h1: 3.2, h2: 2.4, ... }
 */
export function migrateTemplateConfig(config: TemplateConfig | undefined): TemplateConfig | undefined {
  if (!config) return undefined

  // If already has new structure, return as-is
  if (config.typography?.baseFontSize && config.typography?.fontScale) {
    return config
  }

  // If missing baseFontSize, add it
  if (!config.typography?.baseFontSize) {
    const migrated = { ...config }

    // Default base font size
    let baseFontSize = '10pt'

    // If has old fontSize structure, extract base from it
    if (config.typography?.fontSize) {
      const bodySize = config.typography.fontSize.body || '16px'
      baseFontSize = extractBaseFontSize(bodySize)
    }

    // Calculate scale ratios based on old absolute sizes (or use defaults)
    const fontScale = {
      h1: config.typography?.fontSize?.h1
        ? calculateScale(config.typography.fontSize.h1, baseFontSize)
        : 3.2,
      h2: config.typography?.fontSize?.h2
        ? calculateScale(config.typography.fontSize.h2, baseFontSize)
        : 2.4,
      h3: config.typography?.fontSize?.h3
        ? calculateScale(config.typography.fontSize.h3, baseFontSize)
        : 2.0,
      body: config.typography?.fontSize?.body
        ? calculateScale(config.typography.fontSize.body, baseFontSize)
        : 1.6,
      small: config.typography?.fontSize?.small
        ? calculateScale(config.typography.fontSize.small, baseFontSize)
        : 1.4,
      tiny: config.typography?.fontSize?.tiny
        ? calculateScale(config.typography.fontSize.tiny, baseFontSize)
        : 1.2
    }

    migrated.typography = {
      ...config.typography,
      baseFontSize,
      fontScale,
      // Keep legacy fontSize for backward compatibility if it exists
      fontSize: config.typography?.fontSize
    }

    return migrated
  }

  return config
}

/**
 * Extract base font size from a CSS size string
 * Default to 10pt if body is 16px (common ratio)
 */
function extractBaseFontSize(sizeString: string): string {
  const value = parseFloat(sizeString)
  const unit = sizeString.replace(/[0-9.]/g, '')

  // Default mapping: 16px → 10pt base (1.6x scale for body)
  if (unit === 'px') {
    // Convert px to pt (approx 0.75 ratio for print)
    const basePt = Math.round((value / 1.6) * 100) / 100
    return `${basePt}pt`
  } else if (unit === 'pt') {
    // If already in pt, use value/1.6 as base
    const basePt = Math.round((value / 1.6) * 100) / 100
    return `${basePt}pt`
  } else if (unit === 'rem') {
    // For rem, assume 1rem = 16px, so base = 10pt
    return '10pt'
  }

  // Fallback to 10pt
  return '10pt'
}

/**
 * Calculate scale ratio between a size and base
 */
function calculateScale(sizeString: string, baseString: string): number {
  const sizeValue = parseFloat(sizeString)
  const baseValue = parseFloat(baseString)

  // Calculate ratio
  const scale = sizeValue / baseValue

  // Round to 1 decimal place
  return Math.round(scale * 10) / 10
}

/**
 * Validate that a TemplateConfig has all required fields
 */
export function validateTemplateConfig(config: TemplateConfig): boolean {
  if (!config.typography) return false
  if (!config.typography.baseFontSize) return false
  if (!config.typography.fontScale) return false
  if (!config.typography.fontFamily) return false
  if (!config.colors) return false
  if (!config.layout) return false

  return true
}

/**
 * Merge config with defaults, ensuring all required fields exist
 */
export function mergeWithDefaults(
  config: Partial<TemplateConfig> | undefined,
  defaults: TemplateConfig
): TemplateConfig {
  if (!config) return defaults

  return {
    colors: { ...defaults.colors, ...config.colors },
    typography: {
      baseFontSize: config.typography?.baseFontSize || defaults.typography.baseFontSize,
      fontFamily: { ...defaults.typography.fontFamily, ...config.typography?.fontFamily },
      fontScale: { ...defaults.typography.fontScale, ...config.typography?.fontScale },
      fontSize: config.typography?.fontSize, // Optional legacy field
      fontWeight: { ...defaults.typography.fontWeight, ...config.typography?.fontWeight },
      lineHeight: { ...defaults.typography.lineHeight, ...config.typography?.lineHeight },
      letterSpacing: config.typography?.letterSpacing || defaults.typography.letterSpacing
    },
    layout: { ...defaults.layout, ...config.layout },
    components: { ...defaults.components, ...config.components },
    pdf: { ...defaults.pdf, ...config.pdf },
    advanced: config.advanced || defaults.advanced
  }
}
