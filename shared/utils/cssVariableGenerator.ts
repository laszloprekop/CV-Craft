/**
 * Shared CSS variable generation utility for CV-Craft
 * Used by both frontend (web preview) and backend (PDF generation)
 * This ensures consistent styling between preview and export
 */

import type { TemplateConfig } from '../types';
import { resolveSemanticColor, resolveColorPair, hexToRgba } from './colorResolver';

/**
 * Calculate font size based on scale and base font size
 */
function calculateFontSize(scale: number, baseFontSize: string): string {
  const baseValue = parseFloat(baseFontSize);
  const unit = baseFontSize.replace(/[0-9.]/g, '');
  return `${(baseValue * scale).toFixed(1)}${unit}`;
}

/**
 * Generate CSS variables from template configuration
 * This function is the single source of truth for CSS variable generation
 *
 * @param config - The template configuration
 * @returns Object mapping CSS variable names to their values
 */
export function generateCSSVariables(config: TemplateConfig): Record<string, string> {
  const baseFontSize = config.typography.baseFontSize || '10pt';
  const fontScale = config.typography.fontScale || {
    h1: 3.2,
    h2: 2.4,
    h3: 2.0,
    body: 1.6,
    small: 1.4,
    tiny: 1.2,
    tag: 1.3,
    dateLine: 1.3,
    inlineCode: 1.2
  };

  // Tags - use semantic color pairs with transparency
  const tagColorPair = config.components.tags?.colorPair || 'tertiary';
  const tagBgOpacity = config.components.tags?.backgroundOpacity ?? 0.2;
  const tagTextOpacity = config.components.tags?.textOpacity ?? 1.0;
  const { baseColor: tagBaseColor, onColor: tagOnColor } = resolveColorPair(tagColorPair, config);

  return {
    // Main Color Pairs - Background colors and their text colors
    '--primary-color': config.colors.primary,
    '--on-primary-color': config.colors.onPrimary,
    '--secondary-color': config.colors.secondary,
    '--on-secondary-color': config.colors.onSecondary,
    '--tertiary-color': config.colors.tertiary || config.colors.accent || '#f59e0b',
    '--on-tertiary-color': config.colors.onTertiary || '#ffffff',
    '--muted-color': config.colors.muted || '#f1f5f9',
    '--on-muted-color': config.colors.onMuted || '#334155',
    '--background-color': config.colors.background,
    '--on-background-color': config.colors.text.primary,

    // Legacy color variables for backward compatibility
    '--accent-color': config.colors.tertiary || config.colors.accent || '#f59e0b',
    '--surface-color': config.colors.secondary,
    '--text-color': config.colors.text.primary,
    '--text-secondary': config.colors.text.secondary,
    '--text-muted': config.colors.text.muted,

    // Border & Link colors
    '--border-color': config.colors.borders,
    '--link-color': resolveSemanticColor(
      config.components.links?.colorKey,
      config,
      config.components.links?.colorOpacity
    ) || config.components.links?.color || config.colors.links.default,
    '--link-hover-color': resolveSemanticColor(
      config.components.links?.hoverColorKey,
      config,
      config.components.links?.hoverColorOpacity
    ) || config.components.links?.hoverColor || config.colors.links.hover,

    // Typography
    '--font-family': config.typography.fontFamily.body,
    '--heading-font-family': config.typography.fontFamily.heading,

    // Font sizes - calculated from base + scale
    '--base-font-size': baseFontSize,
    '--title-font-size': calculateFontSize(fontScale.h1, baseFontSize),
    '--h2-font-size': calculateFontSize(fontScale.h2, baseFontSize),
    '--h3-font-size': calculateFontSize(fontScale.h3, baseFontSize),
    '--body-font-size': calculateFontSize(fontScale.body, baseFontSize),
    '--small-font-size': calculateFontSize(fontScale.small, baseFontSize),
    '--tiny-font-size': calculateFontSize(fontScale.tiny, baseFontSize),
    '--tag-font-size': calculateFontSize(fontScale.tag || 1.3, baseFontSize),
    '--date-line-font-size': calculateFontSize(fontScale.dateLine || 1.3, baseFontSize),
    '--inline-code-font-size': calculateFontSize(fontScale.inlineCode || 1.2, baseFontSize),

    // Font weights
    '--heading-weight': String(config.typography.fontWeight.heading || 700),
    '--subheading-weight': String(config.typography.fontWeight.subheading || 600),
    '--body-weight': String(config.typography.fontWeight.body || 400),
    '--bold-weight': String(config.typography.fontWeight.bold || 600),

    // Line heights
    '--heading-line-height': String(config.typography.lineHeight.heading || 1.2),
    '--body-line-height': String(config.typography.lineHeight.body || 1.6),
    '--compact-line-height': String(config.typography.lineHeight.compact || 1.4),

    // Layout
    '--page-width': config.layout.pageWidth,
    '--page-margin-top': config.layout.pageMargin.top,
    '--page-margin-right': config.layout.pageMargin.right,
    '--page-margin-bottom': config.layout.pageMargin.bottom,
    '--page-margin-left': config.layout.pageMargin.left,
    '--section-spacing': config.layout.sectionSpacing,
    '--paragraph-spacing': config.layout.paragraphSpacing,

    // Tags - semantic color pairs with opacity
    '--tag-bg-color': hexToRgba(tagBaseColor, tagBgOpacity),
    '--tag-text-color': hexToRgba(tagOnColor, tagTextOpacity),
    '--tag-border-radius': config.components.tags.borderRadius,
    '--tag-font-size-custom': config.components.tags?.fontSize || calculateFontSize(fontScale.tag || 1.3, baseFontSize),

    // Date Line
    '--date-line-color': resolveSemanticColor(
      config.components.dateLine.colorKey,
      config,
      config.components.dateLine.colorOpacity
    ),
    '--date-line-font-size-custom': config.components.dateLine?.fontSize || calculateFontSize(fontScale.dateLine || 1.3, baseFontSize),

    // Name (H1)
    '--name-font-size': config.components.name?.fontSize || calculateFontSize(fontScale.h1, baseFontSize),
    '--name-font-weight': String(config.components.name?.fontWeight || 700),
    '--name-color': resolveSemanticColor(
      config.components.name?.colorKey,
      config,
      config.components.name?.colorOpacity
    ) || config.components.name?.color || config.colors.primary || '#0f172a',
    '--name-letter-spacing': config.components.name?.letterSpacing || '-0.02em',
    '--name-text-transform': config.components.name?.textTransform || 'uppercase',
    '--name-alignment': config.components.name?.alignment || 'left',
    '--name-margin-bottom': config.components.name?.marginBottom || '8px',

    // Contact Info
    '--contact-layout': config.components.contactInfo?.layout || 'inline',
    '--contact-icon-size': config.components.contactInfo?.iconSize || '16px',
    '--contact-icon-color': resolveSemanticColor(
      config.components.contactInfo?.iconColorKey,
      config,
      config.components.contactInfo?.iconColorOpacity
    ) || config.components.contactInfo?.iconColor || config.colors.text.secondary,
    '--contact-spacing': config.components.contactInfo?.spacing || '12px',
    '--contact-font-size': config.components.contactInfo?.fontSize || calculateFontSize(fontScale.small, baseFontSize),

    // Profile Photo
    '--profile-photo-size': config.components.profilePhoto?.size || '200px',
    '--profile-photo-border-radius': config.components.profilePhoto?.borderRadius || '50%',
    '--profile-photo-border': config.components.profilePhoto?.border || '3px solid #e2e8f0',
    '--profile-photo-border-color': config.components.profilePhoto?.borderColor || '#e2e8f0',

    // Section Headers (H2)
    '--section-header-font-size': config.components.sectionHeader?.fontSize || calculateFontSize(fontScale.h2, baseFontSize),
    '--section-header-font-weight': String(config.components.sectionHeader?.fontWeight || 700),
    '--section-header-color': resolveSemanticColor(
      config.components.sectionHeader?.colorKey,
      config,
      config.components.sectionHeader?.colorOpacity
    ) || config.components.sectionHeader?.color || config.colors.primary,
    '--section-header-text-transform': config.components.sectionHeader?.textTransform || 'uppercase',
    '--section-header-border-bottom': config.components.sectionHeader?.borderBottom || '2px solid',
    '--section-header-border-color': resolveSemanticColor(
      config.components.sectionHeader?.dividerColorKey,
      config,
      config.components.sectionHeader?.dividerColorOpacity
    ) || config.components.sectionHeader?.dividerColor || config.components.sectionHeader?.borderColor || config.colors.primary,
    '--section-header-padding': config.components.sectionHeader?.padding || '0 0 4px 0',
    '--section-header-margin-top': config.components.sectionHeader?.marginTop || '24px',
    '--section-header-margin-bottom': config.components.sectionHeader?.marginBottom || '12px',
    '--section-header-letter-spacing': config.components.sectionHeader?.letterSpacing || '0.05em',

    // Job Titles (H3)
    '--job-title-font-size': config.components.jobTitle?.fontSize || calculateFontSize(fontScale.h3, baseFontSize),
    '--job-title-font-weight': String(config.components.jobTitle?.fontWeight || 600),
    '--job-title-color': resolveSemanticColor(
      config.components.jobTitle?.colorKey,
      config,
      config.components.jobTitle?.colorOpacity
    ) || config.components.jobTitle?.color || config.colors.text.primary,
    '--job-title-margin-bottom': config.components.jobTitle?.marginBottom || '4px',

    // Organization Names
    '--org-name-font-size': config.components.organizationName?.fontSize || calculateFontSize(fontScale.body, baseFontSize),
    '--org-name-font-weight': String(config.components.organizationName?.fontWeight || 500),
    '--org-name-color': config.components.organizationName?.color || config.colors.text.secondary,
    '--org-name-font-style': config.components.organizationName?.fontStyle || 'normal',

    // Key-Value Pairs
    '--key-value-label-color': config.components.keyValue?.labelColor || config.colors.text.primary,
    '--key-value-label-weight': String(config.components.keyValue?.labelWeight || 600),
    '--key-value-value-color': config.components.keyValue?.valueColor || config.colors.text.secondary,
    '--key-value-value-weight': String(config.components.keyValue?.valueWeight || 400),
    '--key-value-separator': config.components.keyValue?.separator || ':',
    '--key-value-spacing': config.components.keyValue?.spacing || '4px',

    // Emphasis
    '--emphasis-font-weight': String(config.components.emphasis?.fontWeight || 600),
    '--emphasis-color': config.components.emphasis?.color || config.colors.text.primary,

    // Bullet Lists (Multi-level)
    '--bullet-level1-color': config.components.list?.level1?.color || config.colors.primary,
    '--bullet-level2-color': config.components.list?.level2?.color || config.colors.text.secondary,
    '--bullet-level3-color': config.components.list?.level3?.color || config.colors.text.muted,
    '--bullet-level1-indent': config.components.list?.level1?.indent || '20px',
    '--bullet-level2-indent': config.components.list?.level2?.indent || '40px',
    '--bullet-level3-indent': config.components.list?.level3?.indent || '60px',
  };
}

/**
 * Generate Google Fonts URL for loading custom fonts
 * @param fonts - Array of font family names
 * @returns Google Fonts URL string
 */
export function generateGoogleFontsURL(fonts: string[]): string {
  if (!fonts || fonts.length === 0) {
    return '';
  }

  // Remove duplicates and format for Google Fonts
  const uniqueFonts = [...new Set(fonts)];
  const formattedFonts = uniqueFonts
    .map(font => font.replace(/ /g, '+'))
    .join('|');

  // Include common weights for better rendering
  return `https://fonts.googleapis.com/css2?${uniqueFonts.map(font =>
    `family=${font.replace(/ /g, '+')}:wght@400;500;600;700`
  ).join('&')}&display=swap`;
}
