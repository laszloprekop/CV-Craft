/**
 * Bullet Style Picker Component
 *
 * Visual picker for list bullet styles with multi-level support
 */

import React from 'react';
import { ColorControl } from './ColorControl';
import { SelectControl } from './SelectControl';
import { SpacingControl } from './SpacingControl';

type BulletStyle = 'disc' | 'circle' | 'square' | 'none' | 'custom';

interface BulletLevelConfig {
  bulletStyle?: BulletStyle;
  customBullet?: string;
  color?: string;
  indent?: string;
}

interface BulletStylePickerProps {
  level: 'level1' | 'level2' | 'level3';
  label: string;
  value: BulletLevelConfig;
  onChange: (value: BulletLevelConfig) => void;
  onChangeComplete?: (value: BulletLevelConfig) => void;
}

export const BulletStylePicker: React.FC<BulletStylePickerProps> = ({
  level,
  label,
  value,
  onChange,
  onChangeComplete,
}) => {
  const update = (partial: Partial<BulletLevelConfig>) => {
    onChange({ ...value, ...partial });
  };

  const commit = (partial: Partial<BulletLevelConfig>) => {
    if (onChangeComplete) {
      onChangeComplete({ ...value, ...partial });
    }
  };

  const bulletOptions = [
    { value: 'disc', label: '● Disc', preview: '●' },
    { value: 'circle', label: '○ Circle', preview: '○' },
    { value: 'square', label: '■ Square', preview: '■' },
    { value: 'none', label: 'None', preview: '' },
    { value: 'custom', label: 'Custom', preview: value.customBullet || '▸' },
  ];

  return (
    <div className="mb-2 p-2 border border-border rounded bg-surface/30">
      <h6 className="text-[10px] font-semibold text-text-primary mb-1.5">{label}</h6>

      {/* Bullet Style Selector */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {bulletOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => update({ bulletStyle: option.value as BulletStyle })}
            className={`text-[10px] px-2 py-1.5 border rounded flex items-center gap-1 transition-all ${
              value.bulletStyle === option.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:border-primary/50 text-text-secondary'
            }`}
          >
            <span className="text-xs">{option.preview}</span>
            <span>{option.label.replace(/^[●○■]\s/, '')}</span>
          </button>
        ))}
      </div>

      {/* Custom Bullet Character */}
      {value.bulletStyle === 'custom' && (
        <div className="mb-2">
          <label className="block text-[10px] font-medium text-text-primary mb-1">
            Custom Character
          </label>
          <input
            type="text"
            value={value.customBullet || ''}
            onChange={(e) => update({ customBullet: e.target.value })}
            onBlur={(e) => commit({ customBullet: e.target.value })}
            maxLength={3}
            placeholder="▸"
            className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary text-center"
          />
        </div>
      )}

      {/* Bullet Color */}
      <ColorControl
        label="Color"
        value={value.color || '#000000'}
        onChange={(val) => update({ color: val })}
        onChangeComplete={(val) => commit({ color: val })}
      />

      {/* Indent */}
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
}

export const MultiLevelBulletPicker: React.FC<MultiLevelBulletPickerProps> = ({
  level1,
  level2,
  level3,
  onChange,
  onChangeComplete,
}) => {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-text-primary mb-2">
        List Bullets
      </label>

      <BulletStylePicker
        level="level1"
        label="Level 1"
        value={level1 || { bulletStyle: 'disc', color: '#2563eb', indent: '20px' }}
        onChange={(val) => onChange({ level1: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level1: val })}
      />

      <BulletStylePicker
        level="level2"
        label="Level 2 (nested)"
        value={level2 || { bulletStyle: 'circle', color: '#64748b', indent: '40px' }}
        onChange={(val) => onChange({ level2: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level2: val })}
      />

      <BulletStylePicker
        level="level3"
        label="Level 3 (nested)"
        value={level3 || { bulletStyle: 'square', color: '#94a3b8', indent: '60px' }}
        onChange={(val) => onChange({ level3: val })}
        onChangeComplete={(val) => onChangeComplete?.({ level3: val })}
      />
    </div>
  );
};
