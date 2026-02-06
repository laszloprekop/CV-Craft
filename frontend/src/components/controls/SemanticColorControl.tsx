/**
 * Semantic Color Control Component
 *
 * Allows selecting colors from theme palette with optional opacity control
 * for both background and text (On) variants
 */

import React from 'react';

type SemanticColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';

interface SemanticColorControlProps {
  label: string;
  colorKey: SemanticColor;
  opacity?: number; // 0-1, optional opacity for the color
  onColorChange: (colorKey: SemanticColor) => void;
  onOpacityChange?: (opacity: number) => void;
  onChangeComplete?: () => void;
  showOpacity?: boolean;
  description?: string;
}

const COLOR_OPTIONS: Array<{ value: SemanticColor; label: string; description: string }> = [
  { value: 'primary', label: 'Primary', description: '--primary-color' },
  { value: 'secondary', label: 'Secondary', description: '--secondary-color' },
  { value: 'tertiary', label: 'Tertiary', description: '--tertiary-color' },
  { value: 'muted', label: 'Muted', description: '--muted-color' },
  { value: 'text-primary', label: 'Text Primary', description: '--text-primary' },
  { value: 'text-secondary', label: 'Text Secondary', description: '--text-secondary' },
  { value: 'text-muted', label: 'Text Muted', description: '--text-muted' },
  { value: 'custom1', label: 'Custom 1', description: '--custom1-color' },
  { value: 'custom2', label: 'Custom 2', description: '--custom2-color' },
  { value: 'custom3', label: 'Custom 3', description: '--custom3-color' },
  { value: 'custom4', label: 'Custom 4', description: '--custom4-color' },
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
}) => {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1">{description}</p>
      )}

      {/* Color Selector */}
      <select
        value={colorKey}
        onChange={(e) => {
          onColorChange(e.target.value as SemanticColor);
          onChangeComplete?.();
        }}
        className="w-full px-2.5 py-1.5 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors mb-2"
      >
        {COLOR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.description})
          </option>
        ))}
      </select>

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
