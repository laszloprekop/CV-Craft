-- Initial data for CV Craft database
-- Insert default template (separate from schema)

INSERT INTO templates (
    id,
    name,
    description,
    css,
    config_schema,
    default_config,
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
    '{"colors":{"primary":"#2563eb","secondary":"#64748b","accent":"#f59e0b","background":"#ffffff","text":{"primary":"#0f172a","secondary":"#475569","muted":"#94a3b8"},"borders":"#e2e8f0","links":{"default":"#2563eb","hover":"#1d4ed8"},"highlight":"#fef3c7","error":"#dc2626","success":"#16a34a"},"typography":{"fontFamily":{"heading":"Inter, system-ui, -apple-system, sans-serif","body":"Georgia, \"Times New Roman\", serif","monospace":"\"Fira Code\", \"Courier New\", monospace"},"fontSize":{"h1":"32px","h2":"24px","h3":"20px","body":"16px","small":"14px","tiny":"12px"},"fontWeight":{"heading":700,"subheading":600,"body":400,"bold":600},"lineHeight":{"heading":1.2,"body":1.6,"compact":1.4},"letterSpacing":{"heading":"-0.02em","body":"0"}},"layout":{"pageWidth":"210mm","pageMargin":{"top":"20mm","right":"20mm","bottom":"20mm","left":"20mm"},"sectionSpacing":"24px","paragraphSpacing":"12px","columns":{"enabled":false,"gap":"24px","ratio":"1:1"}},"components":{"header":{"padding":"0 0 16px 0","borderBottom":"2px solid #e2e8f0","alignment":"left","nameSize":"36px","contactSize":"14px"},"section":{"marginBottom":"24px","titleColor":"#0f172a","titleBorderBottom":"1px solid #e2e8f0","titlePadding":"0 0 8px 0","titleTransform":"none"},"tags":{"backgroundColor":"#e0e7ff","textColor":"#3730a3","borderRadius":"4px","padding":"4px 8px","fontSize":"14px","gap":"8px","fontWeight":500},"dateLine":{"color":"#64748b","fontStyle":"italic","fontSize":"14px","fontWeight":400,"alignment":"right","format":"MMM YYYY"},"list":{"bulletStyle":"disc","indent":"20px","spacing":"8px","markerColor":"#2563eb"},"links":{"underline":true,"fontWeight":500,"decoration":"underline"},"divider":{"style":"solid","color":"#e2e8f0","thickness":"1px","spacing":"16px"}},"pdf":{"pageSize":"A4","orientation":"portrait","printColorAdjust":true,"pageNumbers":{"enabled":false,"position":"bottom-center","format":"Page {page} of {total}"}},"advanced":{"customCSS":"","animations":false,"shadows":false,"iconSet":"phosphor"}}',
    '{"primaryColor": "#2563eb", "accentColor": "#059669", "backgroundColor": "#ffffff", "surfaceColor": "#ffffff", "fontFamily": "Inter", "titleFontSize": 24, "bodyFontSize": 14, "useTagDesign": true, "useUnderlinedLinks": false, "separatorStyle": "solid", "showPageNumbers": true, "showDate": true, "emojiStyle": "none", "pageMargins": {"top": "2cm", "bottom": "2cm", "left": "2cm", "right": "2cm"}}',
    1,
    strftime('%s', 'now'),
    '1.0.0'
);