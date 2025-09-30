-- Initial data for CV Craft database
-- Insert default template (separate from schema)

INSERT INTO templates (
    id, 
    name, 
    description, 
    css, 
    config_schema, 
    default_settings, 
    is_active, 
    created_at, 
    version
) VALUES (
    'default-modern',
    'Modern Professional',
    'A clean, modern template with professional styling suitable for most industries.',
    '.cv-container { font-family: var(--font-family, "Inter", system-ui, sans-serif); font-size: var(--body-font-size, 14px); line-height: 1.6; color: var(--text-color, #1f2937); background: var(--surface-color, #ffffff); max-width: 210mm; margin: 0 auto; padding: var(--page-margin-top, 2cm) var(--page-margin-right, 2cm) var(--page-margin-bottom, 2cm) var(--page-margin-left, 2cm); } .cv-header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid var(--primary-color, #2563eb); padding-bottom: 1.5rem; } .cv-header h1 { font-size: var(--title-font-size, 24px); color: var(--primary-color, #2563eb); margin: 0 0 0.5rem 0; font-weight: 700; } .cv-contact { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; font-size: 0.9em; color: var(--text-secondary, #6b7280); } .cv-section { margin-bottom: 2rem; } .cv-section h2 { font-size: var(--section-font-size, 18px); color: var(--primary-color, #2563eb); margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: var(--separator-style, solid) 1px var(--accent-color, #e5e7eb); }',
    '{"type": "object", "properties": {"primaryColor": {"type": "string", "default": "#2563eb"}, "accentColor": {"type": "string", "default": "#059669"}, "backgroundColor": {"type": "string", "default": "#ffffff"}, "surfaceColor": {"type": "string", "default": "#ffffff"}, "fontFamily": {"type": "string", "enum": ["Inter", "Roboto", "Georgia", "Times New Roman", "Arial"], "default": "Inter"}, "titleFontSize": {"type": "number", "default": 24}, "bodyFontSize": {"type": "number", "default": 14}}}',
    '{"primaryColor": "#2563eb", "accentColor": "#059669", "backgroundColor": "#ffffff", "surfaceColor": "#ffffff", "fontFamily": "Inter", "titleFontSize": 24, "bodyFontSize": 14, "useTagDesign": true, "useUnderlinedLinks": false, "separatorStyle": "solid", "showPageNumbers": true, "showDate": true, "emojiStyle": "none", "pageMargins": {"top": "2cm", "bottom": "2cm", "left": "2cm", "right": "2cm"}}',
    1,
    strftime('%s', 'now'),
    '1.0.0'
);