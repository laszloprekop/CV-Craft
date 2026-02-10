/**
 * Semantic Color Control Component
 *
 * Allows selecting colors from theme palette with optional opacity control.
 * Shows color swatches for visual feedback when resolvedColors is provided.
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
}

const COLOR_OPTIONS: Array<{ value: SemanticColor; label: string }> = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'tertiary', label: 'Tertiary' },
  { value: 'muted', label: 'Muted' },
  { value: 'text-primary', label: 'Text Primary' },
  { value: 'text-secondary', label: 'Text Secondary' },
  { value: 'text-muted', label: 'Text Muted' },
  { value: 'custom1', label: 'Custom 1' },
  { value: 'custom2', label: 'Custom 2' },
  { value: 'custom3', label: 'Custom 3' },
  { value: 'custom4', label: 'Custom 4' },
];

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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = COLOR_OPTIONS.find(o => o.value === colorKey) || COLOR_OPTIONS[0];
  const selectedHex = resolvedColors?.[colorKey];

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
          {selectedHex && (
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0 border border-black/10"
              style={{ backgroundColor: selectedHex }}
            />
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
            style={{ zIndex: 60, maxHeight: 240 }}
          >
            {COLOR_OPTIONS.map((option) => {
              const hex = resolvedColors?.[option.value];
              const isSelected = option.value === colorKey;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onColorChange(option.value);
                    onChangeComplete?.();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {hex ? (
                    <span
                      className="w-4 h-4 rounded-sm flex-shrink-0 border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                  ) : (
                    <span className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{option.label}</span>
                </button>
              );
            })}
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
