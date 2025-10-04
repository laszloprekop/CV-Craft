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

  // Ensure value is always a valid color (HTML5 color input requires #rrggbb format)
  const safeValue = value || '#000000';

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
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeValue}
          onChange={(e) => handleChange(e.target.value)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={(e) => handleComplete((e.target as HTMLInputElement).value)}
          onBlur={(e) => handleComplete(e.target.value)}
          className="w-7 h-7 border border-border/50 rounded cursor-pointer flex-shrink-0"
          style={{ aspectRatio: '1/1' }}
        />
        <input
          type="text"
          value={safeValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => handleComplete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleComplete((e.target as HTMLInputElement).value);
            }
          }}
          className="flex-1 px-2.5 py-1.5 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-mono transition-colors"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
