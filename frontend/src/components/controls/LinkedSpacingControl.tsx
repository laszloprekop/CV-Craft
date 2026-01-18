import React from 'react';
import { IconLink, IconUnlink } from '@tabler/icons-react';

interface LinkedSpacingControlProps {
  label: string;
  // Uniform value (used when mode is 'uniform')
  uniformValue?: string;
  // Individual values (used when mode is 'individual')
  topValue?: string;
  rightValue?: string;
  bottomValue?: string;
  leftValue?: string;
  // Current mode
  mode?: 'uniform' | 'individual';
  // Callbacks
  onUniformChange: (value: string) => void;
  onTopChange: (value: string) => void;
  onRightChange: (value: string) => void;
  onBottomChange: (value: string) => void;
  onLeftChange: (value: string) => void;
  onModeChange: (mode: 'uniform' | 'individual') => void;
  // Options
  units?: string[];
  defaultValue?: string;
}

// Simple input with unit dropdown
const SpacingInput: React.FC<{
  value: string | undefined;
  onChange: (value: string) => void;
  units: string[];
  defaultValue: string;
  disabled?: boolean;
  label?: string;
}> = ({ value, onChange, units, defaultValue, disabled = false, label }) => {
  const parseValue = (val: string | undefined): { num: number; unit: string } => {
    if (!val) {
      const match = defaultValue.match(/^([\d.]+)(.*)$/);
      if (match) return { num: parseFloat(match[1]) || 0, unit: match[2] || units[0] };
      return { num: 0, unit: units[0] };
    }
    const match = val.match(/^([\d.]+)(.*)$/);
    if (!match) return { num: 0, unit: units[0] };
    return {
      num: parseFloat(match[1]) || 0,
      unit: match[2] || units[0],
    };
  };

  const { num, unit } = parseValue(value);

  const handleNumberChange = (newNum: number) => {
    onChange(`${newNum}${unit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    onChange(`${num}${newUnit}`);
  };

  return (
    <div className="flex items-center gap-1">
      {label && (
        <span className="text-[10px] text-text-muted w-10 flex-shrink-0">{label}</span>
      )}
      <div className={`flex items-center flex-1 ${disabled ? 'opacity-40' : ''}`}>
        <input
          type="number"
          value={num}
          onChange={(e) => handleNumberChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          min={0}
          step={1}
          className="w-full min-w-[40px] px-1.5 py-1 text-[11px] text-center border border-border/50 rounded-l bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors disabled:bg-surface/50 disabled:cursor-not-allowed"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          disabled={disabled}
          className="px-0.5 py-1 text-[10px] border border-l-0 border-border/50 rounded-r bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors disabled:bg-surface/50 disabled:cursor-not-allowed"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const LinkedSpacingControl: React.FC<LinkedSpacingControlProps> = ({
  label,
  uniformValue,
  topValue,
  rightValue,
  bottomValue,
  leftValue,
  mode = 'uniform',
  onUniformChange,
  onTopChange,
  onRightChange,
  onBottomChange,
  onLeftChange,
  onModeChange,
  units = ['px', 'rem', 'em', '%', 'mm'],
  defaultValue = '0px',
}) => {
  const isUniform = mode === 'uniform';

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-text-primary">{label}</span>

        {/* Mode toggle buttons */}
        <div className="flex items-center gap-1">
          {/* Uniform mode */}
          <button
            type="button"
            onClick={() => onModeChange('uniform')}
            className={`p-1 rounded transition-colors ${
              isUniform
                ? 'bg-primary/20 text-primary'
                : 'bg-surface text-text-secondary hover:bg-surface/80'
            }`}
            title="Uniform spacing (all sides equal)"
          >
            <IconLink size={16} stroke={isUniform ? 2.5 : 1.5} />
          </button>

          {/* Individual mode */}
          <button
            type="button"
            onClick={() => onModeChange('individual')}
            className={`p-1 rounded transition-colors ${
              !isUniform
                ? 'bg-primary/20 text-primary'
                : 'bg-surface text-text-secondary hover:bg-surface/80'
            }`}
            title="Individual spacing (each side separate)"
          >
            <IconUnlink size={16} stroke={!isUniform ? 2.5 : 1.5} />
          </button>
        </div>
      </div>

      {/* Uniform input */}
      {isUniform && (
        <SpacingInput
          value={uniformValue}
          onChange={onUniformChange}
          units={units}
          defaultValue={defaultValue}
        />
      )}

      {/* Individual inputs in vertical list */}
      {!isUniform && (
        <div className="space-y-1.5">
          <SpacingInput
            value={topValue}
            onChange={onTopChange}
            units={units}
            defaultValue={defaultValue}
            label="Top"
          />
          <SpacingInput
            value={rightValue}
            onChange={onRightChange}
            units={units}
            defaultValue={defaultValue}
            label="Right"
          />
          <SpacingInput
            value={bottomValue}
            onChange={onBottomChange}
            units={units}
            defaultValue={defaultValue}
            label="Bottom"
          />
          <SpacingInput
            value={leftValue}
            onChange={onLeftChange}
            units={units}
            defaultValue={defaultValue}
            label="Left"
          />
        </div>
      )}
    </div>
  );
};
