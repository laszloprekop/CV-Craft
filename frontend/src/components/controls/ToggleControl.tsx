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
    <div className="mb-3">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-primary border-border/50 rounded focus:ring-primary"
        />
        <div className="flex-1">
          <span className="text-[11px] font-medium text-text-primary">{label}</span>
          {description && (
            <p className="text-[10px] text-text-muted mt-0.5">{description}</p>
          )}
        </div>
      </label>
    </div>
  );
};
