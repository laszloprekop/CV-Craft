import React from 'react'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-status-error);
`

const ErrorTitle = styled.h2`
  margin-bottom: var(--spacing-md);
  color: var(--color-status-error);
`

const ErrorText = styled.p`
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
`

const RetryButton = styled.button`
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
`

interface ErrorMessageProps {
  title: string
  message: string
  onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message, onRetry }) => {
  return (
    <ErrorContainer>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorText>{message}</ErrorText>
      {onRetry && <RetryButton onClick={onRetry}>Try Again</RetryButton>}
    </ErrorContainer>
  )
}