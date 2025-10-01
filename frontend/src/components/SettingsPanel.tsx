import React from 'react'
import { X } from '@phosphor-icons/react'
import type { Template, TemplateSettings } from '../../../shared/types'

interface SettingsPanelProps {
  template: Template | null
  settings: TemplateSettings
  onChange: (settings: Partial<TemplateSettings>) => void
  onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  template,
  settings,
  onChange,
  onClose
}) => {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border p-6 overflow-y-auto z-50">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 bg-transparent border-none text-xl cursor-pointer p-1 hover:bg-surface rounded"
      >
        <X size={20} />
      </button>
      
      <h3 className="text-lg font-semibold mb-6 text-text-primary">Template Settings</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">Primary Color:</label>
        <input
          type="color"
          value={settings.primaryColor || '#2563eb'}
          onChange={(e) => onChange({ primaryColor: e.target.value })}
          className="w-full h-10 border border-border rounded cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">Accent Color:</label>
        <input
          type="color"
          value={settings.accentColor || '#059669'}
          onChange={(e) => onChange({ accentColor: e.target.value })}
          className="w-full h-10 border border-border rounded cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">Background Color:</label>
        <input
          type="color"
          value={settings.backgroundColor || '#ffffff'}
          onChange={(e) => onChange({ backgroundColor: e.target.value })}
          className="w-full h-10 border border-border rounded cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">Surface Color:</label>
        <input
          type="color"
          value={settings.surfaceColor || '#ffffff'}
          onChange={(e) => onChange({ surfaceColor: e.target.value })}
          className="w-full h-10 border border-border rounded cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">Font Family:</label>
        <select
          value={settings.fontFamily || 'Inter'}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full p-2 border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input
            type="checkbox"
            checked={settings.useTagDesign || false}
            onChange={(e) => onChange({ useTagDesign: e.target.checked })}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
          />
          Tag Design for Skills
        </label>
      </div>
    </div>
  )
}