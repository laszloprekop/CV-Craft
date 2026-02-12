import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import { IconChevronRight } from '@tabler/icons-react';
import { TAILWIND_COLORS, SHADE_LABELS } from './tailwindColors';
import { ColorModel, COLOR_MODELS, hexToDisplay, displayToHex, modelPlaceholder } from './colorConversions';

interface ColorPickerPopupProps {
  value: string;
  onChange: (value: string) => void;
  onChangeComplete?: (value: string) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({
  value,
  onChange,
  onChangeComplete,
  triggerRef,
  isOpen,
  onClose,
}) => {
  const [tailwindOpen, setTailwindOpen] = useState(true);
  const [colorModel, setColorModel] = useState<ColorModel>('hex');
  const [editingText, setEditingText] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const lastCommittedValue = useRef(value);
  const popupRef = useRef<HTMLDivElement>(null);

  const safeValue = value || '#000000';
  const normalizedValue = safeValue.toLowerCase();

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleComplete = (newValue: string) => {
    if (onChangeComplete && lastCommittedValue.current !== newValue) {
      lastCommittedValue.current = newValue;
      onChangeComplete(newValue);
    }
  };

  const handleSwatchClick = (hex: string) => {
    handleChange(hex);
    if (onChangeComplete && lastCommittedValue.current !== hex) {
      lastCommittedValue.current = hex;
      onChangeComplete(hex);
    }
  };

  // Position the popup relative to the trigger, flipping above if needed
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = 260;
    const gap = 4;
    const margin = 8; // minimum distance from viewport edges
    const minUsableHeight = 200; // don't render smaller than this

    let left = rect.left;
    if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }

    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;

    let top: number;
    let maxHeight: number;

    if (spaceBelow >= minUsableHeight) {
      // Place below - cap height to available space
      top = rect.bottom + gap;
      maxHeight = spaceBelow;
    } else if (spaceAbove > spaceBelow) {
      // Flip above - more room there
      maxHeight = spaceAbove;
      top = rect.top - gap - Math.min(maxHeight, 500);
    } else {
      // Neither side is great - go below, capped
      top = rect.bottom + gap;
      maxHeight = spaceBelow;
    }

    setPopupPos({ top, left, maxHeight });
  }, [triggerRef]);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Sync committed ref when value changes externally
  useEffect(() => {
    lastCommittedValue.current = value;
  }, [value]);

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      popupRef.current && !popupRef.current.contains(e.target as Node) &&
      triggerRef.current && !triggerRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  }, [triggerRef, onClose]);

  // Close on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', onClose);
    const scrollParent = triggerRef.current?.closest('.overflow-y-auto');
    scrollParent?.addEventListener('scroll', onClose);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', onClose);
      scrollParent?.removeEventListener('scroll', onClose);
    };
  }, [isOpen, handleClickOutside, triggerRef, onClose]);

  if (!isOpen || !popupPos) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="fixed border border-border/50 rounded-lg bg-surface shadow-lg flex flex-col"
      style={{
        top: popupPos.top,
        left: popupPos.left,
        width: 260,
        maxHeight: popupPos.maxHeight,
        zIndex: 60,
      }}
    >
      {/* Color mixer (saturation + hue) */}
      <div className="p-2 pb-0 flex-shrink-0">
        <HexColorPicker
          color={safeValue}
          onChange={handleChange}
          onMouseUp={() => handleComplete(safeValue)}
          style={{ width: '100%', height: 160 }}
        />
      </div>

      {/* Color model selector + value input */}
      <div className="px-2 py-2 flex-shrink-0 flex items-center gap-1">
        <select
          value={colorModel}
          onChange={(e) => {
            setColorModel(e.target.value as ColorModel);
            setEditingText(null);
          }}
          className="px-1 py-1 text-[10px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary cursor-pointer"
          style={{ width: 62 }}
        >
          {COLOR_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={editingText ?? hexToDisplay(safeValue, colorModel)}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={(e) => {
            const hex = displayToHex(e.target.value, colorModel);
            if (hex) {
              handleChange(hex);
              handleComplete(hex);
            }
            setEditingText(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const hex = displayToHex((e.target as HTMLInputElement).value, colorModel);
              if (hex) {
                handleChange(hex);
                handleComplete(hex);
              }
              setEditingText(null);
            }
          }}
          className="flex-1 min-w-0 px-2 py-1 text-[11px] border border-border/50 rounded bg-surface text-text-primary focus:outline-none focus:border-primary font-mono transition-colors"
          placeholder={modelPlaceholder(colorModel)}
        />
      </div>

      {/* Swatch libraries - scrollable area */}
      <div className="overflow-y-auto flex-1 min-h-0 border-t border-border/30">
        <SwatchLibrary
          title="Tailwind"
          isOpen={tailwindOpen}
          onToggle={() => setTailwindOpen(!tailwindOpen)}
        >
          <div
            className="grid gap-px"
            style={{ gridTemplateColumns: 'repeat(11, 1fr)' }}
          >
            {TAILWIND_COLORS.map((family) =>
              family.shades.map((hex, shadeIdx) => {
                const isSelected = hex.toLowerCase() === normalizedValue;
                return (
                  <button
                    key={`${family.name}-${shadeIdx}`}
                    type="button"
                    onClick={() => handleSwatchClick(hex)}
                    title={`${family.name}-${SHADE_LABELS[shadeIdx]} ${hex}`}
                    className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-150 hover:z-10 relative"
                    style={{
                      backgroundColor: hex,
                      outline: isSelected ? '2px solid var(--color-primary, #3b82f6)' : 'none',
                      outlineOffset: isSelected ? '-1px' : undefined,
                      zIndex: isSelected ? 5 : undefined,
                    }}
                  />
                );
              })
            )}
          </div>
        </SwatchLibrary>
      </div>
    </div>,
    document.body
  );
};

/* ── Collapsible swatch library section ── */

interface SwatchLibraryProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SwatchLibrary: React.FC<SwatchLibraryProps> = ({ title, isOpen, onToggle, children }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
    >
      <IconChevronRight
        size={10}
        className="transition-transform flex-shrink-0"
        style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
      />
      {title}
    </button>
    {isOpen && <div className="px-1.5 pb-1.5">{children}</div>}
  </div>
);
