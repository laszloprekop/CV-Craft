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
  | 'text-muted';

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

/**
 * Resolves a color pair (primary/secondary/tertiary/muted) to its base and on-color values
 * @param colorPair - The color pair key
 * @param config - The template configuration
 * @returns Object with baseColor and onColor
 */
export function resolveColorPair(
  colorPair: 'primary' | 'secondary' | 'tertiary' | 'muted',
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
    default:
      return {
        baseColor: config.colors.tertiary || config.colors.accent || '#f59e0b',
        onColor: config.colors.onTertiary || '#ffffff'
      };
  }
}
