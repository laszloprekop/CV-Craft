/**
 * Text Style Control Component
 *
 * Comprehensive text styling control with font, size, weight, color, etc.
 */

import React from 'react';
import { ColorControl } from './ColorControl';
import { SelectControl } from './SelectControl';
import { SpacingControl } from './SpacingControl';
import { NumberControl } from './NumberControl';

interface TextStyleConfig {
  fontSize?: string;
  fontWeight?: number;
  color?: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  alignment?: 'left' | 'center' | 'right';
  marginBottom?: string;
  fontStyle?: 'normal' | 'italic';
}

interface TextStyleControlProps {
  label: string;
  value: TextStyleConfig;
  onChange: (value: TextStyleConfig) => void;
  onChangeComplete?: (value: TextStyleConfig) => void;
  showAlignment?: boolean;
  showMargin?: boolean;
  showLetterSpacing?: boolean;
  showFontStyle?: boolean;
}

export const TextStyleControl: React.FC<TextStyleControlProps> = ({
  label,
  value,
  onChange,
  onChangeComplete,
  showAlignment = false,
  showMargin = false,
  showLetterSpacing = false,
  showFontStyle = false,
}) => {
  const update = (partial: Partial<TextStyleConfig>) => {
    onChange({ ...value, ...partial });
  };

  const commit = (partial: Partial<TextStyleConfig>) => {
    if (onChangeComplete) {
      onChangeComplete({ ...value, ...partial });
    }
  };

  return (
    <div className="">
      {/*<h5 className="text-xs font-semibold text-text-primary mb-2">{label}</h5>*/}

      {/* Font Size & Weight */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <SpacingControl
          label="Size"
          value={value.fontSize || '16px'}
          onChange={(val) => update({ fontSize: val })}
          units={['px', 'pt', 'rem', 'em']}
        />
        <NumberControl
          label="Weight"
          value={value.fontWeight || 400}
          onChange={(val) => update({ fontWeight: val })}
          min={100}
          max={900}
          step={100}
        />
      </div>

      {/* Color */}
      <ColorControl
        label="Color"
        value={value.color || '#000000'}
        onChange={(val) => update({ color: val })}
        onChangeComplete={(val) => commit({ color: val })}
      />

      {/* Text Transform */}
      <SelectControl
        label="Transform"
        value={value.textTransform || 'none'}
        onChange={(val) => update({ textTransform: val as any })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'uppercase', label: 'UPPERCASE' },
          { value: 'lowercase', label: 'lowercase' },
          { value: 'capitalize', label: 'Capitalize' },
        ]}
      />

      {/* Optional: Alignment */}
      {showAlignment && (
        <SelectControl
          label="Alignment"
          value={value.alignment || 'left'}
          onChange={(val) => update({ alignment: val as any })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
        />
      )}

      {/* Optional: Letter Spacing */}
      {showLetterSpacing && (
        <SpacingControl
          label="Letter Spacing"
          value={value.letterSpacing || '0'}
          onChange={(val) => update({ letterSpacing: val })}
          units={['px', 'em']}
        />
      )}

      {/* Optional: Margin Bottom */}
      {showMargin && (
        <SpacingControl
          label="Margin Bottom"
          value={value.marginBottom || '0'}
          onChange={(val) => update({ marginBottom: val })}
        />
      )}

      {/* Optional: Font Style */}
      {showFontStyle && (
        <SelectControl
          label="Style"
          value={value.fontStyle || 'normal'}
          onChange={(val) => update({ fontStyle: val as any })}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'italic', label: 'Italic' },
          ]}
        />
      )}
    </div>
  );
};
