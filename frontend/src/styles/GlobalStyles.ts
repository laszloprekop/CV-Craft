/**
 * Global Styles
 *
 * CSS reset and global styles using styled-components with CSS Custom Properties
 */

import styled, { createGlobalStyle } from 'styled-components'
import { createCSSCustomProperties } from '../themes/defaultTheme'

export const GlobalStyles = createGlobalStyle`
  /* CSS Custom Properties for theming */
  :root {
    ${props => createCSSCustomProperties(props.theme)}
  }

  /* CSS Reset */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Base styles */
  html {
    height: 100%;
    font-size: 16px;
    line-height: 1.5;
  }

  body {
    height: 100%;
    font-family: var(--font-family-primary);
    color: var(--color-text-primary);
    background-color: var(--color-background);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: var(--font-weight-semibold, 600);
    line-height: var(--line-height-tight, 1.25);
    margin-bottom: var(--spacing-md);
    color: var(--color-text-primary);
  }

  h1 { font-size: var(--font-size-3xl); }
  h2 { font-size: var(--font-size-2xl); }
  h3 { font-size: var(--font-size-xl); }
  h4 { font-size: var(--font-size-lg); }
  h5 { font-size: var(--font-size-base); }
  h6 { font-size: var(--font-size-sm); }

  p {
    margin-bottom: var(--spacing-md);
    line-height: var(--line-height-normal, 1.5);
  }

  /* Links */
  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-primary-hover);
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: var(--border-radius-sm);
    }
  }

  /* Form elements */
  input, textarea, select, button {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Scrollbar styles */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--border-radius-full);
  }

  *::-webkit-scrollbar-thumb:hover {
    background: var(--color-secondary);
  }

  /* Print styles for PDF export */
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      background: white !important;
      color: black !important;
    }

    @page {
      margin: 0cm;
      size: A4;
    }

    .no-print {
      display: none !important;
    }

    .page-break-before {
      page-break-before: always;
    }

    .page-break-after {
      page-break-after: always;
    }

    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
  }

  /* Loading and transition styles */
  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .flex-row { flex-direction: row; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }

  .w-full { width: 100%; }
  .h-full { height: 100%; }

  /* Monaco Editor overrides */
  .monaco-editor {
    font-family: var(--font-family-monospace) !important;
  }

  .monaco-editor .margin {
    background-color: var(--color-surface) !important;
  }

  .monaco-editor .monaco-editor-background {
    background-color: var(--color-background) !important;
  }
`

export const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
`
