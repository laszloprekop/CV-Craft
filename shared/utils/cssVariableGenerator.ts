/**
 * Shared CSS variable generation utility for CV-Craft
 * Used by both frontend (web preview) and backend (PDF generation)
 * This ensures consistent styling between preview and export
 */

import type { TemplateConfig } from '../types';
import { resolveSemanticColor, resolveColorPair, hexToRgba, type SemanticColorKey } from './colorResolver';

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
/**
 * Ensure a margin value has units (defaults to 'mm')
 */
function ensureMarginUnits(value: string | number | undefined, defaultValue: string = '20mm'): string {
  if (!value && value !== 0) return defaultValue;
  const strValue = String(value);
  // If it's just a number, append 'mm'
  if (/^\d+(\.\d+)?$/.test(strValue)) {
    return `${strValue}mm`;
  }
  return strValue;
}

/**
 * Calculate main content width from page width minus sidebar width
 * Supports mm units; percentages fall back to calc()
 */
function calculateMainWidth(pageWidth: string, sidebarWidth: string): string {
  // Extract numeric values and units
  const pageMatch = pageWidth.match(/^(\d+(?:\.\d+)?)(mm|px|rem|%)?$/);
  const sidebarMatch = sidebarWidth.match(/^(\d+(?:\.\d+)?)(mm|px|rem|%)?$/);

  if (pageMatch && sidebarMatch) {
    const pageValue = parseFloat(pageMatch[1]);
    const pageUnit = pageMatch[2] || 'mm';
    const sidebarValue = parseFloat(sidebarMatch[1]);
    const sidebarUnit = sidebarMatch[2] || 'mm';

    // If both have the same unit, calculate directly
    if (pageUnit === sidebarUnit && pageUnit !== '%') {
      return `${pageValue - sidebarValue}${pageUnit}`;
    }
  }

  // Fallback to CSS calc() for mixed units or percentages
  return `calc(${pageWidth} - ${sidebarWidth})`;
}

export function generateCSSVariables(config: TemplateConfig): Record<string, string> {
  // Ensure all top-level and nested sections exist with safe defaults
  const colors = config.colors || {} as any;
  const colorText = colors.text || {} as any;
  const colorLinks = colors.links || {} as any;
  const typography = config.typography || {} as any;
  const fontFamily = typography.fontFamily || {} as any;
  const fontWeight = typography.fontWeight || {} as any;
  const lineHeight = typography.lineHeight || {} as any;
  const layout = config.layout || {} as any;
  const components = config.components || {} as any;
  const pdf = config.pdf || {} as any;

  const rawPageMargin = layout.pageMargin || {};
  const pageMargin = {
    top: ensureMarginUnits(rawPageMargin.top, '20mm'),
    right: ensureMarginUnits(rawPageMargin.right, '20mm'),
    bottom: ensureMarginUnits(rawPageMargin.bottom, '20mm'),
    left: ensureMarginUnits(rawPageMargin.left, '20mm'),
  };

  const baseFontSize = typography.baseFontSize || '10pt';
  const fontScale = typography.fontScale || {
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
  const tagColorPair = components.tags?.colorPair || 'tertiary';
  const tagBgOpacity = components.tags?.backgroundOpacity ?? 0.2;
  const tagTextOpacity = components.tags?.textOpacity ?? 1.0;
  const { baseColor: tagBaseColor, onColor: tagOnColor } = resolveColorPair(tagColorPair, config);
  // Allow explicit text color override via textColorKey (set from Tag > Typography > Color)
  const tagTextColor = components.tags?.textColorKey
    ? resolveSemanticColor(components.tags.textColorKey as SemanticColorKey, config)
    : tagOnColor;

  // Section header color/background are conditionally generated:
  // When explicitly set by user (via Color Pair), include them so they override two-column defaults.
  // When not set, omit them so the two-column CSS can use layout-specific fallbacks (primary/accent).
  const sectionHeaderColorOverrides: Record<string, string> = {};
  if (components.sectionHeader?.colorKey) {
    sectionHeaderColorOverrides['--section-header-color'] = resolveSemanticColor(
      components.sectionHeader.colorKey,
      config,
      components.sectionHeader.colorOpacity
    );
  }
  if (components.sectionHeader?.backgroundColorKey) {
    sectionHeaderColorOverrides['--section-header-background-color'] = resolveSemanticColor(
      components.sectionHeader.backgroundColorKey,
      config,
      components.sectionHeader.backgroundColorOpacity ?? 1
    );
  }

  return {
    // Main Color Pairs - Background colors and their text colors
    '--primary-color': colors.primary,
    '--on-primary-color': colors.onPrimary,
    '--secondary-color': colors.secondary,
    '--on-secondary-color': colors.onSecondary,
    '--tertiary-color': colors.tertiary || colors.accent || '#f59e0b',
    '--on-tertiary-color': colors.onTertiary || '#ffffff',
    '--muted-color': colors.muted || '#f1f5f9',
    '--on-muted-color': colors.onMuted || '#334155',
    '--background-color': layout.mainBackground || colors.background,
    '--on-background-color': colorText.primary,

    // Custom color pairs
    '--custom1-color': colors.custom1,
    '--on-custom1-color': colors.onCustom1,
    '--custom2-color': colors.custom2,
    '--on-custom2-color': colors.onCustom2,
    '--custom3-color': colors.custom3,
    '--on-custom3-color': colors.onCustom3,
    '--custom4-color': colors.custom4,
    '--on-custom4-color': colors.onCustom4,

    // Legacy color variables for backward compatibility
    '--accent-color': colors.tertiary || colors.accent || '#f59e0b',
    '--surface-color': layout.sidebarBackground || colors.secondary,
    '--text-color': colorText.primary,
    '--text-secondary': colorText.secondary,
    '--text-muted': colorText.muted,

    // Border & Link colors
    '--border-color': colors.borders,
    '--link-color': resolveSemanticColor(
      components.links?.colorKey,
      config,
      components.links?.colorOpacity
    ) || components.links?.color || colorLinks.default,
    '--link-hover-color': resolveSemanticColor(
      components.links?.hoverColorKey,
      config,
      components.links?.hoverColorOpacity
    ) || components.links?.hoverColor || colorLinks.hover,
    '--link-font-size': components.links?.fontSize || 'inherit',
    '--link-font-weight': String(components.links?.fontWeight || 500),
    '--link-letter-spacing': components.links?.letterSpacing || '0em',
    '--link-text-transform': components.links?.textTransform || 'none',
    '--link-font-style': components.links?.fontStyle || 'normal',
    '--link-underline-style': components.links?.underlineStyle || 'always',

    // Typography
    '--font-family': fontFamily.body,
    '--heading-font-family': fontFamily.heading,

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
    '--heading-weight': String(fontWeight.heading || 700),
    '--subheading-weight': String(fontWeight.subheading || 600),
    '--body-weight': String(fontWeight.body || 400),
    '--bold-weight': String(fontWeight.bold || 600),

    // Line heights
    '--heading-line-height': String(lineHeight.heading || 1.2),
    '--body-line-height': String(lineHeight.body || 1.6),
    '--compact-line-height': String(lineHeight.compact || 1.4),

    // Layout
    '--page-width': layout.pageWidth || '210mm',
    '--page-margin-top': pageMargin.top || '20mm',
    '--page-margin-right': pageMargin.right || '20mm',
    '--page-margin-bottom': pageMargin.bottom || '20mm',
    '--page-margin-left': pageMargin.left || '20mm',
    '--section-spacing': layout.sectionSpacing || '24px',
    '--paragraph-spacing': layout.paragraphSpacing || '12px',

    // Two-column layout dimensions
    '--sidebar-width': layout.sidebarWidth || '84mm',
    '--main-width': calculateMainWidth(layout.pageWidth || '210mm', layout.sidebarWidth || '84mm'),

    // Tags - semantic color pairs with opacity
    '--tag-bg-color': hexToRgba(tagBaseColor, tagBgOpacity),
    '--tag-text-color': hexToRgba(tagTextColor, tagTextOpacity),
    '--tag-border-radius': components.tags?.borderRadius || '4px',
    '--tag-font-size-custom': components.tags?.fontSize || calculateFontSize(fontScale.tag || 1.3, baseFontSize),
    '--tag-font-weight': String(components.tags?.fontWeight || 500),
    '--tag-letter-spacing': components.tags?.letterSpacing || '0em',
    '--tag-text-transform': components.tags?.textTransform || 'none',
    '--tag-font-style': components.tags?.fontStyle || 'normal',
    '--tag-padding': components.tags?.padding || '4px 8px',
    '--tag-gap': components.tags?.gap || '8px',

    // Date Line
    '--date-line-color': resolveSemanticColor(
      components.dateLine?.colorKey,
      config,
      components.dateLine?.colorOpacity
    ),
    '--date-line-font-family': components.dateLine?.fontFamily || 'inherit',
    '--date-line-font-size-custom': components.dateLine?.fontSize || calculateFontSize(fontScale.dateLine || 1.3, baseFontSize),
    '--date-line-font-weight': String(components.dateLine?.fontWeight || 400),
    '--date-line-font-style': components.dateLine?.fontStyle || 'normal',
    '--date-line-alignment': components.dateLine?.alignment || 'right',
    '--date-line-letter-spacing': components.dateLine?.letterSpacing || '0em',
    '--date-line-text-transform': components.dateLine?.textTransform || 'none',

    // Name (H1) - Typography
    '--name-font-size': components.name?.fontSize || calculateFontSize(fontScale.h1, baseFontSize),
    '--name-font-weight': String(components.name?.fontWeight || 700),
    '--name-color': resolveSemanticColor(
      components.name?.colorKey,
      config,
      components.name?.colorOpacity
    ) || components.name?.color || colors.primary || '#0f172a',
    '--name-letter-spacing': components.name?.letterSpacing || '-0.02em',
    '--name-text-transform': components.name?.textTransform || 'uppercase',
    '--name-alignment': components.name?.alignment || 'left',
    '--name-line-height': String(components.name?.lineHeight || 1.2),
    '--name-font-style': components.name?.fontStyle || 'normal',
    // Name (H1) - Spacing (supports uniform/individual modes)
    '--name-margin-top': (() => {
      const comp = components.name;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginTop || '0px';
    })(),
    '--name-margin-bottom': (() => {
      const comp = components.name;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginBottom || '8px';
    })(),
    '--name-margin-left': (() => {
      const comp = components.name;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginLeft || '0px';
    })(),
    '--name-margin-right': (() => {
      const comp = components.name;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginRight || '0px';
    })(),
    '--name-padding': (() => {
      const comp = components.name;
      if (comp?.paddingMode === 'individual') {
        return `${comp.paddingTop || '0px'} ${comp.paddingRight || '0px'} ${comp.paddingBottom || '0px'} ${comp.paddingLeft || '0px'}`;
      }
      return comp?.paddingUniform || comp?.padding || '0px';
    })(),
    // Name (H1) - Background
    '--name-background-color': components.name?.backgroundColorKey
      ? resolveSemanticColor(
          components.name.backgroundColorKey,
          config,
          components.name?.backgroundColorOpacity ?? 1
        )
      : 'transparent',
    '--name-border-radius': components.name?.borderRadius || '0px',
    // Name (H1) - Border
    '--name-border-style': components.name?.borderStyle || 'none',
    '--name-border-width': components.name?.borderWidth || '0px',
    '--name-border-color': resolveSemanticColor(
      components.name?.borderColorKey,
      config,
      components.name?.borderColorOpacity ?? 1
    ) || 'transparent',
    // Name (H1) - Divider
    '--name-divider-style': components.name?.dividerStyle || 'none',
    '--name-divider-width': components.name?.dividerWidth || '2px',
    '--name-divider-color': resolveSemanticColor(
      components.name?.dividerColorKey,
      config,
      components.name?.dividerColorOpacity ?? 1
    ) || colors.primary,
    '--name-divider-gap': components.name?.dividerGap || '4px',
    '--name-divider-display': (components.name?.dividerStyle && components.name.dividerStyle !== 'none') ? 'block' : 'none',
    // Name (H1) - Shadow
    '--name-shadow': (() => {
      const shadow = components.name?.shadow || 'none';
      const shadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      };
      return shadowMap[shadow] || 'none';
    })(),

    // Header Section
    '--header-alignment': components.header?.alignment || 'left',

    // Contact Info
    '--contact-layout': components.contactInfo?.layout || 'inline',
    '--contact-icon-size': components.contactInfo?.iconSize || '16px',
    '--contact-icon-color': resolveSemanticColor(
      components.contactInfo?.iconColorKey,
      config,
      components.contactInfo?.iconColorOpacity
    ) || components.contactInfo?.iconColor || colorText.secondary,
    '--contact-spacing': components.contactInfo?.spacing || '12px',
    '--contact-font-size': components.contactInfo?.fontSize || calculateFontSize(fontScale.small, baseFontSize),
    '--contact-font-weight': String(components.contactInfo?.fontWeight || 400),
    '--contact-color': resolveSemanticColor(
      components.contactInfo?.colorKey,
      config,
      components.contactInfo?.colorOpacity
    ) || components.contactInfo?.textColor || colorText.secondary,
    '--contact-letter-spacing': components.contactInfo?.letterSpacing || '0em',
    '--contact-text-transform': components.contactInfo?.textTransform || 'none',
    '--contact-font-style': components.contactInfo?.fontStyle || 'normal',

    // Profile Photo - 160px is optimal for two-column PDF layout
    '--profile-photo-size': components.profilePhoto?.size || '160px',
    '--profile-photo-border-radius': components.profilePhoto?.borderRadius || '50%',
    '--profile-photo-border-width': components.profilePhoto?.borderWidth || '3px',
    '--profile-photo-border-style': components.profilePhoto?.borderStyle || 'solid',
    '--profile-photo-border-color': components.profilePhoto?.borderColor || '#e2e8f0',
    '--profile-photo-border': `${components.profilePhoto?.borderWidth || '3px'} ${components.profilePhoto?.borderStyle || 'solid'} ${components.profilePhoto?.borderColor || '#e2e8f0'}`,
    '--profile-photo-position': components.profilePhoto?.position || 'center',
    '--profile-photo-margin-top': components.profilePhoto?.marginTop || '0px',
    '--profile-photo-margin-bottom': components.profilePhoto?.marginBottom || '16px',
    '--profile-photo-margin-left': components.profilePhoto?.marginLeft || '0px',
    '--profile-photo-margin-right': components.profilePhoto?.marginRight || '0px',
    '--profile-photo-opacity': String(components.profilePhoto?.opacity ?? 1),
    '--profile-photo-shadow': (() => {
      const shadow = components.profilePhoto?.shadow || 'none';
      const shadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
      };
      return shadowMap[shadow] || 'none';
    })(),
    '--profile-photo-filter': (() => {
      const filter = components.profilePhoto?.filter || 'none';
      const filterMap: Record<string, string> = {
        none: 'none',
        grayscale: 'grayscale(100%)',
        sepia: 'sepia(100%)',
      };
      return filterMap[filter] || 'none';
    })(),

    // Section Headers (H2) - Typography
    '--section-header-font-size': components.sectionHeader?.fontSize || calculateFontSize(fontScale.h2, baseFontSize),
    '--section-header-font-weight': String(components.sectionHeader?.fontWeight || 700),
    // Note: --section-header-color and --section-header-background-color are conditionally
    // generated above (sectionHeaderColorOverrides) so two-column CSS fallbacks work correctly.
    ...sectionHeaderColorOverrides,
    '--section-header-text-transform': components.sectionHeader?.textTransform || 'uppercase',
    '--section-header-letter-spacing': components.sectionHeader?.letterSpacing || '0.05em',
    '--section-header-line-height': String(components.sectionHeader?.lineHeight || 1.2),
    '--section-header-font-style': components.sectionHeader?.fontStyle || 'normal',
    // Section Headers (H2) - Spacing (supports uniform/individual modes)
    '--section-header-margin-top': (() => {
      const comp = components.sectionHeader;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginTop || '24px';
    })(),
    '--section-header-margin-bottom': (() => {
      const comp = components.sectionHeader;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginBottom || '12px';
    })(),
    '--section-header-margin-left': (() => {
      const comp = components.sectionHeader;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginLeft || '0px';
    })(),
    '--section-header-margin-right': (() => {
      const comp = components.sectionHeader;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginRight || '0px';
    })(),
    '--section-header-padding': (() => {
      const comp = components.sectionHeader;
      if (comp?.paddingMode === 'individual') {
        return `${comp.paddingTop || '0px'} ${comp.paddingRight || '0px'} ${comp.paddingBottom || '0px'} ${comp.paddingLeft || '0px'}`;
      }
      return comp?.paddingUniform || comp?.padding || '4px 12px';
    })(),
    // Section Headers (H2) - Background
    '--section-header-border-radius': components.sectionHeader?.borderRadius || '0px',
    // Section Headers (H2) - Border
    '--section-header-border-style': components.sectionHeader?.borderStyle || 'none',
    '--section-header-border-width': components.sectionHeader?.borderWidth || '0px',
    '--section-header-border-color': resolveSemanticColor(
      components.sectionHeader?.borderColorKey,
      config,
      components.sectionHeader?.borderColorOpacity ?? 1
    ) || 'transparent',
    // Section Headers (H2) - Divider (legacy support + new)
    '--section-header-border-bottom': components.sectionHeader?.borderBottom || '2px solid',
    '--section-header-divider-style': components.sectionHeader?.dividerStyle || 'none',
    '--section-header-divider-width': components.sectionHeader?.dividerWidth || '2px',
    '--section-header-divider-color': resolveSemanticColor(
      components.sectionHeader?.dividerColorKey,
      config,
      components.sectionHeader?.dividerColorOpacity ?? 1
    ) || components.sectionHeader?.dividerColor || components.sectionHeader?.borderColor || colors.primary,
    '--section-header-divider-gap': components.sectionHeader?.dividerGap || '0px',
    '--section-header-divider-display': (components.sectionHeader?.dividerStyle && components.sectionHeader.dividerStyle !== 'none') ? 'block' : 'none',
    // Section Headers (H2) - Shadow
    '--section-header-shadow': (() => {
      const shadow = components.sectionHeader?.shadow || 'none';
      const shadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      };
      return shadowMap[shadow] || 'none';
    })(),

    // Job Titles (H3) - Typography
    '--job-title-font-size': components.jobTitle?.fontSize || calculateFontSize(fontScale.h3, baseFontSize),
    '--job-title-font-weight': String(components.jobTitle?.fontWeight || 600),
    '--job-title-color': resolveSemanticColor(
      components.jobTitle?.colorKey,
      config,
      components.jobTitle?.colorOpacity
    ) || components.jobTitle?.color || colorText.primary,
    '--job-title-letter-spacing': components.jobTitle?.letterSpacing || '0em',
    '--job-title-text-transform': components.jobTitle?.textTransform || 'none',
    '--job-title-line-height': String(components.jobTitle?.lineHeight || 1.3),
    '--job-title-font-style': components.jobTitle?.fontStyle || 'normal',
    // Job Titles (H3) - Spacing (supports uniform/individual modes)
    '--job-title-margin-top': (() => {
      const comp = components.jobTitle;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginTop || '0px';
    })(),
    '--job-title-margin-bottom': (() => {
      const comp = components.jobTitle;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginBottom || '4px';
    })(),
    '--job-title-margin-left': (() => {
      const comp = components.jobTitle;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginLeft || '0px';
    })(),
    '--job-title-margin-right': (() => {
      const comp = components.jobTitle;
      if (comp?.marginMode === 'uniform' && comp.marginUniform) return comp.marginUniform;
      return comp?.marginRight || '0px';
    })(),
    '--job-title-padding': (() => {
      const comp = components.jobTitle;
      if (comp?.paddingMode === 'individual') {
        return `${comp.paddingTop || '0px'} ${comp.paddingRight || '0px'} ${comp.paddingBottom || '0px'} ${comp.paddingLeft || '0px'}`;
      }
      return comp?.paddingUniform || comp?.padding || '0px';
    })(),
    // Job Titles (H3) - Background
    '--job-title-background-color': components.jobTitle?.backgroundColorKey
      ? resolveSemanticColor(
          components.jobTitle.backgroundColorKey,
          config,
          components.jobTitle?.backgroundColorOpacity ?? 1
        )
      : 'transparent',
    '--job-title-border-radius': components.jobTitle?.borderRadius || '0px',
    // Job Titles (H3) - Border
    '--job-title-border-style': components.jobTitle?.borderStyle || 'none',
    '--job-title-border-width': components.jobTitle?.borderWidth || '0px',
    '--job-title-border-color': resolveSemanticColor(
      components.jobTitle?.borderColorKey,
      config,
      components.jobTitle?.borderColorOpacity ?? 1
    ) || 'transparent',
    // Job Titles (H3) - Divider
    '--job-title-divider-style': components.jobTitle?.dividerStyle || 'none',
    '--job-title-divider-width': components.jobTitle?.dividerWidth || '2px',
    '--job-title-divider-color': resolveSemanticColor(
      components.jobTitle?.dividerColorKey,
      config,
      components.jobTitle?.dividerColorOpacity ?? 1
    ) || colors.primary,
    '--job-title-divider-gap': components.jobTitle?.dividerGap || '0px',
    '--job-title-divider-display': (components.jobTitle?.dividerStyle && components.jobTitle.dividerStyle !== 'none') ? 'block' : 'none',
    // Job Titles (H3) - Shadow
    '--job-title-shadow': (() => {
      const shadow = components.jobTitle?.shadow || 'none';
      const shadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      };
      return shadowMap[shadow] || 'none';
    })(),

    // Entry Layout
    '--entry-layout': 'column',

    // Organization Names
    '--org-name-font-family': components.organizationName?.fontFamily || 'inherit',
    '--org-name-font-size': components.organizationName?.fontSize || calculateFontSize(fontScale.body, baseFontSize),
    '--org-name-font-weight': String(components.organizationName?.fontWeight || 500),
    '--org-name-color': resolveSemanticColor(
      components.organizationName?.colorKey,
      config,
      components.organizationName?.colorOpacity
    ) || components.organizationName?.color || colorText.secondary,
    '--org-name-font-style': components.organizationName?.fontStyle || 'normal',
    '--org-name-letter-spacing': components.organizationName?.letterSpacing || '0em',
    '--org-name-text-transform': components.organizationName?.textTransform || 'none',
    '--org-name-line-height': String(components.organizationName?.lineHeight || 1.4),

    // Key-Value Pairs
    '--key-value-label-color': components.keyValue?.labelColor || colorText.primary,
    '--key-value-label-weight': String(components.keyValue?.labelWeight || 600),
    '--key-value-value-color': components.keyValue?.valueColor || colorText.secondary,
    '--key-value-value-weight': String(components.keyValue?.valueWeight || 400),
    '--key-value-separator': components.keyValue?.separator || ':',
    '--key-value-spacing': components.keyValue?.spacing || '4px',

    // Emphasis
    '--emphasis-font-weight': String(components.emphasis?.fontWeight || 600),
    '--emphasis-color': components.emphasis?.color || colorText.primary,

    // Bullet Lists (Multi-level)
    '--bullet-level1-color': (components.list?.level1?.colorKey ? resolveSemanticColor(components.list.level1.colorKey as SemanticColorKey, config) : undefined) || components.list?.level1?.color || colors.primary,
    '--bullet-level2-color': (components.list?.level2?.colorKey ? resolveSemanticColor(components.list.level2.colorKey as SemanticColorKey, config) : undefined) || components.list?.level2?.color || colorText.secondary,
    '--bullet-level3-color': (components.list?.level3?.colorKey ? resolveSemanticColor(components.list.level3.colorKey as SemanticColorKey, config) : undefined) || components.list?.level3?.color || colorText.muted,
    '--bullet-level1-style': components.list?.level1?.bulletStyle === 'custom'
      ? `'${components.list.level1.customBullet || '▸'}'`
      : (components.list?.level1?.bulletStyle || 'disc'),
    '--bullet-level2-style': components.list?.level2?.bulletStyle === 'custom'
      ? `'${components.list.level2.customBullet || '▸'}'`
      : (components.list?.level2?.bulletStyle || 'circle'),
    '--bullet-level3-style': components.list?.level3?.bulletStyle === 'custom'
      ? `'${components.list.level3.customBullet || '▸'}'`
      : (components.list?.level3?.bulletStyle || 'square'),
    '--bullet-level1-indent': components.list?.level1?.indent || '20px',
    '--bullet-level2-indent': components.list?.level2?.indent || '40px',
    '--bullet-level3-indent': components.list?.level3?.indent || '60px',

    // Body Text
    '--body-text-color': resolveSemanticColor(
      components.bodyText?.colorKey,
      config,
      components.bodyText?.colorOpacity
    ) || colorText.primary,
    '--body-text-weight': String(components.bodyText?.fontWeight || fontWeight.body || 400),
    '--body-text-line-height': String(components.bodyText?.lineHeight || lineHeight.body || 1.6),
    '--body-text-align': components.bodyText?.textAlign || 'left',

    // Advanced Effects
    '--animation-duration': config.advanced?.animations ? '0.2s' : '0s',
    '--shadow-default': config.advanced?.shadows ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
    '--shadow-hover': config.advanced?.shadows ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',

    // Page Numbers (PDF)
    '--page-number-font-size': pdf.pageNumbers?.fontSize || '10px',
    '--page-number-font-weight': String(pdf.pageNumbers?.fontWeight || 400),
    '--page-number-color': resolveSemanticColor(
      pdf.pageNumbers?.colorKey,
      config,
      pdf.pageNumbers?.colorOpacity
    ) || colorText.secondary,
    '--page-number-margin': pdf.pageNumbers?.margin || '10mm',
    '--page-number-position': pdf.pageNumbers?.position || 'bottom-center',
  };
}

/**
 * Generate Google Fonts URL for loading custom fonts
 * Includes both regular and italic variants for proper font-style support
 * @param fonts - Array of font family names
 * @returns Google Fonts URL string
 */
export function generateGoogleFontsURL(fonts: string[]): string {
  if (!fonts || fonts.length === 0) {
    return '';
  }

  // Remove duplicates
  const uniqueFonts = [...new Set(fonts)];

  // Build URL with both regular (0) and italic (1) variants
  // Format: ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700
  const weights = [400, 500, 600, 700];
  const axisTuples: string[] = [];
  weights.forEach(w => axisTuples.push(`0,${w}`));
  weights.forEach(w => axisTuples.push(`1,${w}`));
  const axisStr = axisTuples.join(';');

  return `https://fonts.googleapis.com/css2?${uniqueFonts.map(font =>
    `family=${font.replace(/ /g, '+')}:ital,wght@${axisStr}`
  ).join('&')}&display=swap`;
}
