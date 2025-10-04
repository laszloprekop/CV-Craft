import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  description?: string;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  label,
  value,
  onChange,
  options,
  description,
}) => {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1.5">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
