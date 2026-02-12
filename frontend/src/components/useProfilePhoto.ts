/**
 * Hook to load a profile photo from an asset when cv.photo_asset_id changes.
 * Extracted from CVPreview for independent testability.
 */

import { useState, useEffect } from 'react'
import { assetApi } from '../services/api'
import type { CVInstance } from '../../../shared/types'

export function useProfilePhoto(cv: CVInstance | null) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    // Reset immediately to avoid stale photo URL
    setPhotoUrl(null)

    // If no photo_asset_id, nothing to load
    if (!cv?.photo_asset_id) {
      return
    }

    // Load asynchronously without blocking render
    const loadPhoto = async () => {
      try {
        const response = await assetApi.get(cv.photo_asset_id!)
        const photoAsset = response.data
        const url = assetApi.getFileUrl(photoAsset)
        setPhotoUrl(url)
      } catch (error) {
        console.error('[CVPreview] Failed to load profile photo:', error)
      }
    }

    loadPhoto()
  }, [cv?.photo_asset_id])

  return photoUrl
}
