import { describe, it, expect } from 'vitest'
import { generateCSSVariables, generateGoogleFontsURL } from '../cssVariableGenerator'
import { DEFAULT_TEMPLATE_CONFIG } from '../../types/defaultTemplateConfig'
import type { TemplateConfig } from '../../types'

/**
 * Helper: deep-clone DEFAULT_TEMPLATE_CONFIG and merge overrides.
 * Uses structured clone + manual deep merge for nested objects so tests
 * can override a single leaf without losing sibling properties.
 */
function configWith(overrides: Record<string, any>): TemplateConfig {
  const base = structuredClone(DEFAULT_TEMPLATE_CONFIG)

  function deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object'
      ) {
        deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
    return target
  }

  return deepMerge(base, overrides)
}

// ---------------------------------------------------------------------------
// generateCSSVariables
// ---------------------------------------------------------------------------
describe('generateCSSVariables', () => {
  // -----------------------------------------------------------------------
  // Default config: spot-check important CSS variables
  // -----------------------------------------------------------------------
  describe('with DEFAULT_TEMPLATE_CONFIG', () => {
    const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)

    it('generates --primary-color from config.colors.primary', () => {
      expect(vars['--primary-color']).toBe('#2563eb')
    })

    it('generates --on-primary-color from config.colors.onPrimary', () => {
      expect(vars['--on-primary-color']).toBe('#ffffff')
    })

    it('generates --secondary-color from config.colors.secondary', () => {
      expect(vars['--secondary-color']).toBe('#64748b')
    })

    it('generates --tertiary-color from config.colors.tertiary', () => {
      expect(vars['--tertiary-color']).toBe('#f59e0b')
    })

    it('generates --font-family from config.typography.fontFamily.body', () => {
      expect(vars['--font-family']).toBe('Georgia, "Times New Roman", serif')
    })

    it('generates --heading-font-family from config.typography.fontFamily.heading', () => {
      expect(vars['--heading-font-family']).toBe('Inter, system-ui, -apple-system, sans-serif')
    })

    it('generates --base-font-size from config.typography.baseFontSize', () => {
      expect(vars['--base-font-size']).toBe('10pt')
    })

    it('generates --page-width from config.layout.pageWidth', () => {
      expect(vars['--page-width']).toBe('210mm')
    })

    it('generates --sidebar-width from config.layout.sidebarWidth', () => {
      expect(vars['--sidebar-width']).toBe('84mm')
    })

    it('generates --page-margin-top from config.layout.pageMargin.top', () => {
      expect(vars['--page-margin-top']).toBe('20mm')
    })

    it('generates --page-margin-right from config.layout.pageMargin.right', () => {
      expect(vars['--page-margin-right']).toBe('20mm')
    })

    it('generates --text-color from config.colors.text.primary', () => {
      expect(vars['--text-color']).toBe('#0f172a')
    })

    it('generates --border-color from config.colors.borders', () => {
      expect(vars['--border-color']).toBe('#e2e8f0')
    })

    it('generates --section-spacing from config.layout.sectionSpacing', () => {
      expect(vars['--section-spacing']).toBe('24px')
    })

    it('generates --tag-border-radius from config.components.tags.borderRadius', () => {
      expect(vars['--tag-border-radius']).toBe('4px')
    })
  })

  // -----------------------------------------------------------------------
  // All values are strings
  // -----------------------------------------------------------------------
  describe('value types', () => {
    it('returns only string values (no undefined)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      for (const [key, value] of Object.entries(vars)) {
        expect(typeof value).toBe('string')
        expect(value).not.toBeUndefined()
      }
    })
  })

  // -----------------------------------------------------------------------
  // Custom colors
  // -----------------------------------------------------------------------
  describe('custom colors', () => {
    it('uses custom primary color', () => {
      const vars = generateCSSVariables(configWith({ colors: { primary: '#ff0000' } }))
      expect(vars['--primary-color']).toBe('#ff0000')
    })

    it('uses custom secondary color', () => {
      const vars = generateCSSVariables(configWith({ colors: { secondary: '#00ff00' } }))
      expect(vars['--secondary-color']).toBe('#00ff00')
    })

    it('uses custom tertiary color and mirrors to --accent-color', () => {
      const vars = generateCSSVariables(configWith({ colors: { tertiary: '#0000ff' } }))
      expect(vars['--tertiary-color']).toBe('#0000ff')
      expect(vars['--accent-color']).toBe('#0000ff')
    })

    it('uses custom text colors', () => {
      const vars = generateCSSVariables(
        configWith({ colors: { text: { primary: '#111', secondary: '#222', muted: '#333' } } })
      )
      expect(vars['--text-color']).toBe('#111')
      expect(vars['--text-secondary']).toBe('#222')
      expect(vars['--text-muted']).toBe('#333')
    })

    it('uses custom color pairs (custom1-4)', () => {
      const vars = generateCSSVariables(
        configWith({
          colors: {
            custom1: '#aaa',
            onCustom1: '#bbb',
            custom2: '#ccc',
            onCustom2: '#ddd',
          },
        })
      )
      expect(vars['--custom1-color']).toBe('#aaa')
      expect(vars['--on-custom1-color']).toBe('#bbb')
      expect(vars['--custom2-color']).toBe('#ccc')
      expect(vars['--on-custom2-color']).toBe('#ddd')
    })
  })

  // -----------------------------------------------------------------------
  // Custom fonts
  // -----------------------------------------------------------------------
  describe('custom fonts', () => {
    it('uses custom body font family', () => {
      const vars = generateCSSVariables(
        configWith({ typography: { fontFamily: { body: 'Roboto, sans-serif' } } })
      )
      expect(vars['--font-family']).toBe('Roboto, sans-serif')
    })

    it('uses custom heading font family', () => {
      const vars = generateCSSVariables(
        configWith({ typography: { fontFamily: { heading: 'Montserrat, sans-serif' } } })
      )
      expect(vars['--heading-font-family']).toBe('Montserrat, sans-serif')
    })
  })

  // -----------------------------------------------------------------------
  // Page margins (numeric and with units via ensureMarginUnits)
  // -----------------------------------------------------------------------
  describe('page margins', () => {
    it('handles margin values already containing units', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageMargin: { top: '15mm', right: '10mm', bottom: '25mm', left: '30mm' } } })
      )
      expect(vars['--page-margin-top']).toBe('15mm')
      expect(vars['--page-margin-right']).toBe('10mm')
      expect(vars['--page-margin-bottom']).toBe('25mm')
      expect(vars['--page-margin-left']).toBe('30mm')
    })

    it('appends mm to numeric-only margin values', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageMargin: { top: 15, right: 10, bottom: 25, left: 30 } } })
      )
      expect(vars['--page-margin-top']).toBe('15mm')
      expect(vars['--page-margin-right']).toBe('10mm')
      expect(vars['--page-margin-bottom']).toBe('25mm')
      expect(vars['--page-margin-left']).toBe('30mm')
    })

    it('appends mm to numeric string margin values', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageMargin: { top: '15', right: '10', bottom: '25', left: '30' } } })
      )
      expect(vars['--page-margin-top']).toBe('15mm')
      expect(vars['--page-margin-right']).toBe('10mm')
      expect(vars['--page-margin-bottom']).toBe('25mm')
      expect(vars['--page-margin-left']).toBe('30mm')
    })

    it('preserves non-mm units like px', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageMargin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } } })
      )
      expect(vars['--page-margin-top']).toBe('20px')
      expect(vars['--page-margin-right']).toBe('20px')
    })
  })

  // -----------------------------------------------------------------------
  // Font scale / calculateFontSize
  // -----------------------------------------------------------------------
  describe('font size calculations (calculateFontSize)', () => {
    it('calculates --title-font-size from h1 scale (3.2 * 10 = 32.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--title-font-size']).toBe('32.0pt')
    })

    it('calculates --h2-font-size from h2 scale (2.4 * 10 = 24.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--h2-font-size']).toBe('24.0pt')
    })

    it('calculates --h3-font-size from h3 scale (2.0 * 10 = 20.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--h3-font-size']).toBe('20.0pt')
    })

    it('calculates --body-font-size from body scale (1.6 * 10 = 16.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--body-font-size']).toBe('16.0pt')
    })

    it('calculates --small-font-size from small scale (1.4 * 10 = 14.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--small-font-size']).toBe('14.0pt')
    })

    it('calculates --tiny-font-size from tiny scale (1.2 * 10 = 12.0pt)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--tiny-font-size']).toBe('12.0pt')
    })

    it('calculates font sizes with a different base size (px)', () => {
      const vars = generateCSSVariables(
        configWith({ typography: { baseFontSize: '12px' } })
      )
      // h1: 3.2 * 12 = 38.4px
      expect(vars['--title-font-size']).toBe('38.4px')
      // body: 1.6 * 12 = 19.2px
      expect(vars['--body-font-size']).toBe('19.2px')
    })

    it('calculates font sizes with custom font scale values', () => {
      const vars = generateCSSVariables(
        configWith({ typography: { baseFontSize: '10pt', fontScale: { h1: 4.0, h2: 3.0, h3: 2.5, body: 1.8, small: 1.5, tiny: 1.0, tag: 1.4, dateLine: 1.5, inlineCode: 1.1 } } })
      )
      expect(vars['--title-font-size']).toBe('40.0pt')
      expect(vars['--h2-font-size']).toBe('30.0pt')
      expect(vars['--h3-font-size']).toBe('25.0pt')
      expect(vars['--body-font-size']).toBe('18.0pt')
      expect(vars['--small-font-size']).toBe('15.0pt')
      expect(vars['--tiny-font-size']).toBe('10.0pt')
      expect(vars['--tag-font-size']).toBe('14.0pt')
      expect(vars['--date-line-font-size']).toBe('15.0pt')
      expect(vars['--inline-code-font-size']).toBe('11.0pt')
    })
  })

  // -----------------------------------------------------------------------
  // Tags CSS variables with different color pairs
  // -----------------------------------------------------------------------
  describe('tag color pairs', () => {
    it('uses tertiary color pair by default for tag background (with opacity)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      // Default: tertiary=#f59e0b, bgOpacity=0.2 => rgba(245, 158, 11, 0.2)
      expect(vars['--tag-bg-color']).toBe('rgba(245, 158, 11, 0.2)')
    })

    it('uses tertiary onColor for tag text (with opacity)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      // Default: onTertiary=#ffffff, textOpacity=1.0 => rgba(255, 255, 255, 1)
      expect(vars['--tag-text-color']).toBe('rgba(255, 255, 255, 1)')
    })

    it('uses primary color pair when tags.colorPair is "primary"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { tags: { colorPair: 'primary' } } })
      )
      // primary=#2563eb with 0.2 opacity => rgba(37, 99, 235, 0.2)
      expect(vars['--tag-bg-color']).toBe('rgba(37, 99, 235, 0.2)')
      // onPrimary=#ffffff with 1.0 opacity => rgba(255, 255, 255, 1)
      expect(vars['--tag-text-color']).toBe('rgba(255, 255, 255, 1)')
    })

    it('uses custom opacity values for tags', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            tags: { colorPair: 'tertiary', backgroundOpacity: 0.5, textOpacity: 0.8 },
          },
        })
      )
      expect(vars['--tag-bg-color']).toBe('rgba(245, 158, 11, 0.5)')
      expect(vars['--tag-text-color']).toBe('rgba(255, 255, 255, 0.8)')
    })

    it('applies custom tag typography properties', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            tags: {
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              padding: '6px 12px',
              gap: '12px',
            },
          },
        })
      )
      expect(vars['--tag-font-weight']).toBe('700')
      expect(vars['--tag-letter-spacing']).toBe('0.05em')
      expect(vars['--tag-text-transform']).toBe('uppercase')
      expect(vars['--tag-font-style']).toBe('italic')
      expect(vars['--tag-padding']).toBe('6px 12px')
      expect(vars['--tag-gap']).toBe('12px')
    })
  })

  // -----------------------------------------------------------------------
  // Section header overrides (with/without colorKey)
  // -----------------------------------------------------------------------
  describe('section header color overrides', () => {
    it('does NOT include --section-header-color when colorKey is not set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars).not.toHaveProperty('--section-header-color')
    })

    it('does NOT include --section-header-background-color when backgroundColorKey is not set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars).not.toHaveProperty('--section-header-background-color')
    })

    it('includes --section-header-color when colorKey is set', () => {
      const vars = generateCSSVariables(
        configWith({ components: { sectionHeader: { colorKey: 'primary' } } })
      )
      expect(vars['--section-header-color']).toBe('#2563eb')
    })

    it('includes --section-header-background-color when backgroundColorKey is set', () => {
      const vars = generateCSSVariables(
        configWith({
          components: { sectionHeader: { backgroundColorKey: 'muted' } },
        })
      )
      expect(vars['--section-header-background-color']).toBe('#f1f5f9')
    })

    it('applies opacity to section header color when provided', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            sectionHeader: { colorKey: 'primary', colorOpacity: 0.5 },
          },
        })
      )
      // primary=#2563eb with 0.5 opacity => rgba(37, 99, 235, 0.5)
      expect(vars['--section-header-color']).toBe('rgba(37, 99, 235, 0.5)')
    })

    it('applies opacity to section header background when provided', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            sectionHeader: { backgroundColorKey: 'primary', backgroundColorOpacity: 0.3 },
          },
        })
      )
      expect(vars['--section-header-background-color']).toBe('rgba(37, 99, 235, 0.3)')
    })
  })

  // -----------------------------------------------------------------------
  // Margin modes: name component
  // -----------------------------------------------------------------------
  describe('name margin modes', () => {
    it('uses individual margins by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--name-margin-top']).toBe('0px')
      expect(vars['--name-margin-bottom']).toBe('8px')
      expect(vars['--name-margin-left']).toBe('0px')
      expect(vars['--name-margin-right']).toBe('0px')
    })

    it('uses uniform margin when marginMode is "uniform"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            name: { marginMode: 'uniform', marginUniform: '16px' },
          },
        })
      )
      expect(vars['--name-margin-top']).toBe('16px')
      expect(vars['--name-margin-bottom']).toBe('16px')
      expect(vars['--name-margin-left']).toBe('16px')
      expect(vars['--name-margin-right']).toBe('16px')
    })

    it('uses individual margins when marginMode is "individual"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            name: {
              marginMode: 'individual',
              marginTop: '4px',
              marginBottom: '12px',
              marginLeft: '8px',
              marginRight: '6px',
            },
          },
        })
      )
      expect(vars['--name-margin-top']).toBe('4px')
      expect(vars['--name-margin-bottom']).toBe('12px')
      expect(vars['--name-margin-left']).toBe('8px')
      expect(vars['--name-margin-right']).toBe('6px')
    })
  })

  // -----------------------------------------------------------------------
  // Margin modes: sectionHeader component
  // -----------------------------------------------------------------------
  describe('sectionHeader margin modes', () => {
    it('uses individual margins by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--section-header-margin-top']).toBe('24px')
      expect(vars['--section-header-margin-bottom']).toBe('12px')
      expect(vars['--section-header-margin-left']).toBe('0px')
      expect(vars['--section-header-margin-right']).toBe('0px')
    })

    it('uses uniform margin when marginMode is "uniform"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            sectionHeader: { marginMode: 'uniform', marginUniform: '20px' },
          },
        })
      )
      expect(vars['--section-header-margin-top']).toBe('20px')
      expect(vars['--section-header-margin-bottom']).toBe('20px')
      expect(vars['--section-header-margin-left']).toBe('20px')
      expect(vars['--section-header-margin-right']).toBe('20px')
    })
  })

  // -----------------------------------------------------------------------
  // Margin modes: jobTitle component
  // -----------------------------------------------------------------------
  describe('jobTitle margin modes', () => {
    it('uses individual margins by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--job-title-margin-top']).toBe('0px')
      expect(vars['--job-title-margin-bottom']).toBe('4px')
      expect(vars['--job-title-margin-left']).toBe('0px')
      expect(vars['--job-title-margin-right']).toBe('0px')
    })

    it('uses uniform margin when marginMode is "uniform"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            jobTitle: { marginMode: 'uniform', marginUniform: '10px' },
          },
        })
      )
      expect(vars['--job-title-margin-top']).toBe('10px')
      expect(vars['--job-title-margin-bottom']).toBe('10px')
      expect(vars['--job-title-margin-left']).toBe('10px')
      expect(vars['--job-title-margin-right']).toBe('10px')
    })
  })

  // -----------------------------------------------------------------------
  // Padding modes: name component
  // -----------------------------------------------------------------------
  describe('name padding modes', () => {
    it('uses uniform padding by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--name-padding']).toBe('0px')
    })

    it('uses individual padding when paddingMode is "individual"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            name: {
              paddingMode: 'individual',
              paddingTop: '4px',
              paddingRight: '8px',
              paddingBottom: '12px',
              paddingLeft: '16px',
            },
          },
        })
      )
      expect(vars['--name-padding']).toBe('4px 8px 12px 16px')
    })

    it('uses paddingUniform when paddingMode is not "individual"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            name: { paddingMode: 'uniform', paddingUniform: '10px' },
          },
        })
      )
      expect(vars['--name-padding']).toBe('10px')
    })
  })

  // -----------------------------------------------------------------------
  // Padding modes: sectionHeader component
  // -----------------------------------------------------------------------
  describe('sectionHeader padding modes', () => {
    it('uses legacy padding value by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      // Default sectionHeader.padding = '0 0 4px 0'
      expect(vars['--section-header-padding']).toBe('0 0 4px 0')
    })

    it('uses individual padding when paddingMode is "individual"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            sectionHeader: {
              paddingMode: 'individual',
              paddingTop: '2px',
              paddingRight: '4px',
              paddingBottom: '6px',
              paddingLeft: '8px',
            },
          },
        })
      )
      expect(vars['--section-header-padding']).toBe('2px 4px 6px 8px')
    })
  })

  // -----------------------------------------------------------------------
  // Padding modes: jobTitle component
  // -----------------------------------------------------------------------
  describe('jobTitle padding modes', () => {
    it('uses uniform padding by default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--job-title-padding']).toBe('0px')
    })

    it('uses individual padding when paddingMode is "individual"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: {
            jobTitle: {
              paddingMode: 'individual',
              paddingTop: '5px',
              paddingRight: '10px',
              paddingBottom: '15px',
              paddingLeft: '20px',
            },
          },
        })
      )
      expect(vars['--job-title-padding']).toBe('5px 10px 15px 20px')
    })
  })

  // -----------------------------------------------------------------------
  // Shadow values
  // -----------------------------------------------------------------------
  describe('shadow values', () => {
    it('returns "none" for shadow: "none"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { name: { shadow: 'none' } } })
      )
      expect(vars['--name-shadow']).toBe('none')
    })

    it('returns small shadow for shadow: "sm"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { name: { shadow: 'sm' } } })
      )
      expect(vars['--name-shadow']).toBe('0 1px 2px rgba(0, 0, 0, 0.05)')
    })

    it('returns medium shadow for shadow: "md"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { sectionHeader: { shadow: 'md' } } })
      )
      expect(vars['--section-header-shadow']).toBe('0 4px 6px rgba(0, 0, 0, 0.1)')
    })

    it('returns large shadow for shadow: "lg"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { jobTitle: { shadow: 'lg' } } })
      )
      expect(vars['--job-title-shadow']).toBe('0 10px 15px rgba(0, 0, 0, 0.1)')
    })

    it('returns "none" for profile photo shadow default', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--profile-photo-shadow']).toBe('none')
    })

    it('returns xl shadow for profile photo shadow: "xl"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { profilePhoto: { shadow: 'xl' } } })
      )
      expect(vars['--profile-photo-shadow']).toBe('0 20px 25px rgba(0, 0, 0, 0.15)')
    })
  })

  // -----------------------------------------------------------------------
  // Profile photo filter values
  // -----------------------------------------------------------------------
  describe('profile photo filter values', () => {
    it('returns "none" for filter: "none"', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--profile-photo-filter']).toBe('none')
    })

    it('returns grayscale filter for filter: "grayscale"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { profilePhoto: { filter: 'grayscale' } } })
      )
      expect(vars['--profile-photo-filter']).toBe('grayscale(100%)')
    })

    it('returns sepia filter for filter: "sepia"', () => {
      const vars = generateCSSVariables(
        configWith({ components: { profilePhoto: { filter: 'sepia' } } })
      )
      expect(vars['--profile-photo-filter']).toBe('sepia(100%)')
    })
  })

  // -----------------------------------------------------------------------
  // calculateMainWidth (tested via --main-width)
  // -----------------------------------------------------------------------
  describe('main width calculation (calculateMainWidth)', () => {
    it('subtracts sidebar from page width when both are mm', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      // 210mm - 84mm = 126mm
      expect(vars['--main-width']).toBe('126mm')
    })

    it('subtracts when both are px', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageWidth: '800px', sidebarWidth: '300px' } })
      )
      expect(vars['--main-width']).toBe('500px')
    })

    it('uses calc() for mixed units', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageWidth: '210mm', sidebarWidth: '30%' } })
      )
      expect(vars['--main-width']).toBe('calc(210mm - 30%)')
    })

    it('uses calc() when both are percentages', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { pageWidth: '100%', sidebarWidth: '30%' } })
      )
      expect(vars['--main-width']).toBe('calc(100% - 30%)')
    })
  })

  // -----------------------------------------------------------------------
  // Font weights
  // -----------------------------------------------------------------------
  describe('font weights', () => {
    it('generates heading weight as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--heading-weight']).toBe('700')
    })

    it('generates body weight as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--body-weight']).toBe('400')
    })

    it('generates subheading weight as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--subheading-weight']).toBe('600')
    })

    it('generates bold weight as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--bold-weight']).toBe('600')
    })
  })

  // -----------------------------------------------------------------------
  // Line heights
  // -----------------------------------------------------------------------
  describe('line heights', () => {
    it('generates heading line height as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--heading-line-height']).toBe('1.2')
    })

    it('generates body line height as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--body-line-height']).toBe('1.6')
    })

    it('generates compact line height as string', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--compact-line-height']).toBe('1.4')
    })
  })

  // -----------------------------------------------------------------------
  // Advanced effects
  // -----------------------------------------------------------------------
  describe('advanced effects', () => {
    it('sets animation duration to 0s when animations disabled', () => {
      const vars = generateCSSVariables(
        configWith({ advanced: { animations: false } })
      )
      expect(vars['--animation-duration']).toBe('0s')
    })

    it('sets animation duration to 0.2s when animations enabled', () => {
      const vars = generateCSSVariables(
        configWith({ advanced: { animations: true } })
      )
      expect(vars['--animation-duration']).toBe('0.2s')
    })

    it('sets shadow-default to "none" when shadows disabled', () => {
      const vars = generateCSSVariables(
        configWith({ advanced: { shadows: false } })
      )
      expect(vars['--shadow-default']).toBe('none')
    })

    it('sets shadow-default to shadow value when shadows enabled', () => {
      const vars = generateCSSVariables(
        configWith({ advanced: { shadows: true } })
      )
      expect(vars['--shadow-default']).toBe('0 1px 3px rgba(0, 0, 0, 0.1)')
      expect(vars['--shadow-hover']).toBe('0 4px 12px rgba(0, 0, 0, 0.15)')
    })
  })

  // -----------------------------------------------------------------------
  // Name component: background and divider
  // -----------------------------------------------------------------------
  describe('name component background and divider', () => {
    it('returns transparent background when no backgroundColorKey set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--name-background-color']).toBe('transparent')
    })

    it('resolves background color when backgroundColorKey is set', () => {
      const vars = generateCSSVariables(
        configWith({
          components: { name: { backgroundColorKey: 'primary' } },
        })
      )
      expect(vars['--name-background-color']).toBe('#2563eb')
    })

    it('hides divider when dividerStyle is "none" or not set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--name-divider-display']).toBe('none')
    })

    it('shows divider when dividerStyle is set to "underline"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: { name: { dividerStyle: 'underline' } },
        })
      )
      expect(vars['--name-divider-display']).toBe('block')
    })
  })

  // -----------------------------------------------------------------------
  // Section header divider display
  // -----------------------------------------------------------------------
  describe('section header divider display', () => {
    it('shows divider when dividerStyle is "underline" (default has this)', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      // Default sectionHeader.dividerStyle = 'underline'
      expect(vars['--section-header-divider-display']).toBe('block')
    })

    it('hides divider when dividerStyle is "none"', () => {
      const vars = generateCSSVariables(
        configWith({
          components: { sectionHeader: { dividerStyle: 'none' } },
        })
      )
      expect(vars['--section-header-divider-display']).toBe('none')
    })
  })

  // -----------------------------------------------------------------------
  // Job title background and divider
  // -----------------------------------------------------------------------
  describe('job title background and divider', () => {
    it('returns transparent background when no backgroundColorKey set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--job-title-background-color']).toBe('transparent')
    })

    it('resolves background color when backgroundColorKey is set', () => {
      const vars = generateCSSVariables(
        configWith({
          components: { jobTitle: { backgroundColorKey: 'muted' } },
        })
      )
      expect(vars['--job-title-background-color']).toBe('#f1f5f9')
    })

    it('hides divider when dividerStyle is not set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--job-title-divider-display']).toBe('none')
    })
  })

  // -----------------------------------------------------------------------
  // Layout background colors
  // -----------------------------------------------------------------------
  describe('layout background colors', () => {
    it('uses mainBackground when set', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { mainBackground: '#f0f0f0' } })
      )
      expect(vars['--background-color']).toBe('#f0f0f0')
    })

    it('falls back to colors.background when mainBackground is not set', () => {
      const vars = generateCSSVariables(DEFAULT_TEMPLATE_CONFIG)
      expect(vars['--background-color']).toBe('#ffffff')
    })

    it('uses sidebarBackground for --surface-color when set', () => {
      const vars = generateCSSVariables(
        configWith({ layout: { sidebarBackground: '#e0e0e0' } })
      )
      expect(vars['--surface-color']).toBe('#e0e0e0')
    })
  })
})

// ---------------------------------------------------------------------------
// generateGoogleFontsURL
// ---------------------------------------------------------------------------
describe('generateGoogleFontsURL', () => {
  it('returns empty string for empty array', () => {
    expect(generateGoogleFontsURL([])).toBe('')
  })

  it('returns empty string for null input', () => {
    expect(generateGoogleFontsURL(null as unknown as string[])).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(generateGoogleFontsURL(undefined as unknown as string[])).toBe('')
  })

  it('generates correct URL for a single font', () => {
    const url = generateGoogleFontsURL(['Inter'])
    expect(url).toContain('https://fonts.googleapis.com/css2?')
    expect(url).toContain('family=Inter:ital,wght@')
    expect(url).toContain('display=swap')
  })

  it('includes all weight variants in the URL', () => {
    const url = generateGoogleFontsURL(['Inter'])
    // Regular (ital=0) weights
    expect(url).toContain('0,400')
    expect(url).toContain('0,500')
    expect(url).toContain('0,600')
    expect(url).toContain('0,700')
    // Italic (ital=1) weights
    expect(url).toContain('1,400')
    expect(url).toContain('1,500')
    expect(url).toContain('1,600')
    expect(url).toContain('1,700')
  })

  it('generates correct URL for multiple fonts', () => {
    const url = generateGoogleFontsURL(['Inter', 'Roboto'])
    expect(url).toContain('family=Inter:ital,wght@')
    expect(url).toContain('family=Roboto:ital,wght@')
    // Multiple families are separated by &
    expect(url).toMatch(/family=Inter.*&family=Roboto/)
  })

  it('deduplicates font names', () => {
    const url = generateGoogleFontsURL(['Inter', 'Roboto', 'Inter'])
    // Inter should appear only once
    const interOccurrences = (url.match(/family=Inter/g) || []).length
    expect(interOccurrences).toBe(1)
  })

  it('replaces spaces in font names with +', () => {
    const url = generateGoogleFontsURL(['Open Sans'])
    expect(url).toContain('family=Open+Sans:ital,wght@')
    expect(url).not.toContain('family=Open Sans')
  })

  it('handles font names with multiple spaces', () => {
    const url = generateGoogleFontsURL(['Playfair Display'])
    expect(url).toContain('family=Playfair+Display:ital,wght@')
  })
})
