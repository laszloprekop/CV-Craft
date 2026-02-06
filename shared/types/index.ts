// Shared TypeScript interfaces for CV Craft application
// Used by both frontend and backend

export * from './defaultTemplateConfig';

export interface CVInstance {
  id: string;
  name: string;
  content: string;
  parsed_content?: ParsedCVContent;
  template_id: string;
  photo_asset_id?: string; // Reference to profile photo asset
  config?: TemplateConfig; // New comprehensive config
  settings: TemplateSettings; // Legacy support
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ParsedCVContent {
  frontmatter: CVFrontmatter;
  sections: CVSection[]; // Legacy - kept for backward compatibility
  html?: string; // NEW: Unified/Rehype generated HTML with embedded styles
  cssVariables?: Record<string, string>; // CSS variables for the template
}

export interface CVFrontmatter {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  [key: string]: any;
}

export interface CVSection {
  type: 'heading' | 'paragraph' | 'list' | 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications' | 'interests' | 'references' | 'summary';
  title?: string;
  content: string | CVListItem[] | CVExperienceItem[] | CVEducationItem[] | string[] | any[];
  level?: number; // for headings (1-6)
}

export interface CVListItem {
  text: string;
  items?: CVListItem[];
}

export interface CVExperienceItem {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
  highlights?: string[];
}

export interface CVEducationItem {
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
  honors?: string[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  css: string;
  config_schema: TemplateConfigSchema;
  default_config: TemplateConfig; // New comprehensive config
  default_settings: TemplateSettings; // Legacy support
  preview_image?: string;
  is_active: boolean;
  created_at: string;
  version: string;
}

export interface TemplateConfigSchema {
  type: 'object';
  properties: Record<string, TemplateSchemaProperty>;
  required?: string[];
}

export interface TemplateSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object';
  enum?: string[];
  default?: any;
  description?: string;
}

// Comprehensive template configuration
export interface TemplateConfig {
  // Color Palette
  colors: {
    primary: string;
    onPrimary: string; // Text color on primary background
    secondary: string;
    onSecondary: string; // Text color on secondary background
    tertiary: string; // Renamed from accent
    onTertiary: string; // Text color on tertiary background
    background: string;
    muted: string;
    onMuted: string; // Text color on muted background
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    borders: string;
    links: {
      default: string;
      hover: string;
    };
    // Custom color pairs (user-configurable, assignable in Styles)
    custom1: string;
    onCustom1: string;
    custom2: string;
    onCustom2: string;
    custom3: string;
    onCustom3: string;
    custom4: string;
    onCustom4: string;
    // Legacy support - will be migrated
    accent?: string; // Deprecated, use tertiary instead
    highlight?: string;
    error?: string;
    success?: string;
  };

  // Typography
  typography: {
    // Base font size - all other sizes are relative to this
    baseFontSize: string; // e.g., '10pt', '12px', '1rem'

    // Google Fonts Integration
    availableFonts?: string[]; // User-curated list of Google Fonts
    fontLoadingStrategy?: 'preload' | 'lazy';

    fontFamily: {
      heading: string;
      body: string;
      monospace: string;
    };

    // Font scale - multipliers relative to baseFontSize
    fontScale: {
      h1: number;         // e.g., 3.2 means 3.2 × baseFontSize (main name/title)
      h2: number;         // e.g., 2.4 means 2.4 × baseFontSize (section headers)
      h3: number;         // e.g., 2.0 means 2.0 × baseFontSize (job titles)
      body: number;       // e.g., 1.6 means 1.6 × baseFontSize (paragraphs)
      small: number;      // e.g., 1.4 means 1.4 × baseFontSize (metadata, contact)
      tiny: number;       // e.g., 1.2 means 1.2 × baseFontSize (dates, locations)
      tag?: number;       // e.g., 1.3 means 1.3 × baseFontSize (skill tags)
      dateLine?: number;  // e.g., 1.3 means 1.3 × baseFontSize (date ranges)
      inlineCode?: number;// e.g., 1.2 means 1.2 × baseFontSize (inline code)
    };

    // Legacy absolute sizes - kept for backward compatibility, will be migrated
    fontSize?: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      small: string;
      tiny: string;
    };

    fontWeight: {
      heading: number;
      subheading: number;
      body: number;
      bold: number;
    };
    lineHeight: {
      heading: number;
      body: number;
      compact: number;
    };
    letterSpacing?: {
      heading: string;
      body: string;
    };
  };

  // Layout & Spacing
  layout: {
    templateType?: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
    sidebarWidth?: string; // e.g., '35%', '300px'
    pageWidth: string;
    pageMargin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    sectionSpacing: string;
    paragraphSpacing: string;
    columns?: {
      enabled: boolean;
      gap: string;
      ratio?: string; // e.g., "1:2" for sidebar layouts
    };
  };

  // Component-Specific Styling
  components: {
    // Main name (H1)
    name: {
      fontFamily?: string; // Can override heading font
      fontSize?: string;
      fontWeight?: number;
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number; // 0-1
      color?: string; // Legacy support
      letterSpacing?: string;
      lineHeight?: number;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      alignment?: 'left' | 'center' | 'right';
      // Margin
      marginMode?: 'uniform' | 'individual';
      marginUniform?: string;
      marginTop?: string;
      marginRight?: string;
      marginBottom?: string;
      marginLeft?: string;
      // Padding
      paddingMode?: 'uniform' | 'individual';
      paddingUniform?: string;
      padding?: string; // Legacy - used as uniform value
      paddingTop?: string;
      paddingRight?: string;
      paddingBottom?: string;
      paddingLeft?: string;
      // Background
      backgroundColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      backgroundColorOpacity?: number;
      borderRadius?: string;
      // Border
      borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
      borderWidth?: string;
      borderColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      borderColorOpacity?: number;
      // Divider
      dividerStyle?: 'none' | 'underline' | 'full-width';
      dividerWidth?: string;
      dividerColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      dividerColorOpacity?: number;
      // Shadow
      shadow?: 'none' | 'sm' | 'md' | 'lg';
    };
    // Contact information bar
    contactInfo: {
      layout?: 'inline' | 'stacked' | 'grid';
      iconSize?: string;
      iconColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      iconColorOpacity?: number;
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      textColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      textColorOpacity?: number;
      iconColor?: string; // Legacy support
      textColor?: string; // Legacy support
      spacing?: string;
      fontSize?: string;
      fontWeight?: number;
      letterSpacing?: string;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      showIcons?: boolean;
      iconPosition?: 'left' | 'right';
      separator?: '·' | '|' | '•' | 'none'; // Separator between contact items
    };
    // Profile photo
    profilePhoto: {
      size?: string;
      borderRadius?: string;
      border?: string;
      borderWidth?: string;
      borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
      borderColor?: string;
      position?: 'left' | 'center' | 'right';
      // Margin
      marginMode?: 'uniform' | 'individual';
      marginUniform?: string;
      marginTop?: string;
      marginBottom?: string;
      marginLeft?: string;
      marginRight?: string;
      shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
      opacity?: number;
      filter?: 'none' | 'grayscale' | 'sepia';
    };
    header: {
      backgroundColor?: string;
      padding: string;
      borderBottom?: string;
      alignment: 'left' | 'center' | 'right';
      nameSize?: string;
      contactSize?: string;
    };
    // Section headers (H2)
    sectionHeader: {
      // Typography
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: number;
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      color?: string; // Legacy support
      letterSpacing?: string;
      lineHeight?: number;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      // Margin
      marginMode?: 'uniform' | 'individual';
      marginUniform?: string;
      marginTop?: string;
      marginRight?: string;
      marginBottom?: string;
      marginLeft?: string;
      // Padding
      paddingMode?: 'uniform' | 'individual';
      paddingUniform?: string;
      padding?: string; // Legacy - used as uniform value
      paddingTop?: string;
      paddingRight?: string;
      paddingBottom?: string;
      paddingLeft?: string;
      // Background
      backgroundColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      backgroundColorOpacity?: number;
      backgroundColor?: string; // Legacy support
      borderRadius?: string;
      // Border
      borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
      borderWidth?: string;
      borderColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      borderColorOpacity?: number;
      borderColor?: string; // Legacy support
      borderBottom?: string; // Legacy support
      // Divider
      dividerStyle?: 'none' | 'underline' | 'full-width' | 'accent-bar';
      dividerWidth?: string;
      dividerColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      dividerColorOpacity?: number;
      dividerColor?: string; // Legacy support
      // Shadow
      shadow?: 'none' | 'sm' | 'md' | 'lg';
    };
    section: {
      marginBottom: string;
      titleColor?: string;
      titleBorderBottom?: string;
      titlePadding?: string;
      titleTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    };
    // Job/education titles (H3)
    jobTitle: {
      // Typography
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: number;
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      color?: string; // Legacy support
      letterSpacing?: string;
      lineHeight?: number;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      // Margin
      marginMode?: 'uniform' | 'individual';
      marginUniform?: string;
      marginTop?: string;
      marginRight?: string;
      marginBottom?: string;
      marginLeft?: string;
      // Padding
      paddingMode?: 'uniform' | 'individual';
      paddingUniform?: string;
      padding?: string; // Legacy - used as uniform value
      paddingTop?: string;
      paddingRight?: string;
      paddingBottom?: string;
      paddingLeft?: string;
      // Background
      backgroundColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      backgroundColorOpacity?: number;
      borderRadius?: string;
      // Border
      borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
      borderWidth?: string;
      borderColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      borderColorOpacity?: number;
      // Divider
      dividerStyle?: 'none' | 'underline' | 'full-width';
      dividerWidth?: string;
      dividerColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      dividerColorOpacity?: number;
      // Shadow
      shadow?: 'none' | 'sm' | 'md' | 'lg';
    };
    // Organization/company names
    organizationName: {
      fontSize?: string;
      fontWeight?: number;
      color?: string;
      fontStyle?: 'normal' | 'italic';
    };
    // Key-value pairs (e.g., "Label: value")
    keyValue: {
      labelColor?: string;
      labelWeight?: number;
      valueColor?: string;
      valueWeight?: number;
      separator?: ':' | '-' | '•' | 'none';
      spacing?: string;
    };
    // Emphasized text (bold)
    emphasis: {
      fontWeight?: number;
      color?: string;
    };
    tags: {
      colorPair?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4'; // Which semantic color pair to use
      backgroundOpacity?: number; // 0-1, opacity for background color
      textOpacity?: number; // 0-1, opacity for text color
      textColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4' | 'on-tertiary';
      backgroundColor?: string; // Legacy: direct color (will be deprecated)
      textColor?: string; // Legacy: direct color (will be deprecated)
      borderRadius: string;
      padding: string;
      fontSize?: string; // Optional - falls back to calculated tag × baseFontSize
      gap: string;
      border?: string;
      fontWeight?: number;
      letterSpacing?: string;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      style?: 'pill' | 'inline'; // pill = rounded tags, inline = separated text
      separator?: '·' | '|' | '•' | ',' | 'none'; // separator for inline style
    };
    dateLine: {
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      color?: string; // Legacy support
      fontStyle: 'normal' | 'italic';
      fontSize?: string; // Optional - falls back to calculated dateLine × baseFontSize
      fontWeight?: number;
      letterSpacing?: string;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      alignment: 'left' | 'right';
      format?: 'full' | 'short' | 'year-only'; // date format preset
    };
    list: {
      level1?: {
        bulletStyle?: 'disc' | 'circle' | 'square' | 'none' | 'custom';
        customBullet?: string;
        color?: string;
        indent?: string;
      };
      level2?: {
        bulletStyle?: 'disc' | 'circle' | 'square' | 'none' | 'custom';
        customBullet?: string;
        color?: string;
        indent?: string;
      };
      level3?: {
        bulletStyle?: 'disc' | 'circle' | 'square' | 'none' | 'custom';
        customBullet?: string;
        color?: string;
        indent?: string;
      };
      // Legacy support
      bulletStyle?: 'disc' | 'circle' | 'square' | 'none' | 'custom';
      customBullet?: string;
      indent?: string;
      spacing: string;
      markerColor?: string;
    };
    links: {
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      hoverColorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      hoverColorOpacity?: number;
      color?: string; // Legacy support - Link color
      hoverColor?: string; // Legacy support - Hover state color
      underline: boolean; // Legacy support
      underlineStyle?: 'none' | 'always' | 'hover'; // When to show underline
      fontSize?: string;
      fontWeight?: number;
      letterSpacing?: string;
      textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      fontStyle?: 'normal' | 'italic';
      decoration?: 'none' | 'underline' | 'dotted' | 'dashed'; // Legacy support
    };
    divider: {
      style: 'solid' | 'dotted' | 'dashed' | 'double' | 'none';
      color?: string;
      thickness?: string;
      spacing?: string;
    };
  };

  // PDF-Specific
  pdf: {
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    printColorAdjust: boolean;
    pageNumbers: {
      enabled: boolean;
      position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      format?: string;
      fontSize?: string;
      fontWeight?: number;
      colorKey?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';
      colorOpacity?: number;
      margin?: string;
    };
  };

  // Advanced Options
  advanced?: {
    customCSS?: string;
    animations?: boolean;
    shadows?: boolean;
    iconSet?: 'phosphor' | 'lucide' | 'feather' | 'none';
  };
}

// Legacy support - kept for backward compatibility
export interface TemplateSettings {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  fontFamily: string;
  titleFontSize: number;
  bodyFontSize: number;
  useTagDesign: boolean;
  useUnderlinedLinks: boolean;
  separatorStyle: 'solid' | 'dotted' | 'dashed' | 'none';
  showPageNumbers: boolean;
  showDate: boolean;
  emojiStyle: 'emoji' | 'phosphor' | 'lucide' | 'none';
  pageMargins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  [key: string]: any;
}

export interface Asset {
  id: string;
  cv_id: string;
  filename: string;
  file_type: 'image' | 'document' | 'other';
  mime_type: string;
  file_size: number;
  storage_path: string;
  usage_context?: string;
  uploaded_at: string;
  metadata?: {
    width?: number;
    height?: number;
    alt_text?: string;
    [key: string]: any;
  };
}

export interface Export {
  id: string;
  cv_id: string;
  export_type: 'pdf' | 'web_package';
  filename: string;
  file_path: string;
  file_size?: number;
  settings_snapshot: TemplateSettings;
  generated_at: string;
  expires_at?: string;
  metadata?: {
    page_count?: number;
    assets_included?: string[];
    generation_time?: number;
    [key: string]: any;
  };
}

// API Request/Response types
export interface CreateCVRequest {
  name: string;
  content: string;
  template_id: string;
  settings?: Partial<TemplateSettings>;
}

export interface UpdateCVRequest {
  name?: string;
  content?: string;
  template_id?: string;
  settings?: Partial<TemplateSettings>;
  status?: 'active' | 'archived';
}

export interface DuplicateCVRequest {
  name: string;
}

export interface CreateExportRequest {
  export_type: 'pdf' | 'web_package';
  settings?: Partial<TemplateSettings>;
}

export interface PreviewRequest {
  mode?: 'web' | 'pdf';
  settings?: Partial<TemplateSettings>;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}

// Frontend-specific types
export interface CVEditorState {
  cv?: CVInstance;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved?: string;
  error?: string;
}

export interface TemplateState {
  templates: Template[];
  selectedTemplate?: Template;
  isLoading: boolean;
  error?: string;
}

export interface PreviewState {
  mode: 'web' | 'pdf';
  zoom: number;
  isGenerating: boolean;
  htmlContent?: string;
  error?: string;
}

export interface AssetState {
  assets: Asset[];
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

export interface ExportState {
  exports: Export[];
  isExporting: boolean;
  exportProgress: number;
  error?: string;
}

// UI Component prop types
export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface CVPreviewProps {
  content: string;
  template: Template;
  settings: TemplateSettings;
  mode: 'web' | 'pdf';
  zoom: number;
  assets?: Asset[];
}

export interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
}

export interface TemplateSettingsProps {
  template: Template;
  settings: TemplateSettings;
  onChange: (settings: TemplateSettings) => void;
}

export interface AssetUploaderProps {
  cvId: string;
  onUpload: (asset: Asset) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    primary: string;
    mono: string;
  };
  sizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}