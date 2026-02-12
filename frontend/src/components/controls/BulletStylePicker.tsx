/**
 * Bullet Style Picker Component
 *
 * Visual picker for list bullet styles with multi-level support
 */

import React from 'react';
import { SpacingControl } from './SpacingControl';
import { SemanticColorControl } from './SemanticColorControl';

type BulletStyle = 'disc' | 'circle' | 'square' | 'none' | 'custom';
type SemanticColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4' | 'on-primary' | 'on-secondary' | 'on-tertiary' | 'on-muted' | 'on-custom1' | 'on-custom2' | 'on-custom3' | 'on-custom4';

interface BulletLevelConfig {
  bulletStyle?: BulletStyle;
  customBullet?: string;
  color?: string;
  colorKey?: string;
  indent?: string;
}

interface BulletStylePickerProps {
  level: 'level1' | 'level2' | 'level3';
  label: string;
  value: BulletLevelConfig;
  onChange: (value: BulletLevelConfig) => void;
  onChangeComplete?: (value: BulletLevelConfig) => void;
  resolvedColors?: Record<string, string>;
}

const STYLE_OPTIONS: { value: BulletStyle; preview: string }[] = [
  { value: 'disc', preview: '●' },
  { value: 'circle', preview: '○' },
  { value: 'square', preview: '■' },
  { value: 'none', preview: '—' },
];

export const BulletStylePicker: React.FC<BulletStylePickerProps> = ({
  label,
  value,
  onChange,
  onChangeComplete,
  resolvedColors,
}) => {
  const update = (partial: Partial<BulletLevelConfig>) => {
    onChange({ ...value, ...partial });
  };

  const commit = (partial: Partial<BulletLevelConfig>) => {
    if (onChangeComplete) {
      onChangeComplete({ ...value, ...partial });
    }
  };

  const isCustom = value.bulletStyle === 'custom';

  return (
    <div className="mb-2">
      <h6 className="text-[10px] font-semibold text-text-primary mb-1">{label}</h6>

      {/* Bullet style selector - horizontal row */}
      <div className="flex gap-1 mb-1.5">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => update({ bulletStyle: option.value })}
            className={`text-sm w-7 h-7 flex items-center justify-center border rounded transition-all ${
              !isCustom && value.bulletStyle === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 text-text-secondary'
            }`}
            title={option.value}
          >
            {option.preview}
          </button>
        ))}
        {/* Custom bullet inline input */}
        <input
          type="text"
          value={isCustom ? (value.customBullet || '') : ''}
          onChange={(e) => {
            const v = e.target.value;
            update({ bulletStyle: 'custom', customBullet: v });
          }}
          onFocus={() => {
            if (!isCustom) update({ bulletStyle: 'custom' });
          }}
          onBlur={(e) => commit({ bulletStyle: 'custom', customBullet: e.target.value })}
          maxLength={3}
          placeholder="▸"
          className={`w-7 h-7 text-sm text-center border rounded transition-all focus:outline-none focus:border-primary ${
            isCustom
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-text-secondary'
          }`}
          title="Custom character"
        />
      </div>

      {/* Color + Indent row */}
      <SemanticColorControl
        label="Color"
        colorKey={(value.colorKey || 'primary') as SemanticColor}
        onColorChange={(v) => update({ colorKey: v })}
        onChangeComplete={() => commit({ colorKey: value.colorKey })}
        resolvedColors={resolvedColors}
        mode="text"
      />
      <SpacingControl
        label="Indent"
        value={value.indent || '20px'}
        onChange={(val) => update({ indent: val })}
        units={['px', 'em', 'rem']}
      />
    </div>
  );
};

/**
 * Multi-Level Bullet Style Picker
 */
interface MultiLevelBulletPickerProps {
  level1?: BulletLevelConfig;
  level2?: BulletLevelConfig;
  level3?: BulletLevelConfig;
  onChange: (updates: {
    level1?: BulletLevelConfig;
    level2?: BulletLevelConfig;
    level3?: BulletLevelConfig;
  }) => void;
  onChangeComplete?: (updates: {
    level1?: BulletLevelConfig;
    level2?: BulletLevelConfig;
    level3?: BulletLevelConfig;
  }) => void;
  resolvedColors?: Record<string, string>;
}

export const MultiLevelBulletPicker: React.FC<MultiLevelBulletPickerProps> = ({
  level1,
  level2,
  level3,
  onChange,
  onChangeComplete,
  resolvedColors,
}) => {
  return (
    <div>
      <BulletStylePicker
        level="level1"
        label="Level 1"
        value={level1 || { bulletStyle: 'disc', colorKey: 'primary', indent: '20px' }}
        onChange={(val) => onChange({ level1: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level1: val })}
        resolvedColors={resolvedColors}
      />

      <BulletStylePicker
        level="level2"
        label="Level 2 (nested)"
        value={level2 || { bulletStyle: 'circle', colorKey: 'text-secondary', indent: '40px' }}
        onChange={(val) => onChange({ level2: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level2: val })}
        resolvedColors={resolvedColors}
      />

      <BulletStylePicker
        level="level3"
        label="Level 3 (nested)"
        value={level3 || { bulletStyle: 'square', colorKey: 'text-muted', indent: '60px' }}
        onChange={(val) => onChange({ level3: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level3: val })}
        resolvedColors={resolvedColors}
      />
    </div>
  );
};
