/**
 * Layout Picker Component
 *
 * Visual picker for CV layout templates
 */

import React from 'react';

type LayoutType = 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';

interface LayoutPickerProps {
  value: LayoutType;
  onChange: (value: LayoutType) => void;
}

interface LayoutOption {
  value: LayoutType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const LayoutPicker: React.FC<LayoutPickerProps> = ({ value, onChange }) => {
  const layouts: LayoutOption[] = [
    {
      value: 'single-column',
      label: 'Single Column',
      description: 'Traditional single-column layout',
      icon: (
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className="mx-auto">
          <rect x="2" y="2" width="36" height="46" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
          <rect x="4" y="4" width="32" height="4" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="4" y="10" width="32" height="1.5" rx="0.5" fill="currentColor" opacity="0.2" />
          <rect x="4" y="13" width="32" height="1.5" rx="0.5" fill="currentColor" opacity="0.2" />
          <rect x="4" y="18" width="24" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="4" y="22" width="32" height="1" rx="0.5" fill="currentColor" opacity="0.15" />
          <rect x="4" y="24" width="32" height="1" rx="0.5" fill="currentColor" opacity="0.15" />
        </svg>
      ),
    },
    {
      value: 'two-column',
      label: 'Two Column',
      description: 'Balanced two-column layout',
      icon: (
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className="mx-auto">
          <rect x="2" y="2" width="17" height="46" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
          <rect x="21" y="2" width="17" height="46" rx="2" fill="currentColor" opacity="0.05" stroke="currentColor" strokeWidth="1" />
          <rect x="4" y="4" width="13" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="4" y="9" width="13" height="1" rx="0.5" fill="currentColor" opacity="0.2" />
          <rect x="23" y="4" width="13" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="23" y="8" width="13" height="1" rx="0.5" fill="currentColor" opacity="0.15" />
        </svg>
      ),
    },
    {
      value: 'sidebar-left',
      label: 'Sidebar Left',
      description: 'Narrow sidebar on left, main content on right',
      icon: (
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className="mx-auto">
          <rect x="2" y="2" width="12" height="46" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1" />
          <rect x="16" y="2" width="22" height="46" rx="2" fill="currentColor" opacity="0.05" stroke="currentColor" strokeWidth="1" />
          <circle cx="8" cy="10" r="4" fill="currentColor" opacity="0.3" />
          <rect x="4" y="16" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.2" />
          <rect x="18" y="4" width="18" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="18" y="8" width="18" height="1" rx="0.5" fill="currentColor" opacity="0.15" />
        </svg>
      ),
    },
    {
      value: 'sidebar-right',
      label: 'Sidebar Right',
      description: 'Main content on left, narrow sidebar on right',
      icon: (
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className="mx-auto">
          <rect x="2" y="2" width="22" height="46" rx="2" fill="currentColor" opacity="0.05" stroke="currentColor" strokeWidth="1" />
          <rect x="26" y="2" width="12" height="46" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1" />
          <rect x="4" y="4" width="18" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="4" y="8" width="18" height="1" rx="0.5" fill="currentColor" opacity="0.15" />
          <circle cx="32" cy="10" r="4" fill="currentColor" opacity="0.3" />
          <rect x="28" y="16" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-text-primary mb-2">
        Page Layout
      </label>
      <div className="grid grid-cols-2 gap-2">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            onClick={() => onChange(layout.value)}
            className={`p-2 border rounded text-left transition-all ${
              value === layout.value
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/50 hover:bg-surface'
            }`}
          >
            <div className="mb-2 text-text-primary">{layout.icon}</div>
            <div className="text-[10px] font-medium text-text-primary">{layout.label}</div>
            <div className="text-[9px] text-text-muted mt-0.5">{layout.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
