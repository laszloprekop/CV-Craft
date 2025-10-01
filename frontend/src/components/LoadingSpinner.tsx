import React from 'react'
import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Spinner = styled.div<{ size: string }>`
  width: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '48px' : '24px'};
  height: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '48px' : '24px'};
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  return <Spinner size={size} />
}