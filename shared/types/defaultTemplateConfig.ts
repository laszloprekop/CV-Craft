/**
 * Default Template Configuration
 *
 * Provides a comprehensive default configuration for CV templates
 */

import type { TemplateConfig } from './index';

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colors: {
    primary: '#2b3a4e',       // Deep slate-blue - strong, authoritative
    onPrimary: '#f0f4f8',     // Light blue-white for readable text on primary
    secondary: '#eae8e4',     // Warm stone - distinct sidebar background
    onSecondary: '#2d3748',   // Dark slate - strong contrast on sidebar (11:1)
    tertiary: '#3d7a8a',      // Deep teal - rich, saturated accent
    onTertiary: '#ffffff',    // White text on teal (7:1 contrast)
    background: '#fafaf9',    // Warm off-white
    muted: '#ddd9d4',         // Warm taupe - visible muted elements
    onMuted: '#3f3f46',       // Zinc-700 - strong contrast on muted (7:1)
    text: {
      primary: '#18181b',     // Zinc-900 - near-black, excellent readability
      secondary: '#52525b',   // Zinc-600 - 7:1 contrast on white
      muted: '#71717a',       // Zinc-500 - 4.6:1, passes AA normal text
    },
    borders: '#c8c3bd',       // Warm gray - visible border
    links: {
      default: '#2d7a8a',     // Deep teal - matches tertiary, 5.5:1 on white
      hover: '#1b5c6b',       // Even darker teal on hover (8:1)
    },
    // Custom color pairs - all chosen for good contrast with white text
    custom1: '#6b5fa6',       // Rich purple (5.2:1)
    onCustom1: '#ffffff',
    custom2: '#a85c4a',       // Warm sienna (4.8:1)
    onCustom2: '#ffffff',
    custom3: '#3d7a5f',       // Forest green (5.1:1)
    onCustom3: '#ffffff',
    custom4: '#8a7042',       // Warm bronze (4.7:1)
    onCustom4: '#ffffff',
    // Legacy support
    accent: '#3d7a8a',        // Deprecated, use tertiary
    highlight: '#dff0f4',     // Light teal tint
    error: '#b44240',         // Muted red (5.3:1)
    success: '#3d7a5f',       // Forest green (5.1:1)
  },

  typography: {
    // Base font size for scaling
    baseFontSize: '10pt',

    // Google Fonts Integration
    availableFonts: [
      'Inter',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'Raleway',
      'Merriweather',
      'Playfair Display',
      'Lora',
      'IBM Plex Sans',
      'Crimson Text',
    ],
    fontLoadingStrategy: 'preload',

    fontFamily: {
      heading: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
      body: 'Inter, system-ui, -apple-system, sans-serif',
      monospace: '"Fira Code", "Courier New", monospace',
    },

    // Font scale relative to baseFontSize (x1.0 = body text size)
    fontScale: {
      h1: 2.0,        // Main name/title - prominent but not oversized
      h2: 1.3,        // Section headers - clear hierarchy above body
      h3: 1.1,        // Job titles - slightly larger than body
      body: 1.0,      // Paragraphs, descriptions (reference size)
      small: 0.9,     // Metadata, contact info
      tiny: 0.8,      // Fine print, page numbers
      tag: 0.9,       // Skill tags
      dateLine: 0.9,  // Date ranges in experience/education
      inlineCode: 0.85,// Inline code snippets
    },

    fontSize: {
      h1: '20pt',
      h2: '13pt',
      h3: '11pt',
      body: '10pt',
      small: '9pt',
      tiny: '8pt',
    },
    fontWeight: {
      heading: 700,
      subheading: 600,
      body: 400,
      bold: 600,
    },
    lineHeight: {
      heading: 1.3,
      body: 1.5,
      compact: 1.4,
    },
    letterSpacing: {
      heading: '-0.01em',
      body: '0',
    },
  },

  layout: {
    templateType: 'two-column',
    sidebarWidth: '40%',
    sidebarBackground: '#eae8e4',
    mainBackground: '#ffffff',
    pageWidth: '210mm', // A4 width
    pageMargin: {
      top: '15mm',
      right: '14mm',
      bottom: '18mm',
      left: '12mm',
    },
    sectionSpacing: '20px',
    paragraphSpacing: '10px',
    columns: {
      enabled: true,
      gap: '0px',
      ratio: '1:2',
    },
  },

  components: {
    // Main name (H1)
    name: {
      fontFamily: undefined, // Uses heading font by default
      fontSize: undefined,   // Uses h1 × baseFontSize (calculated)
      fontWeight: 800,
      color: '#18181b',
      letterSpacing: '-0.01em',
      textTransform: 'uppercase',
      alignment: 'left',
      marginBottom: '8px',
    },
    // Contact information
    contactInfo: {
      layout: 'stacked',
      iconSize: '16px',
      iconColor: '#3d7a8a',
      textColor: '#3f3f46',
      spacing: '10px',
      fontSize: undefined, // Uses small × baseFontSize (calculated)
      showIcons: true,
      iconPosition: 'left',
      separator: '·',
    },
    // Profile photo
    profilePhoto: {
      size: '200px',
      borderRadius: '50%',
      border: 'none',
      borderColor: '#c8c3bd',
      position: 'left',
    },
    header: {
      backgroundColor: undefined,
      padding: '0 0 12px 0',
      borderBottom: 'none',
      alignment: 'left',
      nameSize: '20pt',
      contactSize: '9pt',
    },
    // Section headers (H2)
    // Two-column CSS provides colored backgrounds as the primary decorator.
    // dividerStyle is 'none' to avoid double decoration (background + underline).
    sectionHeader: {
      fontFamily: undefined, // Uses heading font by default
      fontSize: undefined,   // Uses h2 × baseFontSize (calculated)
      fontWeight: 700,
      textTransform: 'capitalize',
      dividerStyle: 'none',
      padding: '4px 8px',
      marginTop: '20px',
      marginBottom: '10px',
      letterSpacing: '0.03em',
    },
    section: {
      marginBottom: '20px',
      titleColor: '#2b3a4e',
      titleBorderBottom: '1px solid #c8c3bd',
      titlePadding: '0 0 6px 0',
      titleTransform: 'none',
    },
    // Job/education titles (H3)
    jobTitle: {
      fontFamily: undefined,
      fontSize: undefined,
      fontWeight: 600,
      color: '#18181b',
      fontStyle: 'normal',
      marginBottom: '4px',
      textTransform: 'none',
    },
    // Organization/company names
    organizationName: {
      fontSize: undefined,
      fontWeight: 500,
      color: '#52525b',
      fontStyle: 'normal',
    },
    // Key-value pairs
    keyValue: {
      labelColor: '#18181b',
      labelWeight: 600,
      valueColor: '#52525b',
      valueWeight: 400,
      separator: ':',
      spacing: '4px',
    },
    // Emphasized text
    emphasis: {
      fontWeight: 600,
      color: '#18181b',
    },
    tags: {
      colorPair: 'tertiary',      // Uses muted teal
      backgroundOpacity: 0.15,    // 15% opacity - subtle
      textColorKey: 'text-primary',// Dark text on light bg (>12:1 contrast)
      textOpacity: 1.0,
      backgroundColor: '#e0e7ff', // Legacy fallback
      textColor: '#3730a3',       // Legacy fallback
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: undefined,
      gap: '6px',
      border: undefined,
      fontWeight: 500,
      style: 'pill',
      separator: '·',
    },
    dateLine: {
      color: '#71717a',
      fontStyle: 'italic',
      fontSize: undefined,
      fontWeight: 400,
      alignment: 'left',
      format: 'short',
    },
    list: {
      level1: {
        bulletStyle: 'disc',
        customBullet: undefined,
        color: '#3d7a8a',
        indent: '18px',
      },
      level2: {
        bulletStyle: 'circle',
        customBullet: undefined,
        color: '#71717a',
        indent: '36px',
      },
      level3: {
        bulletStyle: 'square',
        customBullet: undefined,
        color: '#a1a1aa',
        indent: '54px',
      },
      // Legacy support
      bulletStyle: 'disc',
      customBullet: undefined,
      indent: '18px',
      spacing: '6px',
      markerColor: '#3d7a8a',
    },
    links: {
      color: '#2d7a8a',
      hoverColor: '#1b5c6b',
      underline: true,
      underlineStyle: 'always',
      fontWeight: 500,
      decoration: 'underline',
    },
    divider: {
      style: 'solid',
      color: '#c8c3bd',
      thickness: '1px',
      spacing: '14px',
    },
  },

  pdf: {
    pageSize: 'A4',
    orientation: 'portrait',
    printColorAdjust: true,
    pageNumbers: {
      enabled: false,
      position: 'bottom-center',
      format: 'Page {page} of {total}',
    },
  },

  advanced: {
    customCSS: '',
    animations: false,
    shadows: false,
    iconSet: 'phosphor',
  },
};

/**
 * Create a customized template config by merging with defaults
 */
export function createTemplateConfig(overrides?: Partial<TemplateConfig>): TemplateConfig {
  if (!overrides) {
    return { ...DEFAULT_TEMPLATE_CONFIG };
  }

  return {
    colors: { ...DEFAULT_TEMPLATE_CONFIG.colors, ...overrides.colors },
    typography: { ...DEFAULT_TEMPLATE_CONFIG.typography, ...overrides.typography },
    layout: { ...DEFAULT_TEMPLATE_CONFIG.layout, ...overrides.layout },
    components: { ...DEFAULT_TEMPLATE_CONFIG.components, ...overrides.components },
    pdf: { ...DEFAULT_TEMPLATE_CONFIG.pdf, ...overrides.pdf },
    advanced: { ...DEFAULT_TEMPLATE_CONFIG.advanced, ...overrides.advanced },
  };
}

/**
 * Validate template config structure
 */
export function validateTemplateConfig(config: any): config is TemplateConfig {
  if (!config || typeof config !== 'object') return false;

  const requiredSections = ['colors', 'typography', 'layout', 'components', 'pdf'];
  return requiredSections.every(section => section in config && typeof config[section] === 'object');
}
