/**
 * Shared color resolution utilities for CV-Craft
 * Used by both frontend (web preview) and backend (PDF generation)
 */

import type { TemplateConfig } from '../types';

export type SemanticColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'muted'
  | 'text-primary'
  | 'text-secondary'
  | 'text-muted'
  | 'custom1'
  | 'custom2'
  | 'custom3'
  | 'custom4'
  | 'on-primary'
  | 'on-secondary'
  | 'on-tertiary'
  | 'on-muted'
  | 'on-custom1'
  | 'on-custom2'
  | 'on-custom3'
  | 'on-custom4';

/**
 * Resolves a semantic color key to its actual hex color value from the theme
 * @param colorKey - The semantic color key (e.g., 'primary', 'text-secondary')
 * @param config - The template configuration containing color definitions
 * @param opacity - Optional opacity value (0-1), defaults to 1.0
 * @returns The resolved color value as hex (if opacity=1) or rgba string
 */
export function resolveSemanticColor(
  colorKey: SemanticColorKey | undefined,
  config: TemplateConfig,
  opacity: number = 1.0
): string {
  if (!colorKey) {
    return config.colors.text.primary;
  }

  // Map semantic keys to actual color values
  const colorMap: Record<SemanticColorKey, string> = {
    'primary': config.colors.primary,
    'secondary': config.colors.secondary,
    'tertiary': config.colors.tertiary,
    'muted': config.colors.muted,
    'text-primary': config.colors.text.primary,
    'text-secondary': config.colors.text.secondary,
    'text-muted': config.colors.text.muted,
    'custom1': config.colors.custom1,
    'custom2': config.colors.custom2,
    'custom3': config.colors.custom3,
    'custom4': config.colors.custom4,
    'on-primary': config.colors.onPrimary,
    'on-secondary': config.colors.onSecondary,
    'on-tertiary': config.colors.onTertiary || '#ffffff',
    'on-muted': config.colors.onMuted || '#334155',
    'on-custom1': config.colors.onCustom1,
    'on-custom2': config.colors.onCustom2,
    'on-custom3': config.colors.onCustom3,
    'on-custom4': config.colors.onCustom4,
  };

  const hexColor = colorMap[colorKey] || config.colors.text.primary;

  // If opacity is 1.0, return the hex color as-is
  if (opacity === 1.0) {
    return hexColor;
  }

  // Convert hex to rgba with opacity
  return hexToRgba(hexColor, opacity);
}

/**
 * Converts a hex color to rgba format with the specified opacity
 * @param hex - Hex color string (e.g., '#ff0000' or '#f00')
 * @param opacity - Opacity value (0-1)
 * @returns rgba color string
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex colors
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  // Parse RGB components
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export type ColorPairKey = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';

/**
 * Resolves a color pair (primary/secondary/tertiary/muted/custom1-4) to its base and on-color values
 * @param colorPair - The color pair key
 * @param config - The template configuration
 * @returns Object with baseColor and onColor
 */
export function resolveColorPair(
  colorPair: ColorPairKey,
  config: TemplateConfig
): { baseColor: string; onColor: string } {
  switch (colorPair) {
    case 'primary':
      return { baseColor: config.colors.primary, onColor: config.colors.onPrimary };
    case 'secondary':
      return { baseColor: config.colors.secondary, onColor: config.colors.onSecondary };
    case 'tertiary':
      return {
        baseColor: config.colors.tertiary || config.colors.accent || '#f59e0b',
        onColor: config.colors.onTertiary || '#ffffff'
      };
    case 'muted':
      return {
        baseColor: config.colors.muted || '#f1f5f9',
        onColor: config.colors.onMuted || '#334155'
      };
    case 'custom1':
      return { baseColor: config.colors.custom1, onColor: config.colors.onCustom1 };
    case 'custom2':
      return { baseColor: config.colors.custom2, onColor: config.colors.onCustom2 };
    case 'custom3':
      return { baseColor: config.colors.custom3, onColor: config.colors.onCustom3 };
    case 'custom4':
      return { baseColor: config.colors.custom4, onColor: config.colors.onCustom4 };
    default:
      return {
        baseColor: config.colors.tertiary || config.colors.accent || '#f59e0b',
        onColor: config.colors.onTertiary || '#ffffff'
      };
  }
}
