export interface CVInstance {
    id: string;
    name: string;
    content: string;
    parsed_content?: ParsedCVContent;
    template_id: string;
    settings: TemplateSettings;
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
    level?: number;
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
    default_settings: TemplateSettings;
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
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
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
//# sourceMappingURL=index.d.ts.map