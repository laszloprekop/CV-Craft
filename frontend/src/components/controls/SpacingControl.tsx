import React from 'react';

interface SpacingControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  description?: string;
  min?: number;
  max?: number;
  units?: string[];
}

export const SpacingControl: React.FC<SpacingControlProps> = ({
  label,
  value,
  onChange,
  description,
  min = 0,
  max = 100,
  units = ['px', 'rem', 'em', '%', 'mm'],
}) => {
  // Parse value into number and unit
  const parseValue = (val: string | undefined): { num: number; unit: string } => {
    if (!val) return { num: 0, unit: units[0] };
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
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={num}
          onChange={(e) => handleNumberChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step="0.5"
          className="flex-1 px-3 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
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
