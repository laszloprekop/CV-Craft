/**
 * Left Header for CV Editor
 * Contains: CV Manager Icon, Import/Export, Profile Photo Upload
 */

import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  List, 
  FileArrowDown, 
  FileArrowUp, 
  Image as ImageIcon 
} from '@phosphor-icons/react'

interface EditorLeftHeaderProps {
  cvName?: string
  onImportMarkdown?: (content: string, filename: string) => void
  onExportMarkdown?: () => void
  onPhotoUpload?: (file: File) => void
}

export const EditorLeftHeader: React.FC<EditorLeftHeaderProps> = ({
  cvName,
  onImportMarkdown,
  onExportMarkdown,
  onPhotoUpload
}) => {
  const navigate = useNavigate()
  const markdownInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handleCVManagerClick = () => {
    navigate('/')
  }

  const handleImportClick = () => {
    markdownInputRef.current?.click()
  }

  const handleMarkdownFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onImportMarkdown) return

    try {
      const content = await file.text()
      onImportMarkdown(content, file.name)
    } catch (error) {
      console.error('Failed to read markdown file:', error)
    }

    // Reset input
    event.target.value = ''
  }

  const handlePhotoClick = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onPhotoUpload) return

    onPhotoUpload(file)

    // Reset input
    event.target.value = ''
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface">
      <button 
        onClick={handleCVManagerClick} 
        title="CV Manager"
        className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
      >
        <List size={14} />
        CVs
      </button>

      <div className="w-px h-4 bg-border mx-0.5" />

      <button 
        onClick={handleImportClick} 
        title="Import Markdown file"
        className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
      >
        <FileArrowDown size={14} />
        Import
      </button>

      <button 
        onClick={onExportMarkdown} 
        title="Export as Markdown"
        className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
      >
        <FileArrowUp size={14} />
        Export
      </button>

      <div className="w-px h-4 bg-border mx-0.5" />

      <button 
        onClick={handlePhotoClick} 
        title="Upload profile photo"
        className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
      >
        <ImageIcon size={14} />
        Photo
      </button>

      <input
        ref={markdownInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleMarkdownFileSelect}
        className="hidden"
      />

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileSelect}
        className="hidden"
      />
    </div>
  )
}