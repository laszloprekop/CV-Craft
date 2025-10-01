import React from 'react';

interface ToggleControlProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

export const ToggleControl: React.FC<ToggleControlProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  return (
    <div className="mb-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {description && (
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </label>
    </div>
  );
};
