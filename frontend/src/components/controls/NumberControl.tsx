import React from 'react';

interface NumberControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberControl: React.FC<NumberControlProps> = ({
  label,
  value,
  onChange,
  description,
  min,
  max,
  step = 1,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
      />
    </div>
  );
};
