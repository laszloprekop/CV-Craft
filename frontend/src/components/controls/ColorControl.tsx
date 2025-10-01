import React from 'react';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export const ColorControl: React.FC<ColorControlProps> = ({ label, value, onChange, description }) => {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-secondary mb-1">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
