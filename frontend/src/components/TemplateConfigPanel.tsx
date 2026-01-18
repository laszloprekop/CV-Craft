import React, { useState, useRef, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
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
  onClose: () => void;
}

type TabType = 'colors' | 'styles' | 'layout' | 'pdf' | 'advanced';

export const TemplateConfigPanel: React.FC<TemplateConfigPanelProps> = ({
  config,
  onChange,
  onChangeComplete,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'colors', label: 'Colors' },
    { id: 'styles', label: 'Styles' },
    { id: 'layout', label: 'Layout' },
    { id: 'pdf', label: 'PDF' },
    { id: 'advanced', label: 'Advanced' },
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
      {/* Header */}
      <div className="px-2 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Template Config</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer p-1 hover:bg-surface rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'colors' && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-1.5">Main Colors</h4>

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
            <div className="grid grid-cols-2 gap-1">
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

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Border & Links</h4>
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
          </div>
        )}

        {activeTab === 'styles' && (
          <SemanticElementEditor
            config={config}
            onChange={updateConfig}
            onCommit={commitConfig}
          />
        )}

        {activeTab === 'layout' && (
          <div>
            {/* Layout Template Picker */}
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
                description="Width of the sidebar column in two-column layouts"
              />
            )}

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Page Dimensions</h4>
            <SpacingControl
              label="Page Width"
              value={config.layout.pageWidth}
              onChange={(value) =>
                updateConfig('layout', { pageWidth: value })
              }
              units={['mm', 'px', 'rem']}
            />

            <BoxModelControl
              label="Page Margins"
              value={config.layout.pageMargin}
              onChange={(value) =>
                updateConfig('layout', { pageMargin: value })
              }
              type="margin"
            />

            <SpacingControl
              label="Section Spacing"
              value={config.layout.sectionSpacing}
              onChange={(value) =>
                updateConfig('layout', { sectionSpacing: value })
              }
            />

            <SpacingControl
              label="Paragraph Spacing"
              value={config.layout.paragraphSpacing}
              onChange={(value) =>
                updateConfig('layout', { paragraphSpacing: value })
              }
            />
          </div>
        )}


        {activeTab === 'pdf' && (
          <div>
            <SelectControl
              label="Page Size"
              value={config.pdf.pageSize}
              onChange={(value) =>
                updateConfig('pdf', { pageSize: value as any })
              }
              options={[
                { value: 'A4', label: 'A4 (210 x 297 mm)' },
                { value: 'Letter', label: 'Letter (8.5 x 11 in)' },
                { value: 'Legal', label: 'Legal (8.5 x 14 in)' },
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
            <ToggleControl
              label="Print Color Adjust"
              value={config.pdf.printColorAdjust}
              onChange={(value) =>
                updateConfig('pdf', { printColorAdjust: value })
              }
              description="Preserve colors when printing"
            />

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Page Numbers</h4>
            <ToggleControl
              label="Show Page Numbers"
              value={config.pdf.pageNumbers.enabled}
              onChange={(value) =>
                updateConfig('pdf', {
                  pageNumbers: { ...config.pdf.pageNumbers, enabled: value },
                })
              }
              description="Appears in PDF export only"
            />
            {config.pdf.pageNumbers.enabled && (
              <SelectControl
                label="Position"
                value={config.pdf.pageNumbers.position}
                onChange={(value) =>
                  updateConfig('pdf', {
                    pageNumbers: { ...config.pdf.pageNumbers, position: value as any },
                  })
                }
                options={[
                  { value: 'top-left', label: 'Top Left' },
                  { value: 'top-center', label: 'Top Center' },
                  { value: 'top-right', label: 'Top Right' },
                  { value: 'bottom-left', label: 'Bottom Left' },
                  { value: 'bottom-center', label: 'Bottom Center' },
                  { value: 'bottom-right', label: 'Bottom Right' },
                ]}
              />
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div>
            {/* Font Library moved from Fonts tab */}
            <CollapsibleSection id="advanced-font-library" label="Font Library" defaultOpen={false}>
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

              <h4 className="text-xs font-semibold text-text-primary mb-2 mt-4">Active Fonts</h4>
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Custom CSS
              </label>
              <p className="text-xs text-text-secondary mb-2">
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
                className="w-full px-3 py-2 text-sm font-mono border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
                placeholder="/* Add custom CSS here */"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
