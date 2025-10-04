/**
 * Collapsible Section Component
 *
 * A Figma-inspired collapsible section with smooth animations and persistent state.
 * Used for organizing groups of related controls in the settings panel.
 */

import React, { useState, useRef, useEffect } from 'react';
import { CaretRight } from '@phosphor-icons/react';

interface CollapsibleSectionProps {
  /** Unique identifier for localStorage persistence */
  id: string;
  /** Section title displayed in header */
  label: string;
  /** Whether section is initially open (used only on first render if no localStorage state) */
  defaultOpen?: boolean;
  /** Optional badge text (e.g., count of items) */
  badge?: string;
  /** Child controls to render when expanded */
  children: React.ReactNode;
}

/**
 * Custom hook for managing collapsible section state with localStorage persistence
 */
const useCollapsibleState = (id: string, defaultOpen: boolean = false) => {
  const storageKey = `collapsible-${id}`;

  // Initialize from localStorage, or use default
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      return stored === 'true';
    }
    return defaultOpen;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(storageKey, String(isOpen));
  }, [isOpen, storageKey]);

  const toggle = () => setIsOpen(!isOpen);

  return { isOpen, toggle };
};

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  label,
  defaultOpen = false,
  badge,
  children,
}) => {
  const { isOpen, toggle } = useCollapsibleState(id, defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  // Calculate content height for smooth animation
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen, children]);

  return (
    <div className="mb-2 border border-border rounded-md overflow-hidden bg-surface">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-hover transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${id}`}
      >
        <div className="flex items-center gap-2">
          {/* Chevron Icon */}
          <CaretRight
            size={14}
            weight="bold"
            className="text-text-secondary transition-transform duration-200"
            style={{
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />

          {/* Label */}
          <span className="text-xs font-semibold text-text-primary">
            {label}
          </span>

          {/* Optional Badge */}
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        id={`collapsible-content-${id}`}
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
        }}
      >
        <div ref={contentRef} className="px-3 pb-3 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
};
