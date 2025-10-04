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
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1">{description}</p>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full px-2.5 py-1.5 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
};
