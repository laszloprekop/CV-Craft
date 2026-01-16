/**
 * Editor Styles
 * 
 * Styled components for the dual-pane CV editor layout
 */

import styled from 'styled-components'
import type { SaveStatus as SaveStatusType } from '../hooks/useCVEditor'

export const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  overflow: hidden;
`

export const EditorHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: 60px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }
`

export const HeaderTitle = styled.h1`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary);
  margin: 0;
`

export const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`

export const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
  }
`

export const SaveStatus = styled.div<{ status: SaveStatusType }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => {
      switch (props.status) {
        case 'saving': return 'var(--color-status-warning)'
        case 'saved': return 'var(--color-status-success)'
        case 'error': return 'var(--color-status-error)'
        default: return 'var(--color-border)'
      }
    }};
  }

  ${props => props.status === 'saving' && `
    &::before {
      animation: pulse 1.5s infinite;
    }
  `}

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

export const EditorPane = styled.div<{ 
  width: number
  $isResizing: boolean 
}>`
  width: ${props => props.width}%;
  height: 100%;
  transition: ${props => props.$isResizing ? 'none' : 'width 0.2s ease'};
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  position: relative;
`

export const PreviewPane = styled.div<{ 
  width: number
  $isResizing: boolean 
}>`
  width: ${props => props.width}%;
  height: 100%;
  transition: ${props => props.$isResizing ? 'none' : 'width 0.2s ease'};
  overflow: hidden;
  position: relative;
  background-color: var(--color-surface);
`

export const ResizeHandle = styled.div<{ $isResizing: boolean }>`
  width: 6px;
  height: 100%;
  background-color: var(--color-border);
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s ease;

  &:hover,
  &:active {
    background-color: var(--color-primary);
  }

  ${props => props.$isResizing && `
    background-color: var(--color-primary);
  `}

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 24px;
    background-color: var(--color-text-muted);
    border-radius: 1px;
    opacity: 0.5;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 24px;
    background-color: var(--color-text-muted);
    border-radius: 1px;
    opacity: 0.5;
    margin-left: 4px;
  }
`