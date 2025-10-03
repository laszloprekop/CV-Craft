import React, { useState, useRef } from 'react';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onChangeComplete?: (value: string) => void; // Called when user finishes changing (mouse up, blur)
  description?: string;
}

export const ColorControl: React.FC<ColorControlProps> = ({
  label,
  value,
  onChange,
  onChangeComplete,
  description
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastCommittedValue = useRef(value);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleComplete = (newValue: string) => {
    // Only trigger onChangeComplete if value actually changed
    if (onChangeComplete && lastCommittedValue.current !== newValue) {
      console.log(`[ColorControl] 💾 "${label}": ${lastCommittedValue.current} → ${newValue}`)
      lastCommittedValue.current = newValue;
      onChangeComplete(newValue);
    }
    setIsDragging(false);
  };

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
          onChange={(e) => handleChange(e.target.value)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={(e) => handleComplete((e.target as HTMLInputElement).value)}
          onBlur={(e) => handleComplete(e.target.value)}
          className="w-8 h-8 border border-border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => handleComplete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleComplete((e.target as HTMLInputElement).value);
            }
          }}
          className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
