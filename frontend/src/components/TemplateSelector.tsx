import React from 'react'
import styled from 'styled-components'
import type { Template } from '../../../shared/types'

const SelectorContainer = styled.div`
  position: relative;
`

const SelectorButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  &:hover {
    background-color: var(--color-surface);
  }
`

interface TemplateSelectorProps {
  templates: Template[]
  activeTemplate: Template | null
  onChange: (templateId: string) => void
  disabled?: boolean
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  activeTemplate,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectorContainer>
      <SelectorButton 
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        🎨 {activeTemplate?.name || 'Select Template'}
        <span>{isOpen ? '▼' : '▶'}</span>
      </SelectorButton>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-md)',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onChange(template.id)
                setIsOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: 'none',
                background: template.id === activeTemplate?.id ? 'var(--color-primary)' : 'transparent',
                color: template.id === activeTemplate?.id ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      )}
    </SelectorContainer>
  )
}