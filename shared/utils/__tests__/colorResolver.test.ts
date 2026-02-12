import { describe, it, expect } from 'vitest'
import { hexToRgba, resolveSemanticColor, resolveColorPair } from '../colorResolver'
import { DEFAULT_TEMPLATE_CONFIG } from '../../types/defaultTemplateConfig'
import type { TemplateConfig } from '../../types'

describe('hexToRgba', () => {
  it('converts a 6-digit hex color with opacity', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('converts a 3-digit hex color by expanding each digit', () => {
    expect(hexToRgba('#f00', 0.8)).toBe('rgba(255, 0, 0, 0.8)')
  })

  it('handles hex without the leading # character', () => {
    expect(hexToRgba('2563eb', 1.0)).toBe('rgba(37, 99, 235, 1)')
  })

  it('handles opacity of 0', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
  })

  it('returns NaN components for invalid hex strings', () => {
    const result = hexToRgba('#xyz', 1.0)
    expect(result).toBe('rgba(NaN, NaN, NaN, 1)')
  })
})

describe('resolveSemanticColor', () => {
  it('returns text.primary when colorKey is undefined', () => {
    const result = resolveSemanticColor(undefined, DEFAULT_TEMPLATE_CONFIG)
    expect(result).toBe(DEFAULT_TEMPLATE_CONFIG.colors.text.primary)
  })

  it('resolves "primary" to the primary color', () => {
    const result = resolveSemanticColor('primary', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toBe('#2563eb')
  })

  it('resolves "text-secondary" to the text secondary color', () => {
    const result = resolveSemanticColor('text-secondary', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toBe('#475569')
  })

  it('resolves "text-muted" to the text muted color', () => {
    const result = resolveSemanticColor('text-muted', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toBe('#94a3b8')
  })

  it('returns rgba string when opacity is less than 1', () => {
    const result = resolveSemanticColor('primary', DEFAULT_TEMPLATE_CONFIG, 0.5)
    expect(result).toBe('rgba(37, 99, 235, 0.5)')
  })

  it('returns hex string as-is when opacity is exactly 1.0', () => {
    const result = resolveSemanticColor('secondary', DEFAULT_TEMPLATE_CONFIG, 1.0)
    expect(result).toBe('#64748b')
  })

  it('falls back to on-tertiary default when config value is falsy', () => {
    const config = structuredClone(DEFAULT_TEMPLATE_CONFIG) as TemplateConfig & { colors: { onTertiary: string } }
    // Force onTertiary to empty string to trigger the fallback
    config.colors.onTertiary = ''
    const result = resolveSemanticColor('on-tertiary', config)
    expect(result).toBe('#ffffff')
  })

  it('falls back to text.primary for an unknown color key mapped to a falsy value', () => {
    const config = structuredClone(DEFAULT_TEMPLATE_CONFIG) as TemplateConfig & { colors: { custom1: string } }
    config.colors.custom1 = ''
    const result = resolveSemanticColor('custom1', config)
    // Empty string is falsy, so the || fallback in colorMap lookup triggers
    expect(result).toBe(config.colors.text.primary)
  })
})

describe('resolveColorPair', () => {
  it('returns primary baseColor and onPrimary onColor', () => {
    const result = resolveColorPair('primary', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: '#2563eb',
      onColor: '#ffffff',
    })
  })

  it('returns secondary baseColor and onSecondary onColor', () => {
    const result = resolveColorPair('secondary', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: '#64748b',
      onColor: '#ffffff',
    })
  })

  it('returns tertiary baseColor and onTertiary onColor', () => {
    const result = resolveColorPair('tertiary', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: '#f59e0b',
      onColor: '#ffffff',
    })
  })

  it('returns muted baseColor and onMuted onColor', () => {
    const result = resolveColorPair('muted', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: '#f1f5f9',
      onColor: '#334155',
    })
  })

  it('returns custom1 baseColor and onCustom1 onColor', () => {
    const result = resolveColorPair('custom1', DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: '#8b5cf6',
      onColor: '#ffffff',
    })
  })

  it('falls back to accent then hardcoded value for tertiary when tertiary is falsy', () => {
    const config = structuredClone(DEFAULT_TEMPLATE_CONFIG) as TemplateConfig & { colors: { tertiary: string } }
    config.colors.tertiary = ''
    const result = resolveColorPair('tertiary', config)
    // tertiary is falsy, so falls back to accent ('#f59e0b')
    expect(result.baseColor).toBe('#f59e0b')
  })

  it('falls back to hardcoded default for tertiary when both tertiary and accent are falsy', () => {
    const config = structuredClone(DEFAULT_TEMPLATE_CONFIG) as TemplateConfig & { colors: { tertiary: string; accent?: string } }
    config.colors.tertiary = ''
    config.colors.accent = ''
    const result = resolveColorPair('tertiary', config)
    expect(result.baseColor).toBe('#f59e0b')
  })

  it('uses the default (tertiary) case for an unrecognized colorPair key', () => {
    // Force an unknown key through the type system to exercise the default branch
    const result = resolveColorPair('unknown' as any, DEFAULT_TEMPLATE_CONFIG)
    expect(result).toEqual({
      baseColor: DEFAULT_TEMPLATE_CONFIG.colors.tertiary,
      onColor: '#ffffff',
    })
  })
})
