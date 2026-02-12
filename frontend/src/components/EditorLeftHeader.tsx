/**
 * Left Header for CV Editor
 * Contains: CV Manager Icon, Import/Export, Profile Photo Picker
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  List,
  FileArrowDown,
  FileArrowUp,
  Image as ImageIcon,
  CaretDown,
  Trash,
  X as XIcon,
  Check
} from '@phosphor-icons/react'
import { assetApi } from '../services/api'
import type { Asset } from '../../../shared/types'

interface EditorLeftHeaderProps {
  cvName?: string
  onImportMarkdown?: (content: string, filename: string) => void
  onExportMarkdown?: () => void
  onPhotoUpload?: (file: File) => void
  onPhotoSelect?: (assetId: string | null) => void
  currentPhotoAssetId?: string
}

export const EditorLeftHeader: React.FC<EditorLeftHeaderProps> = ({
  cvName,
  onImportMarkdown,
  onExportMarkdown,
  onPhotoUpload,
  onPhotoSelect,
  currentPhotoAssetId
}) => {
  const navigate = useNavigate()
  const markdownInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<Asset[] | null>(null)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setConfirmDeleteId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch existing photos on first dropdown open
  const fetchPhotos = useCallback(async () => {
    if (existingPhotos !== null) return // already cached
    setLoadingPhotos(true)
    try {
      const response = await assetApi.list({ file_type: 'image', limit: 100 })
      setExistingPhotos(response.data)
    } catch (error) {
      console.error('Failed to load existing photos:', error)
      setExistingPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }, [existingPhotos])

  const handleDropdownToggle = () => {
    const opening = !dropdownOpen
    setDropdownOpen(opening)
    setConfirmDeleteId(null)
    if (opening) {
      fetchPhotos()
    }
  }

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

  const handleUploadNewClick = () => {
    photoInputRef.current?.click()
    setDropdownOpen(false)
  }

  const handlePhotoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onPhotoUpload) return

    onPhotoUpload(file)
    // Invalidate cache so next open refetches
    setExistingPhotos(null)

    // Reset input
    event.target.value = ''
  }

  const handleSelectExisting = (assetId: string) => {
    onPhotoSelect?.(assetId)
    setDropdownOpen(false)
  }

  const handleRemovePhoto = () => {
    onPhotoSelect?.(null)
    setDropdownOpen(false)
  }

  const handleDeletePhoto = async (id: string) => {
    try {
      await assetApi.delete(id)
      setExistingPhotos(prev => prev ? prev.filter(p => p.id !== id) : prev)
      // If the deleted photo was the current CV's photo, unlink it
      if (currentPhotoAssetId === id) {
        onPhotoSelect?.(null)
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
    }
    setConfirmDeleteId(null)
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

      {/* Photo Picker Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={handleDropdownToggle}
          title="Profile photo"
          className="flex items-center gap-1 px-1.5 py-1 text-xs border border-border rounded bg-transparent text-text-primary hover:bg-background hover:border-primary transition-all duration-150"
        >
          <ImageIcon size={14} />
          Photo
          <CaretDown size={10} weight="bold" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded shadow-lg z-50 overflow-hidden">
            {/* Upload new */}
            <button
              onClick={handleUploadNewClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors text-text-primary"
            >
              <ImageIcon size={14} />
              <span>Upload new photo...</span>
            </button>

            {/* Remove photo (only if current CV has one) */}
            {currentPhotoAssetId && (
              <button
                onClick={handleRemovePhoto}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-background transition-colors text-error"
              >
                <XIcon size={14} weight="bold" />
                <span>Remove photo</span>
              </button>
            )}

            {/* Existing photos grid */}
            <div className="h-px bg-border" />

            {loadingPhotos ? (
              <div className="px-3 py-3 text-xs text-text-secondary text-center">
                Loading photos...
              </div>
            ) : existingPhotos && existingPhotos.length > 0 ? (
              <div className="p-2 grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                {existingPhotos.map(photo => (
                  <div key={photo.id} className="relative group">
                    {confirmDeleteId === photo.id ? (
                      /* Delete confirmation */
                      <div className="w-12 h-12 rounded border border-error flex flex-col items-center justify-center gap-0.5 bg-surface">
                        <span className="text-[9px] text-error">Delete?</span>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="px-1 py-0.5 text-[9px] bg-error text-text-inverse rounded hover:opacity-90"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1 py-0.5 text-[9px] border border-border rounded hover:bg-background"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelectExisting(photo.id)}
                          title={photo.filename}
                          className={`w-12 h-12 rounded overflow-hidden border-2 transition-all duration-150 hover:border-primary ${
                            currentPhotoAssetId === photo.id
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                        >
                          <img
                            src={assetApi.getFileUrl(photo)}
                            alt={photo.filename}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        {/* Delete button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDeleteId(photo.id)
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-text-inverse flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete photo"
                        >
                          <Trash size={10} weight="bold" />
                        </button>
                        {/* Selection indicator */}
                        {currentPhotoAssetId === photo.id && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl bg-primary text-text-inverse flex items-center justify-center">
                            <Check size={10} weight="bold" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : existingPhotos && existingPhotos.length === 0 ? (
              <div className="px-3 py-3 text-xs text-text-secondary text-center">
                No photos uploaded yet
              </div>
            ) : null}
          </div>
        )}
      </div>

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