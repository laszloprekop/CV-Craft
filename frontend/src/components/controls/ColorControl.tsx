import React, { useState, useRef } from 'react';
import { ColorPickerPopup } from './ColorPickerPopup';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onChangeComplete?: (value: string) => void;
  description?: string;
}

export const ColorControl: React.FC<ColorControlProps> = ({
  label,
  value,
  onChange,
  onChangeComplete,
  description
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const safeValue = value || '#000000';

  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-primary mb-1">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted mb-1">{description}</p>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block cursor-pointer rounded-sm flex-shrink-0"
        style={{
          width: 30,
          height: 30,
          backgroundColor: safeValue,
          border: 'none',
          padding: 0,
          margin: 0,
        }}
        title={`${safeValue} - click to pick color`}
      />
      <ColorPickerPopup
        value={safeValue}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};
