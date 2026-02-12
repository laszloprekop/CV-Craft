import { describe, it, expect } from 'vitest'
import { sanitizeUrl } from '../sanitizeUrl'

describe('sanitizeUrl', () => {
  describe('blocked protocols', () => {
    it('blocks javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#')
    })

    it('blocks vbscript: protocol', () => {
      expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBe('#')
    })

    it('blocks data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
    })

    it('blocks javascript: with mixed case', () => {
      expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBe('#')
    })

    it('blocks javascript: with leading whitespace', () => {
      expect(sanitizeUrl('  javascript:alert(1)')).toBe('#')
    })

    it('blocks javascript: with whitespace around the colon', () => {
      expect(sanitizeUrl('javascript :alert(1)')).toBe('#')
    })
  })

  describe('allowed protocols', () => {
    it('allows http: URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('allows https: URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('allows mailto: URLs', () => {
      expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com')
    })

    it('allows tel: URLs', () => {
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890')
    })
  })

  describe('relative URLs', () => {
    it('allows root-relative paths starting with /', () => {
      expect(sanitizeUrl('/about')).toBe('/about')
    })

    it('allows fragment-only URLs starting with #', () => {
      expect(sanitizeUrl('#section')).toBe('#section')
    })

    it('allows dot-relative paths starting with .', () => {
      expect(sanitizeUrl('./page.html')).toBe('./page.html')
    })

    it('allows bare paths without any protocol', () => {
      expect(sanitizeUrl('path/to/page')).toBe('path/to/page')
    })
  })

  describe('empty, null, and undefined inputs', () => {
    it('returns # for an empty string', () => {
      expect(sanitizeUrl('')).toBe('#')
    })

    it('returns # for null', () => {
      expect(sanitizeUrl(null as unknown as string)).toBe('#')
    })

    it('returns # for undefined', () => {
      expect(sanitizeUrl(undefined as unknown as string)).toBe('#')
    })
  })

  describe('unknown protocols', () => {
    it('blocks ftp: protocol', () => {
      expect(sanitizeUrl('ftp://files.example.com')).toBe('#')
    })

    it('blocks custom: protocol', () => {
      expect(sanitizeUrl('custom:something')).toBe('#')
    })
  })

  describe('edge cases', () => {
    it('trims surrounding whitespace from allowed URLs', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
    })
  })
})
