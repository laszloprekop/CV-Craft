import React from 'react';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export const ColorControl: React.FC<ColorControlProps> = ({ label, value, onChange, description }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 border border-border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
