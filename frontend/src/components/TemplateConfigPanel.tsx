import React, { useState, useRef, useEffect } from 'react';
import {
  IconPalette,
  IconTypography,
  IconFile,
  IconSettings,
  IconColorSwatch,
  IconBorderAll,
  IconDimensions,
  IconLayout,
  IconBoxMargin,
  IconFileExport,
  IconTextCaption,
  IconCode,
  IconAdjustments,
} from '@tabler/icons-react';
import type { TemplateConfig } from '../../../shared/types';
import {
  ColorControl,
  SelectControl,
  SpacingControl,
  ToggleControl,
  NumberControl,
  BoxModelControl,
  FontSelector,
  FontManager,
  TextStyleControl,
  LayoutPicker,
  MultiLevelBulletPicker,
  ColorPairControl,
  CollapsibleSection,
  SemanticColorControl,
  SemanticElementEditor,
} from './controls';

interface TemplateConfigPanelProps {
  config: TemplateConfig;
  onChange: (config: Partial<TemplateConfig>) => void;
  onChangeComplete?: (config: Partial<TemplateConfig>) => void; // Called after user finishes editing
}

type TabType = 'colors' | 'styles' | 'page' | 'advanced';

export const TemplateConfigPanel: React.FC<TemplateConfigPanelProps> = ({
  config,
  onChange,
  onChangeComplete,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChangesRef = useRef<Partial<TemplateConfig> | null>(null);
  const onChangeCompleteRef = useRef(onChangeComplete);

  // Keep ref up to date
  useEffect(() => {
    onChangeCompleteRef.current = onChangeComplete;
  }, [onChangeComplete]);

  // Log when panel initializes with config
  useEffect(() => {
    console.log('[TemplateConfigPanel] 🎨 Opened:', {
      'accent': config.colors.accent,
      'baseFontSize': config.typography.baseFontSize,
    })
  }, [])

  // Cleanup debounce timer on unmount - ONLY RUN ONCE
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Save any pending changes before unmounting
      if (pendingChangesRef.current && onChangeCompleteRef.current) {
        console.log('[TemplateConfigPanel] 🚪 Unmounting - saving pending changes');
        onChangeCompleteRef.current(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'colors', label: 'Colors', icon: <IconPalette size={16} /> },
    { id: 'styles', label: 'Styles', icon: <IconTypography size={16} /> },
    { id: 'page', label: 'Page', icon: <IconFile size={16} /> },
    { id: 'advanced', label: 'Etc.', icon: <IconSettings size={16} /> },
  ];

  // Helper to update nested config (live preview) with debounced save
  const updateConfig = <K extends keyof TemplateConfig>(
    section: K,
    value: Partial<TemplateConfig[K]>
  ) => {
    const update = {
      [section]: {
        ...config[section],
        ...value,
      },
    } as Partial<TemplateConfig>;

    // Immediate live preview update
    onChange(update);

    // Accumulate changes for debounced save
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      ...update,
    };

    // Debounced database save (1 second after last change)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (pendingChangesRef.current && onChangeCompleteRef.current) {
        console.log('[TemplateConfigPanel] 💾 Auto-saving changes after 1s delay');
        onChangeCompleteRef.current(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    }, 1000); // 1 second debounce
  };

  // Helper to commit config changes (save to database)
  const commitConfig = <K extends keyof TemplateConfig>(
    section: K,
    value: Partial<TemplateConfig[K]>
  ) => {
    if (onChangeComplete) {
      onChangeComplete({
        [section]: {
          ...config[section],
          ...value,
        },
      } as Partial<TemplateConfig>);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[280px] bg-background border-l border-border overflow-hidden z-50 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'colors' && (
          <div className="space-y-0">
            <CollapsibleSection id="colors-main" label="Main Colors" defaultOpen={true} icon={<IconColorSwatch size={14} />}>
              {/* Primary & On Primary */}
              <div className="grid grid-cols-2 gap-1">
                <ColorControl
                  label="Primary"
                  value={config.colors.primary}
                  onChange={(value) => updateConfig('colors', { primary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { primary: value })}
                />
                <ColorControl
                  label="On Primary"
                  value={config.colors.onPrimary}
                  onChange={(value) => updateConfig('colors', { onPrimary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { onPrimary: value })}
                />
              </div>

              {/* Secondary & On Secondary */}
              <div className="grid grid-cols-2 gap-1">
                <ColorControl
                  label="Secondary"
                  value={config.colors.secondary}
                  onChange={(value) => updateConfig('colors', { secondary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { secondary: value })}
                />
                <ColorControl
                  label="On Secondary"
                  value={config.colors.onSecondary}
                  onChange={(value) => updateConfig('colors', { onSecondary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { onSecondary: value })}
                />
              </div>

              {/* Tertiary & On Tertiary */}
              <div className="grid grid-cols-2 gap-1">
                <ColorControl
                  label="Tertiary"
                  value={config.colors.tertiary}
                  onChange={(value) => updateConfig('colors', { tertiary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { tertiary: value })}
                />
                <ColorControl
                  label="On Tertiary"
                  value={config.colors.onTertiary}
                  onChange={(value) => updateConfig('colors', { onTertiary: value })}
                  onChangeComplete={(value) => commitConfig('colors', { onTertiary: value })}
                />
              </div>

              {/* Muted & On Muted */}
              <div className="grid grid-cols-2 gap-1">
                <ColorControl
                  label="Muted"
                  value={config.colors.muted}
                  onChange={(value) => updateConfig('colors', { muted: value })}
                  onChangeComplete={(value) => commitConfig('colors', { muted: value })}
                />
                <ColorControl
                  label="On Muted"
                  value={config.colors.onMuted}
                  onChange={(value) => updateConfig('colors', { onMuted: value })}
                  onChangeComplete={(value) => commitConfig('colors', { onMuted: value })}
                />
              </div>

              {/* Background & On Background */}
              <div className="grid grid-cols-2 gap-1 mb-2">
                <ColorControl
                  label="Background"
                  value={config.colors.background}
                  onChange={(value) => updateConfig('colors', { background: value })}
                  onChangeComplete={(value) => commitConfig('colors', { background: value })}
                />
                <ColorControl
                  label="On Background"
                  value={config.colors.text.primary}
                  onChange={(value) =>
                    updateConfig('colors', {
                      text: { ...config.colors.text, primary: value },
                    })
                  }
                  onChangeComplete={(value) =>
                    commitConfig('colors', {
                      text: { ...config.colors.text, primary: value },
                    })
                  }
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="colors-borders" label="Border & Links" defaultOpen={true} icon={<IconBorderAll size={14} />}>
              <ColorControl
                label="Borders"
                value={config.colors.borders}
                onChange={(value) => updateConfig('colors', { borders: value })}
                onChangeComplete={(value) => commitConfig('colors', { borders: value })}
              />
              <ColorControl
                label="Link (Default)"
                value={config.colors.links.default}
                onChange={(value) =>
                  updateConfig('colors', {
                    links: { ...config.colors.links, default: value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('colors', {
                    links: { ...config.colors.links, default: value },
                  })
                }
              />
              <ColorControl
                label="Link (Hover)"
                value={config.colors.links.hover}
                onChange={(value) =>
                  updateConfig('colors', {
                    links: { ...config.colors.links, hover: value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('colors', {
                    links: { ...config.colors.links, hover: value },
                  })
                }
              />
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'styles' && (
          <SemanticElementEditor
            config={config}
            onChange={updateConfig}
            onCommit={commitConfig}
          />
        )}

        {activeTab === 'page' && (
          <div className="space-y-0">
            <CollapsibleSection id="page-size" label="Page Size" defaultOpen={true} icon={<IconDimensions size={14} />}>
              <div className="grid grid-cols-2 gap-1 mb-2">
                <SelectControl
                  label="Size"
                  value={config.pdf.pageSize}
                  onChange={(value) =>
                    updateConfig('pdf', { pageSize: value as any })
                  }
                  options={[
                    { value: 'A4', label: 'A4' },
                    { value: 'Letter', label: 'Letter' },
                    { value: 'Legal', label: 'Legal' },
                  ]}
                />
                <SelectControl
                  label="Orientation"
                  value={config.pdf.orientation}
                  onChange={(value) =>
                    updateConfig('pdf', { orientation: value as any })
                  }
                  options={[
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                  ]}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="page-layout" label="Page Layout" defaultOpen={true} icon={<IconLayout size={14} />}>
              <LayoutPicker
                value={config.layout.templateType || 'two-column'}
                onChange={(value) => updateConfig('layout', { templateType: value })}
              />

              {/* Sidebar Width (for two-column layouts) */}
              {(config.layout.templateType === 'two-column' || config.layout.templateType === 'sidebar-left' || config.layout.templateType === 'sidebar-right') && (
                <SpacingControl
                  label="Sidebar Width"
                  value={config.layout.sidebarWidth || '84mm'}
                  onChange={(value) => updateConfig('layout', { sidebarWidth: value })}
                  units={['mm', '%', 'px']}
                  description="Width of the sidebar column"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection id="page-margins" label="Page Margins" defaultOpen={false} icon={<IconBoxMargin size={14} />}>
              <BoxModelControl
                label="Margins"
                value={config.layout.pageMargin}
                onChange={(value) =>
                  updateConfig('layout', { pageMargin: value })
                }
                type="margin"
              />
            </CollapsibleSection>

            <CollapsibleSection id="pdf-export" label="PDF Export" defaultOpen={false} icon={<IconFileExport size={14} />}>
              <ToggleControl
                label="Print Color Adjust"
                value={config.pdf.printColorAdjust}
                onChange={(value) =>
                  updateConfig('pdf', { printColorAdjust: value })
                }
                description="Preserve colors when printing"
              />
              <ToggleControl
                label="Show Page Numbers"
                value={config.pdf.pageNumbers.enabled}
                onChange={(value) =>
                  updateConfig('pdf', {
                    pageNumbers: { ...config.pdf.pageNumbers, enabled: value },
                  })
                }
                description="Style in Styles → Page #"
              />
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-0">
            <CollapsibleSection id="etc-font-library" label="Font Library" defaultOpen={false} icon={<IconTypography size={14} />}>
              <p className="text-[10px] text-text-secondary mb-3">
                Add Google Fonts to your library. Only fonts you add will appear in font selectors.
              </p>

              <FontManager
                availableFonts={config.typography.availableFonts || []}
                onAdd={(fontFamily) => {
                  const currentFonts = config.typography.availableFonts || [];
                  updateConfig('typography', {
                    availableFonts: [...currentFonts, fontFamily],
                  });
                }}
                onRemove={(fontFamily) => {
                  const currentFonts = config.typography.availableFonts || [];
                  updateConfig('typography', {
                    availableFonts: currentFonts.filter(f => f !== fontFamily),
                  });
                }}
              />

              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-2 mt-4">
                <IconTextCaption size={14} />
                Active Fonts
              </h4>
              <FontSelector
                label="Heading Font"
                value={config.typography.fontFamily.heading}
                onChange={(value) =>
                  updateConfig('typography', {
                    fontFamily: { ...config.typography.fontFamily, heading: value },
                  })
                }
                fontType="heading"
                description="Font used for headings and titles"
                availableFonts={config.typography.availableFonts}
              />
              <FontSelector
                label="Body Font"
                value={config.typography.fontFamily.body}
                onChange={(value) =>
                  updateConfig('typography', {
                    fontFamily: { ...config.typography.fontFamily, body: value },
                  })
                }
                fontType="body"
                description="Font used for body text and descriptions"
                availableFonts={config.typography.availableFonts}
              />
              <FontSelector
                label="Monospace Font"
                value={config.typography.fontFamily.monospace}
                onChange={(value) =>
                  updateConfig('typography', {
                    fontFamily: { ...config.typography.fontFamily, monospace: value },
                  })
                }
                fontType="monospace"
                description="Font used for code and technical content"
                availableFonts={config.typography.availableFonts}
              />
            </CollapsibleSection>

            <CollapsibleSection id="etc-preferences" label="Preferences" defaultOpen={true} icon={<IconAdjustments size={14} />}>
              <SelectControl
                label="Icon Set"
                value={config.advanced?.iconSet || 'phosphor'}
                onChange={(value) =>
                  updateConfig('advanced', {
                    ...config.advanced,
                    iconSet: value as any,
                  })
                }
                options={[
                  { value: 'phosphor', label: 'Phosphor Icons' },
                  { value: 'lucide', label: 'Lucide Icons' },
                  { value: 'feather', label: 'Feather Icons' },
                  { value: 'none', label: 'None' },
                ]}
              />
              <ToggleControl
                label="Enable Animations"
                value={config.advanced?.animations || false}
                onChange={(value) =>
                  updateConfig('advanced', {
                    ...config.advanced,
                    animations: value,
                  })
                }
                description="Add subtle animations to the CV"
              />
              <ToggleControl
                label="Enable Shadows"
                value={config.advanced?.shadows || false}
                onChange={(value) =>
                  updateConfig('advanced', {
                    ...config.advanced,
                    shadows: value,
                  })
                }
                description="Add shadow effects to elements"
              />
            </CollapsibleSection>

            <CollapsibleSection id="etc-custom-css" label="Custom CSS" defaultOpen={false} icon={<IconCode size={14} />}>
              <p className="text-[10px] text-text-secondary mb-2">
                Add custom CSS rules (use with caution)
              </p>
              <textarea
                value={config.advanced?.customCSS || ''}
                onChange={(e) =>
                  updateConfig('advanced', {
                    ...config.advanced,
                    customCSS: e.target.value,
                  })
                }
                rows={8}
                className="w-full px-3 py-2 text-sm font-mono border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary mb-2"
                placeholder="/* Add custom CSS here */"
              />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
};
