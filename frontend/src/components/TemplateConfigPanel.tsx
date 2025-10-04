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
} from './controls';

interface TemplateConfigPanelProps {
  config: TemplateConfig;
  onChange: (config: Partial<TemplateConfig>) => void;
  onChangeComplete?: (config: Partial<TemplateConfig>) => void; // Called after user finishes editing
  onClose: () => void;
}

type TabType = 'fonts' | 'colors' | 'typography' | 'layout' | 'components' | 'pdf' | 'advanced';

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
    { id: 'fonts', label: 'Fonts' },
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'layout', label: 'Layout' },
    { id: 'components', label: 'Components' },
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
        {activeTab === 'fonts' && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">Font Library</h4>
            <p className="text-[10px] text-text-secondary mb-3">
              Add Google Fonts to your library. Only fonts you add will appear in font selectors throughout the app.
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
          </div>
        )}

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

        {activeTab === 'typography' && (
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-1.5">Font Families</h4>
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
            />

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Font Sizes</h4>
            <SpacingControl
              label="Base Font Size"
              value={config.typography.baseFontSize}
              onChange={(value) =>
                updateConfig('typography', { baseFontSize: value })
              }
              units={['pt', 'px', 'rem']}
              description="Base size - all other sizes scale relative to this"
            />

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-2">Font Scale (relative to base)</h4>
            {config.typography.fontScale && (
              <>
                <NumberControl
                  label="H1 Scale"
                  value={config.typography.fontScale.h1}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, h1: value },
                    })
                  }
                  min={1}
                  max={5}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.h1).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
                <NumberControl
                  label="H2 Scale"
                  value={config.typography.fontScale.h2}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, h2: value },
                    })
                  }
                  min={1}
                  max={4}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.h2).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
                <NumberControl
                  label="H3 Scale"
                  value={config.typography.fontScale.h3}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, h3: value },
                    })
                  }
                  min={1}
                  max={3}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.h3).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
                <NumberControl
                  label="Body Scale"
                  value={config.typography.fontScale.body}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, body: value },
                    })
                  }
                  min={0.8}
                  max={2}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.body).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
                <NumberControl
                  label="Small Scale"
                  value={config.typography.fontScale.small}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, small: value },
                    })
                  }
                  min={0.6}
                  max={1.5}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.small).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
                <NumberControl
                  label="Tiny Scale"
                  value={config.typography.fontScale.tiny}
                  onChange={(value) =>
                    updateConfig('typography', {
                      fontScale: { ...config.typography.fontScale, tiny: value },
                    })
                  }
                  min={0.5}
                  max={1.2}
                  step={0.1}
                  description={`${(parseFloat(config.typography.baseFontSize) * config.typography.fontScale.tiny).toFixed(1)}${config.typography.baseFontSize.replace(/[0-9.]/g, '')}`}
                />
              </>
            )}

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Font Weights</h4>
            <NumberControl
              label="Heading Weight"
              value={config.typography.fontWeight.heading}
              onChange={(value) =>
                updateConfig('typography', {
                  fontWeight: { ...config.typography.fontWeight, heading: value },
                })
              }
              min={100}
              max={900}
              step={100}
            />
            <NumberControl
              label="Body Weight"
              value={config.typography.fontWeight.body}
              onChange={(value) =>
                updateConfig('typography', {
                  fontWeight: { ...config.typography.fontWeight, body: value },
                })
              }
              min={100}
              max={900}
              step={100}
            />

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Line Height</h4>
            <NumberControl
              label="Heading Line Height"
              value={config.typography.lineHeight.heading}
              onChange={(value) =>
                updateConfig('typography', {
                  lineHeight: { ...config.typography.lineHeight, heading: value },
                })
              }
              min={1}
              max={3}
              step={0.1}
            />
            <NumberControl
              label="Body Line Height"
              value={config.typography.lineHeight.body}
              onChange={(value) =>
                updateConfig('typography', {
                  lineHeight: { ...config.typography.lineHeight, body: value },
                })
              }
              min={1}
              max={3}
              step={0.1}
            />
          </div>
        )}

        {activeTab === 'layout' && (
          <div>
            {/* Layout Template Picker */}
            <LayoutPicker
              value={config.layout.templateType || 'two-column'}
              onChange={(value) => updateConfig('layout', { templateType: value })}
            />

            {/* Sidebar Width (for sidebar layouts) */}
            {(config.layout.templateType === 'sidebar-left' || config.layout.templateType === 'sidebar-right') && (
              <SpacingControl
                label="Sidebar Width"
                value={config.layout.sidebarWidth || '35%'}
                onChange={(value) => updateConfig('layout', { sidebarWidth: value })}
                units={['%', 'px', 'rem']}
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

            <h4 className="text-xs font-semibold text-text-primary mb-1.5 mt-3">Columns</h4>
            <ToggleControl
              label="Enable Columns"
              value={config.layout.columns?.enabled || false}
              onChange={(value) =>
                updateConfig('layout', {
                  columns: { ...config.layout.columns, enabled: value } as any,
                })
              }
            />
            {config.layout.columns?.enabled && (
              <>
                <SpacingControl
                  label="Column Gap"
                  value={config.layout.columns.gap || '24px'}
                  onChange={(value) =>
                    updateConfig('layout', {
                      columns: { ...config.layout.columns, gap: value } as any,
                    })
                  }
                />
                <SelectControl
                  label="Column Ratio"
                  value={config.layout.columns.ratio || '1:1'}
                  onChange={(value) =>
                    updateConfig('layout', {
                      columns: { ...config.layout.columns, ratio: value } as any,
                    })
                  }
                  options={[
                    { value: '1:1', label: '1:1 (Equal)' },
                    { value: '1:2', label: '1:2 (Sidebar Left)' },
                    { value: '2:1', label: '2:1 (Sidebar Right)' },
                    { value: '1:3', label: '1:3 (Narrow Left)' },
                    { value: '3:1', label: '3:1 (Narrow Right)' },
                  ]}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'components' && (
          <div>
            {/* Name (H1) */}
            <CollapsibleSection id="components-name" label="Name (H1)" defaultOpen={true}>
              <TextStyleControl
                label="Name Styling"
                value={{
                  fontSize: config.components.name?.fontSize || '32px',
                  fontWeight: config.components.name?.fontWeight || config.typography.fontWeight.heading,
                  color: config.components.name?.color || config.colors.text.primary,
                  letterSpacing: config.components.name?.letterSpacing || '0px',
                  textTransform: config.components.name?.textTransform || 'none',
                }}
                onChange={(value) =>
                  updateConfig('components', {
                    name: { ...config.components.name, ...value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('components', {
                    name: { ...config.components.name, ...value },
                  })
                }
                showLetterSpacing={true}
                showAlignment={true}
              />
            </CollapsibleSection>

            {/* Section Headers (H2) */}
            <CollapsibleSection id="components-section-headers" label="Section Headers (H2)" defaultOpen={true}>
              <TextStyleControl
                label="Section Header Styling"
                value={{
                  fontSize: config.components.sectionHeader?.fontSize || '20px',
                  fontWeight: config.components.sectionHeader?.fontWeight || config.typography.fontWeight.heading,
                  color: config.components.sectionHeader?.color || config.colors.text.primary,
                  letterSpacing: config.components.sectionHeader?.letterSpacing || '0px',
                  textTransform: config.components.sectionHeader?.textTransform || 'none',
                }}
                onChange={(value) =>
                  updateConfig('components', {
                    sectionHeader: { ...config.components.sectionHeader, ...value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('components', {
                    sectionHeader: { ...config.components.sectionHeader, ...value },
                  })
                }
                showLetterSpacing={true}
              />
              <SelectControl
                label="Divider Style"
                value={config.components.sectionHeader?.dividerStyle || 'underline'}
                onChange={(value) =>
                  updateConfig('components', {
                    sectionHeader: { ...config.components.sectionHeader, dividerStyle: value as any },
                  })
                }
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'underline', label: 'Underline' },
                  { value: 'full-width', label: 'Full Width' },
                  { value: 'accent-bar', label: 'Accent Bar' },
                ]}
              />
              {config.components.sectionHeader?.dividerStyle && config.components.sectionHeader.dividerStyle !== 'none' && (
                <>
                  <ColorControl
                    label="Divider Color"
                    value={config.components.sectionHeader?.dividerColor || config.colors.primary}
                    onChange={(value) =>
                      updateConfig('components', {
                        sectionHeader: { ...config.components.sectionHeader, dividerColor: value },
                      })
                    }
                    onChangeComplete={(value) =>
                      commitConfig('components', {
                        sectionHeader: { ...config.components.sectionHeader, dividerColor: value },
                      })
                    }
                  />
                  <SpacingControl
                    label="Divider Width"
                    value={config.components.sectionHeader?.dividerWidth || '2px'}
                    onChange={(value) =>
                      updateConfig('components', {
                        sectionHeader: { ...config.components.sectionHeader, dividerWidth: value },
                      })
                    }
                    units={['px', 'pt']}
                  />
                </>
              )}
              <SpacingControl
                label="Margin Top"
                value={config.components.sectionHeader?.marginTop || '16px'}
                onChange={(value) =>
                  updateConfig('components', {
                    sectionHeader: { ...config.components.sectionHeader, marginTop: value },
                  })
                }
                units={['px', 'rem', 'em']}
              />
              <SpacingControl
                label="Margin Bottom"
                value={config.components.sectionHeader?.marginBottom || '8px'}
                onChange={(value) =>
                  updateConfig('components', {
                    sectionHeader: { ...config.components.sectionHeader, marginBottom: value },
                  })
                }
                units={['px', 'rem', 'em']}
              />
            </CollapsibleSection>

            {/* Header Section Alignment */}
            <CollapsibleSection id="components-header" label="Header Section" defaultOpen={false}>
              <SelectControl
                label="Alignment"
                value={config.components.header.alignment}
                onChange={(value) =>
                  updateConfig('components', {
                    header: { ...config.components.header, alignment: value as any },
                  })
                }
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </CollapsibleSection>

            {/* Tags/Skills */}
            <CollapsibleSection id="components-tags" label="Tags/Skills" defaultOpen={false}>
              <ColorPairControl
                label="Tag Colors"
                colorPair={config.components.tags.colorPair || 'tertiary'}
                backgroundOpacity={config.components.tags.backgroundOpacity ?? 0.2}
                textOpacity={config.components.tags.textOpacity ?? 1.0}
                onColorPairChange={(value) =>
                  updateConfig('components', {
                    tags: { ...config.components.tags, colorPair: value },
                  })
                }
                onBackgroundOpacityChange={(value) =>
                  updateConfig('components', {
                    tags: { ...config.components.tags, backgroundOpacity: value },
                  })
                }
                onTextOpacityChange={(value) =>
                  updateConfig('components', {
                    tags: { ...config.components.tags, textOpacity: value },
                  })
                }
                onChangeComplete={() =>
                  commitConfig('components', {
                    tags: {
                      ...config.components.tags,
                      colorPair: config.components.tags.colorPair || 'tertiary',
                      backgroundOpacity: config.components.tags.backgroundOpacity ?? 0.2,
                      textOpacity: config.components.tags.textOpacity ?? 1.0,
                    },
                  })
                }
              />
              <SpacingControl
                label="Border Radius"
                value={config.components.tags.borderRadius}
                onChange={(value) =>
                  updateConfig('components', {
                    tags: { ...config.components.tags, borderRadius: value },
                  })
                }
                units={['px', 'rem', '%']}
              />
              <SelectControl
                label="Tag Style"
                value={config.components.tags.style || 'pill'}
                onChange={(value) =>
                  updateConfig('components', {
                    tags: { ...config.components.tags, style: value as 'pill' | 'inline' },
                  })
                }
                options={[
                  { value: 'pill', label: 'Pill (rounded tags)' },
                  { value: 'inline', label: 'Inline (separated text)' }
                ]}
                description="Choose between pill-style tags or inline separated text"
              />
              {config.components.tags.style === 'inline' && (
                <SelectControl
                  label="Separator Character"
                  value={config.components.tags.separator || '·'}
                  onChange={(value) =>
                    updateConfig('components', {
                      tags: { ...config.components.tags, separator: value as '·' | '|' | '•' | ',' | 'none' },
                    })
                  }
                  options={[
                    { value: '·', label: '· (middle dot)' },
                    { value: '|', label: '| (vertical bar)' },
                    { value: '•', label: '• (bullet)' },
                    { value: ',', label: ', (comma)' },
                    { value: 'none', label: 'None (space only)' }
                  ]}
                  description="Character used to separate skills in inline mode"
                />
              )}
            </CollapsibleSection>

            {/* Dates */}
            <CollapsibleSection id="components-dates" label="Dates" defaultOpen={false}>
              <ColorControl
                label="Color"
                value={config.components.dateLine.color}
                onChange={(value) =>
                  updateConfig('components', {
                    dateLine: { ...config.components.dateLine, color: value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('components', {
                    dateLine: { ...config.components.dateLine, color: value },
                  })
                }
              />
              <SelectControl
                label="Font Style"
                value={config.components.dateLine.fontStyle}
                onChange={(value) =>
                  updateConfig('components', {
                    dateLine: { ...config.components.dateLine, fontStyle: value as any },
                  })
                }
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'italic', label: 'Italic' },
                ]}
              />
              <SelectControl
                label="Alignment"
                value={config.components.dateLine.alignment}
                onChange={(value) =>
                  updateConfig('components', {
                    dateLine: { ...config.components.dateLine, alignment: value as any },
                  })
                }
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
              <SelectControl
                label="Format"
                value={config.components.dateLine.format || 'short'}
                onChange={(value) =>
                  updateConfig('components', {
                    dateLine: { ...config.components.dateLine, format: value as any },
                  })
                }
                options={[
                  { value: 'full', label: 'Full (Month Year)' },
                  { value: 'short', label: 'Short (MM/YY)' },
                  { value: 'year-only', label: 'Year Only' },
                ]}
              />
            </CollapsibleSection>

            {/* Links */}
            <CollapsibleSection id="components-links" label="Links" defaultOpen={false}>
              <ColorControl
                label="Link Color"
                value={config.components.links.color || config.colors.links.default}
                onChange={(value) =>
                  updateConfig('components', {
                    links: { ...config.components.links, color: value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('components', {
                    links: { ...config.components.links, color: value },
                  })
                }
              />
              <ColorControl
                label="Hover Color"
                value={config.components.links.hoverColor || config.colors.links.hover}
                onChange={(value) =>
                  updateConfig('components', {
                    links: { ...config.components.links, hoverColor: value },
                  })
                }
                onChangeComplete={(value) =>
                  commitConfig('components', {
                    links: { ...config.components.links, hoverColor: value },
                  })
                }
              />
              <SelectControl
                label="Underline Style"
                value={config.components.links.underlineStyle || (config.components.links.underline ? 'always' : 'none')}
                onChange={(value) =>
                  updateConfig('components', {
                    links: { ...config.components.links, underlineStyle: value as any },
                  })
                }
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'always', label: 'Always' },
                  { value: 'hover', label: 'On Hover' },
                ]}
              />
              <NumberControl
                label="Font Weight"
                value={config.components.links.fontWeight || config.typography.fontWeight.body}
                onChange={(value) =>
                  updateConfig('components', {
                    links: { ...config.components.links, fontWeight: value },
                  })
                }
                min={100}
                max={900}
                step={100}
              />
            </CollapsibleSection>

            {/* Lists */}
            <CollapsibleSection id="components-lists" label="Lists" defaultOpen={false}>
              <MultiLevelBulletPicker
                level1={config.components.list.level1}
                level2={config.components.list.level2}
                level3={config.components.list.level3}
                onChange={(updates) =>
                  updateConfig('components', {
                    list: { ...config.components.list, ...updates },
                  })
                }
                onChangeComplete={(updates) =>
                  commitConfig('components', {
                    list: { ...config.components.list, ...updates },
                  })
                }
              />
            </CollapsibleSection>
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
