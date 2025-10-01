import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styled from 'styled-components'

const UploaderButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;

  &:hover {
    background-color: var(--color-surface);
  }
`

interface AssetUploaderProps {
  onUpload: (file: File) => void
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    },
    multiple: false
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <UploaderButton type="button">
        📷 {isDragActive ? 'Drop photo here' : 'Upload Photo'}
      </UploaderButton>
    </div>
  )
}