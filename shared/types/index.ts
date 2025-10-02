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
  sections: CVSection[];
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
  type: 'heading' | 'paragraph' | 'list' | 'experience' | 'education' | 'skills' | 'projects';
  title?: string;
  content: string | CVListItem[] | CVExperienceItem[] | CVEducationItem[] | string[];
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
    secondary: string;
    accent: string;
    background: string;
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
    highlight?: string;
    error?: string;
    success?: string;
  };

  // Typography
  typography: {
    // Base font size - all other sizes are relative to this
    baseFontSize: string; // e.g., '10pt', '12px', '1rem'

    fontFamily: {
      heading: string;
      body: string;
      monospace: string;
    };

    // Font scale - multipliers relative to baseFontSize
    fontScale: {
      h1: number;      // e.g., 3.2 means 3.2 × baseFontSize
      h2: number;      // e.g., 2.4 means 2.4 × baseFontSize
      h3: number;      // e.g., 2.0 means 2.0 × baseFontSize
      body: number;    // e.g., 1.6 means 1.6 × baseFontSize
      small: number;   // e.g., 1.4 means 1.4 × baseFontSize
      tiny: number;    // e.g., 1.2 means 1.2 × baseFontSize
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
    header: {
      backgroundColor?: string;
      padding: string;
      borderBottom?: string;
      alignment: 'left' | 'center' | 'right';
      nameSize?: string;
      contactSize?: string;
    };
    section: {
      marginBottom: string;
      titleColor?: string;
      titleBorderBottom?: string;
      titlePadding?: string;
      titleTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    };
    tags: {
      backgroundColor: string;
      textColor: string;
      borderRadius: string;
      padding: string;
      fontSize: string;
      gap: string;
      border?: string;
      fontWeight?: number;
      style?: 'pill' | 'inline'; // pill = rounded tags, inline = separated text
      separator?: '·' | '|' | '•' | ',' | 'none'; // separator for inline style
    };
    dateLine: {
      color: string;
      fontStyle: 'normal' | 'italic';
      fontSize: string;
      fontWeight?: number;
      alignment: 'left' | 'right';
      format?: string; // date format string
    };
    list: {
      bulletStyle: 'disc' | 'circle' | 'square' | 'none' | 'custom';
      customBullet?: string;
      indent: string;
      spacing: string;
      markerColor?: string;
    };
    links: {
      underline: boolean;
      fontWeight?: number;
      decoration?: 'none' | 'underline' | 'dotted' | 'dashed';
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