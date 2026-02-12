/**
 * Semantic Color Control Component
 *
 * Allows selecting colors from theme palette with optional opacity control.
 * Each dropdown entry shows its color as background with the on-color as text
 * for an immediate visual preview of how the color looks.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

type SemanticColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4' | 'on-primary' | 'on-secondary' | 'on-tertiary' | 'on-muted' | 'on-custom1' | 'on-custom2' | 'on-custom3' | 'on-custom4';

interface SemanticColorControlProps {
  label: string;
  colorKey: SemanticColor;
  opacity?: number;
  onColorChange: (colorKey: SemanticColor) => void;
  onOpacityChange?: (opacity: number) => void;
  onChangeComplete?: () => void;
  showOpacity?: boolean;
  description?: string;
  /** Map of semantic color keys → resolved hex values for swatch display */
  resolvedColors?: Record<string, string>;
  /** Filter which color groups are shown: 'text' = Text only, 'background' = Surface + On Surface only */
  mode?: 'text' | 'background';
}

interface ColorOption {
  value: SemanticColor;
  label: string;
  /** Key whose resolved color is used as the row background */
  bgKey: string;
  /** Key whose resolved color is used as the row text */
  fgKey: string;
  group: 'surface' | 'on' | 'text';
}

const COLOR_OPTIONS: ColorOption[] = [
  // Surface colors - bg is the color itself, text is the on-variant
  { value: 'primary', label: 'Primary', bgKey: 'primary', fgKey: 'on-primary', group: 'surface' },
  { value: 'secondary', label: 'Secondary', bgKey: 'secondary', fgKey: 'on-secondary', group: 'surface' },
  { value: 'tertiary', label: 'Tertiary', bgKey: 'tertiary', fgKey: 'on-tertiary', group: 'surface' },
  { value: 'muted', label: 'Muted', bgKey: 'muted', fgKey: 'on-muted', group: 'surface' },
  { value: 'custom1', label: 'Custom 1', bgKey: 'custom1', fgKey: 'on-custom1', group: 'surface' },
  { value: 'custom2', label: 'Custom 2', bgKey: 'custom2', fgKey: 'on-custom2', group: 'surface' },
  { value: 'custom3', label: 'Custom 3', bgKey: 'custom3', fgKey: 'on-custom3', group: 'surface' },
  { value: 'custom4', label: 'Custom 4', bgKey: 'custom4', fgKey: 'on-custom4', group: 'surface' },
  // On-colors - swapped/negative: bg is the on-color, text is the surface it pairs with
  { value: 'on-primary', label: 'On Primary', bgKey: 'on-primary', fgKey: 'primary', group: 'on' },
  { value: 'on-secondary', label: 'On Secondary', bgKey: 'on-secondary', fgKey: 'secondary', group: 'on' },
  { value: 'on-tertiary', label: 'On Tertiary', bgKey: 'on-tertiary', fgKey: 'tertiary', group: 'on' },
  { value: 'on-muted', label: 'On Muted', bgKey: 'on-muted', fgKey: 'muted', group: 'on' },
  { value: 'on-custom1', label: 'On Custom 1', bgKey: 'on-custom1', fgKey: 'custom1', group: 'on' },
  { value: 'on-custom2', label: 'On Custom 2', bgKey: 'on-custom2', fgKey: 'custom2', group: 'on' },
  { value: 'on-custom3', label: 'On Custom 3', bgKey: 'on-custom3', fgKey: 'custom3', group: 'on' },
  { value: 'on-custom4', label: 'On Custom 4', bgKey: 'on-custom4', fgKey: 'custom4', group: 'on' },
  // Text colors - shown on neutral background
  { value: 'text-primary', label: 'On Background', bgKey: '', fgKey: 'text-primary', group: 'text' },
  { value: 'text-secondary', label: 'On Background (Light)', bgKey: '', fgKey: 'text-secondary', group: 'text' },
  { value: 'text-muted', label: 'On Background (Muted)', bgKey: '', fgKey: 'text-muted', group: 'text' },
  { value: 'on-custom1', label: 'On Custom 1', bgKey: '', fgKey: 'on-custom1', group: 'text' },
  { value: 'on-custom2', label: 'On Custom 2', bgKey: '', fgKey: 'on-custom2', group: 'text' },
  { value: 'on-custom3', label: 'On Custom 3', bgKey: '', fgKey: 'on-custom3', group: 'text' },
  { value: 'on-custom4', label: 'On Custom 4', bgKey: '', fgKey: 'on-custom4', group: 'text' },
];

const GROUP_LABELS: Record<string, string> = {
  surface: 'Surface',
  on: 'On Surface',
  text: 'Text',
};

export const SemanticColorControl: React.FC<SemanticColorControlProps> = ({
  label,
  colorKey,
  opacity = 1.0,
  onColorChange,
  onOpacityChange,
  onChangeComplete,
  showOpacity = false,
  description,
  resolvedColors,
  mode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState(400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = COLOR_OPTIONS.find(o => o.value === colorKey) || COLOR_OPTIONS[0];
  const selectedBg = resolvedColors?.[selectedOption.bgKey];
  const selectedFg = resolvedColors?.[selectedOption.fgKey];
  const selectedFallbackBg = selectedOption.group === 'on' ? '#000000' : '#f8f9fa';
  const selectedFallbackFg = selectedOption.group === 'on' ? '#ffffff' : '#fff';

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
      triggerRef.current && !triggerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  // Calculate max-height so dropdown doesn't overflow viewport
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.bottom - 8; // 8px margin from bottom
      setMaxHeight(Math.max(120, available));
    }
  }, [isOpen]);

  // Filter options based on mode
  const allowedGroups = mode === 'text'
    ? new Set(['text'])
    : mode === 'background'
      ? new Set(['surface', 'on'])
      : null; // no filter - show all

  const filteredOptions = allowedGroups
    ? COLOR_OPTIONS.filter(o => allowedGroups.has(o.group))
    : COLOR_OPTIONS;

  // Group options for rendering with separators
  const groups: Array<{ key: string; options: ColorOption[] }> = [];
  let currentGroup = '';
  for (const opt of filteredOptions) {
    if (opt.group !== currentGroup) {
      currentGroup = opt.group;
      groups.push({ key: opt.group, options: [] });
    }
    groups[groups.length - 1].options.push(opt);
  }

  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1">{description}</p>
      )}

      {/* Custom dropdown trigger */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer mb-2"
        >
          {selectedBg || selectedFg ? (
            <span
              className="w-5 h-5 rounded-sm flex-shrink-0 border border-black/10 flex items-center justify-center text-[8px] font-bold"
              style={{ backgroundColor: selectedBg || selectedFallbackBg, color: selectedFg || selectedFallbackFg }}
            >
              Aa
            </span>
          ) : (
            <span className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="flex-1 text-left">{selectedOption.label}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 text-text-muted">
            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full -mt-1 border border-border/50 rounded bg-surface shadow-lg overflow-y-auto"
            style={{ zIndex: 60, maxHeight }}
          >
            {groups.map((group, gi) => (
              <div key={group.key}>
                {/* Group separator label */}
                <div className="px-2 py-1 text-[9px] font-semibold text-text-muted uppercase tracking-wider bg-surface/80 sticky top-0 border-b border-border/30">
                  {GROUP_LABELS[group.key]}
                </div>
                {group.options.map((option) => {
                  const bg = resolvedColors?.[option.bgKey];
                  const fg = resolvedColors?.[option.fgKey];
                  const isSelected = option.value === colorKey;
                  const hasBg = !!bg;

                  const fallbackBg = option.group === 'on' ? '#000000' : '#f8f9fa';
                  const fallbackFg = option.group === 'on' ? '#ffffff' : '#333';

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onColorChange(option.value);
                        onChangeComplete?.();
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-1.5 py-1 text-[11px] text-left cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-inset ring-primary/60' : ''
                      }`}
                      style={{
                        backgroundColor: hasBg ? bg : fallbackBg,
                        color: fg || fallbackFg,
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-sm flex-shrink-0 border border-black/15 flex items-center justify-center text-[8px] font-bold"
                        style={{
                          backgroundColor: hasBg ? bg : fallbackBg,
                          color: fg || fallbackFg,
                        }}
                      >
                        Aa
                      </span>
                      <span className="flex-1 font-medium">{option.label}</span>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
                {gi < groups.length - 1 && <div className="h-px bg-border/30" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional Opacity Slider */}
      {showOpacity && onOpacityChange && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-medium text-text-primary">
              Opacity
            </label>
            <span className="text-[10px] text-text-muted">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
            onMouseUp={() => onChangeComplete?.()}
            onTouchEnd={() => onChangeComplete?.()}
            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer slider"
            style={{
              accentColor: 'var(--primary-color)'
            }}
          />
        </div>
      )}
    </div>
  );
};
