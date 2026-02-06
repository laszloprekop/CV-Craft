/**
 * Default Template Configuration
 *
 * Provides a comprehensive default configuration for CV templates
 */

import type { TemplateConfig } from './index';

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colors: {
    primary: '#2563eb',       // Blue-600
    onPrimary: '#ffffff',     // White text on primary
    secondary: '#64748b',     // Slate-500
    onSecondary: '#ffffff',   // White text on secondary
    tertiary: '#f59e0b',      // Amber-500 (renamed from accent)
    onTertiary: '#ffffff',    // White text on tertiary
    background: '#ffffff',    // White
    muted: '#f1f5f9',         // Slate-100
    onMuted: '#334155',       // Slate-700 text on muted
    text: {
      primary: '#0f172a',     // Slate-900
      secondary: '#475569',   // Slate-600
      muted: '#94a3b8',       // Slate-400
    },
    borders: '#e2e8f0',       // Slate-200
    links: {
      default: '#2563eb',     // Blue-600
      hover: '#1d4ed8',       // Blue-700
    },
    // Custom color pairs
    custom1: '#8b5cf6',       // Violet-500
    onCustom1: '#ffffff',     // White
    custom2: '#ec4899',       // Pink-500
    onCustom2: '#ffffff',     // White
    custom3: '#14b8a6',       // Teal-500
    onCustom3: '#ffffff',     // White
    custom4: '#f97316',       // Orange-500
    onCustom4: '#ffffff',     // White
    // Legacy support
    accent: '#f59e0b',        // Deprecated, use tertiary
    highlight: '#fef3c7',     // Amber-100
    error: '#dc2626',         // Red-600
    success: '#16a34a',       // Green-600
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
      'Lora'
    ],
    fontLoadingStrategy: 'preload',

    fontFamily: {
      heading: 'Inter, system-ui, -apple-system, sans-serif',
      body: 'Georgia, "Times New Roman", serif',
      monospace: '"Fira Code", "Courier New", monospace',
    },

    // Font scale relative to baseFontSize
    fontScale: {
      h1: 3.2,        // Main name/title
      h2: 2.4,        // Section headers
      h3: 2.0,        // Job titles
      body: 1.6,      // Paragraphs, descriptions
      small: 1.4,     // Metadata, contact info
      tiny: 1.2,      // Dates, locations, page numbers
      tag: 1.3,       // Skill tags
      dateLine: 1.3,  // Date ranges in experience/education
      inlineCode: 1.2,// Inline code snippets
    },

    fontSize: {
      h1: '32px',
      h2: '24px',
      h3: '20px',
      body: '16px',
      small: '14px',
      tiny: '12px',
    },
    fontWeight: {
      heading: 700,
      subheading: 600,
      body: 400,
      bold: 600,
    },
    lineHeight: {
      heading: 1.2,
      body: 1.6,
      compact: 1.4,
    },
    letterSpacing: {
      heading: '-0.02em',
      body: '0',
    },
  },

  layout: {
    templateType: 'two-column',
    sidebarWidth: '84mm', // 40% of A4 width (210mm) for two-column layout
    pageWidth: '210mm', // A4 width
    pageMargin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    sectionSpacing: '24px',
    paragraphSpacing: '12px',
    columns: {
      enabled: false,
      gap: '24px',
      ratio: '1:1',
    },
  },

  components: {
    // Main name (H1)
    name: {
      fontFamily: undefined, // Uses heading font by default
      fontSize: undefined,   // Uses h1 × baseFontSize (calculated)
      fontWeight: 700,
      color: '#0f172a',
      letterSpacing: '-0.02em',
      textTransform: 'uppercase',
      alignment: 'left',
      marginBottom: '8px',
    },
    // Contact information
    contactInfo: {
      layout: 'inline',
      iconSize: '16px',
      iconColor: '#64748b',
      textColor: '#475569',
      spacing: '12px',
      fontSize: undefined, // Uses small × baseFontSize (calculated)
      showIcons: true,
      iconPosition: 'left',
      separator: '·', // Default separator between items
    },
    // Profile photo
    profilePhoto: {
      size: '200px',
      borderRadius: '50%',
      border: '3px solid #e2e8f0',
      borderColor: '#e2e8f0',
      position: 'center',
    },
    header: {
      backgroundColor: undefined,
      padding: '0 0 16px 0',
      borderBottom: '2px solid #e2e8f0',
      alignment: 'left',
      nameSize: '36px',
      contactSize: '14px',
    },
    // Section headers (H2)
    sectionHeader: {
      fontFamily: undefined, // Uses heading font by default
      fontSize: undefined,   // Uses h2 × baseFontSize (calculated)
      fontWeight: 700,
      color: '#0f172a',
      textTransform: 'uppercase',
      dividerStyle: 'underline', // Visual divider style
      dividerColor: '#2563eb',
      dividerWidth: '2px',
      borderBottom: '2px solid #2563eb', // Legacy support
      borderColor: '#2563eb',
      borderWidth: '2px',
      padding: '0 0 4px 0',
      marginTop: '24px',
      marginBottom: '12px',
      letterSpacing: '0.05em',
      backgroundColor: undefined,
    },
    section: {
      marginBottom: '24px',
      titleColor: '#0f172a',
      titleBorderBottom: '1px solid #e2e8f0',
      titlePadding: '0 0 8px 0',
      titleTransform: 'none',
    },
    // Job/education titles (H3)
    jobTitle: {
      fontFamily: undefined, // Uses heading font by default
      fontSize: undefined,   // Uses h3 × baseFontSize (calculated)
      fontWeight: 600,
      color: '#0f172a',
      fontStyle: 'normal',
      marginBottom: '4px',
      textTransform: 'none',
    },
    // Organization/company names
    organizationName: {
      fontSize: undefined, // Uses body × baseFontSize (calculated)
      fontWeight: 500,
      color: '#475569',
      fontStyle: 'normal',
    },
    // Key-value pairs
    keyValue: {
      labelColor: '#0f172a',
      labelWeight: 600,
      valueColor: '#475569',
      valueWeight: 400,
      separator: ':',
      spacing: '4px',
    },
    // Emphasized text
    emphasis: {
      fontWeight: 600,
      color: '#0f172a',
    },
    tags: {
      colorPair: 'tertiary',      // Use tertiary color pair by default
      backgroundOpacity: 0.2,     // 20% opacity for background
      textOpacity: 1.0,           // 100% opacity for text
      backgroundColor: '#e0e7ff', // Legacy fallback: Indigo-100
      textColor: '#3730a3',       // Legacy fallback: Indigo-800
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: undefined,        // Uses tag × baseFontSize (calculated)
      gap: '8px',
      border: undefined,
      fontWeight: 500,
      style: 'pill',              // Default to pill style
      separator: '·',             // Default separator for inline style
    },
    dateLine: {
      color: '#64748b',
      fontStyle: 'italic',
      fontSize: undefined, // Uses dateLine × baseFontSize (calculated)
      fontWeight: 400,
      alignment: 'right',
      format: 'short', // Use 'short' format by default (MMM YYYY)
    },
    list: {
      level1: {
        bulletStyle: 'disc',
        customBullet: undefined,
        color: '#2563eb',
        indent: '20px',
      },
      level2: {
        bulletStyle: 'circle',
        customBullet: undefined,
        color: '#64748b',
        indent: '40px',
      },
      level3: {
        bulletStyle: 'square',
        customBullet: undefined,
        color: '#94a3b8',
        indent: '60px',
      },
      // Legacy support
      bulletStyle: 'disc',
      customBullet: undefined,
      indent: '20px',
      spacing: '8px',
      markerColor: '#2563eb',
    },
    links: {
      color: '#2563eb', // Primary blue for links
      hoverColor: '#1d4ed8', // Darker blue on hover
      underline: true, // Legacy support
      underlineStyle: 'always', // Show underline always
      fontWeight: 500,
      decoration: 'underline', // Legacy support
    },
    divider: {
      style: 'solid',
      color: '#e2e8f0',
      thickness: '1px',
      spacing: '16px',
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
