/**
 * Color Pair Control Component
 *
 * Selector for semantic color pairs with transparency controls
 */

import React from 'react';

type ColorPair = 'primary' | 'secondary' | 'tertiary' | 'muted';

interface ColorPairControlProps {
  label: string;
  colorPair: ColorPair;
  backgroundOpacity: number; // 0-1
  textOpacity: number; // 0-1
  onColorPairChange: (colorPair: ColorPair) => void;
  onBackgroundOpacityChange: (opacity: number) => void;
  onTextOpacityChange: (opacity: number) => void;
  onChangeComplete?: () => void;
}

export const ColorPairControl: React.FC<ColorPairControlProps> = ({
  label,
  colorPair,
  backgroundOpacity,
  textOpacity,
  onColorPairChange,
  onBackgroundOpacityChange,
  onTextOpacityChange,
  onChangeComplete
}) => {
  const colorPairs: Array<{ value: ColorPair; label: string }> = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'tertiary', label: 'Tertiary' },
    { value: 'muted', label: 'Muted' }
  ];

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-text-primary mb-2">
        {label}
      </label>

      {/* Color Pair Selector */}
      <div className="mb-2">
        <label className="block text-[10px] font-medium text-text-primary mb-1">
          Color Pair
        </label>
        <div className="grid grid-cols-2 gap-1">
          {colorPairs.map((pair) => (
            <button
              key={pair.value}
              onClick={() => {
                onColorPairChange(pair.value);
                onChangeComplete?.();
              }}
              className={`text-[10px] px-2 py-1.5 border rounded transition-all ${
                colorPair === pair.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 text-text-secondary'
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Opacity Slider */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-medium text-text-primary">
            Background Opacity
          </label>
          <span className="text-[10px] text-text-muted">
            {Math.round(backgroundOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(backgroundOpacity * 100)}
          onChange={(e) => onBackgroundOpacityChange(parseInt(e.target.value) / 100)}
          onMouseUp={() => onChangeComplete?.()}
          onTouchEnd={() => onChangeComplete?.()}
          className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer slider"
          style={{
            accentColor: 'var(--primary-color)'
          }}
        />
      </div>

      {/* Text Opacity Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-medium text-text-primary">
            Text Opacity
          </label>
          <span className="text-[10px] text-text-muted">
            {Math.round(textOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(textOpacity * 100)}
          onChange={(e) => onTextOpacityChange(parseInt(e.target.value) / 100)}
          onMouseUp={() => onChangeComplete?.()}
          onTouchEnd={() => onChangeComplete?.()}
          className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer slider"
          style={{
            accentColor: 'var(--primary-color)'
          }}
        />
      </div>
    </div>
  );
};
