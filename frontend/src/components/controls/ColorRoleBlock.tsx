import React, { useState, useRef } from 'react';
import { ColorPickerPopup } from './ColorPickerPopup';

interface ColorRoleBlockProps {
  label: string;
  value: string;
  /** Color used for the label text (e.g. the "on" counterpart). Falls back to auto contrast. */
  textColor?: string;
  onChange: (value: string) => void;
  onChangeComplete?: (value: string) => void;
}

function contrastTextColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#000000' : '#ffffff';
}

export const ColorRoleBlock: React.FC<ColorRoleBlockProps> = ({
  label,
  value,
  textColor,
  onChange,
  onChangeComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const safeValue = value || '#000000';
  const displayTextColor = textColor || contrastTextColor(safeValue);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-2 cursor-pointer transition-opacity hover:opacity-90"
        style={{
          backgroundColor: safeValue,
          color: displayTextColor,
          height: 44,
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 1.2,
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: 6,
          border: 'none',
          margin: 0,
        }}
        title={`${label}: ${safeValue} — click to edit`}
      >
        {label}
      </button>
      <ColorPickerPopup
        value={safeValue}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
