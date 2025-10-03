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
    // Legacy support
    accent: '#f59e0b',        // Deprecated, use tertiary
    highlight: '#fef3c7',     // Amber-100
    error: '#dc2626',         // Red-600
    success: '#16a34a',       // Green-600
  },

  typography: {
    fontFamily: {
      heading: 'Inter, system-ui, -apple-system, sans-serif',
      body: 'Georgia, "Times New Roman", serif',
      monospace: '"Fira Code", "Courier New", monospace',
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
    header: {
      backgroundColor: undefined,
      padding: '0 0 16px 0',
      borderBottom: '2px solid #e2e8f0',
      alignment: 'left',
      nameSize: '36px',
      contactSize: '14px',
    },
    section: {
      marginBottom: '24px',
      titleColor: '#0f172a',
      titleBorderBottom: '1px solid #e2e8f0',
      titlePadding: '0 0 8px 0',
      titleTransform: 'none',
    },
    tags: {
      backgroundColor: '#e0e7ff', // Indigo-100
      textColor: '#3730a3',       // Indigo-800
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '14px',
      gap: '8px',
      border: undefined,
      fontWeight: 500,
      style: 'pill',              // Default to pill style
      separator: '·',             // Default separator for inline style
    },
    dateLine: {
      color: '#64748b',
      fontStyle: 'italic',
      fontSize: '14px',
      fontWeight: 400,
      alignment: 'right',
      format: 'MMM YYYY',
    },
    list: {
      bulletStyle: 'disc',
      customBullet: undefined,
      indent: '20px',
      spacing: '8px',
      markerColor: '#2563eb',
    },
    links: {
      underline: true,
      fontWeight: 500,
      decoration: 'underline',
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
