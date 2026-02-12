import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProfilePhoto } from '../useProfilePhoto'
import type { CVInstance } from '../../../../shared/types'

// Mock the API module
vi.mock('../../services/api', () => ({
  assetApi: {
    get: vi.fn(),
    getFileUrl: vi.fn(),
  },
}))

import { assetApi } from '../../services/api'

const mockGet = vi.mocked(assetApi.get)
const mockGetFileUrl = vi.mocked(assetApi.getFileUrl)

function createCv(overrides: Partial<CVInstance> = {}): CVInstance {
  return {
    id: 'cv-1',
    name: 'Test CV',
    content: '# Test',
    template_id: 'default-modern',
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  } as CVInstance
}

describe('useProfilePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when cv is null', () => {
    const { result } = renderHook(() => useProfilePhoto(null))
    expect(result.current).toBeNull()
  })

  it('returns null when cv has no photo_asset_id', () => {
    const cv = createCv({ photo_asset_id: undefined })
    const { result } = renderHook(() => useProfilePhoto(cv))
    expect(result.current).toBeNull()
  })

  it('loads photo URL when cv has photo_asset_id', async () => {
    const mockAsset = { id: 'asset-1', filename: 'photo.jpg' }
    mockGet.mockResolvedValue({ data: mockAsset } as any)
    mockGetFileUrl.mockReturnValue('/api/assets/asset-1/file')

    const cv = createCv({ photo_asset_id: 'asset-1' })
    const { result } = renderHook(() => useProfilePhoto(cv))

    await waitFor(() => {
      expect(result.current).toBe('/api/assets/asset-1/file')
    })

    expect(mockGet).toHaveBeenCalledWith('asset-1')
    expect(mockGetFileUrl).toHaveBeenCalledWith(mockAsset)
  })

  it('resets to null when photo_asset_id changes to undefined', async () => {
    const mockAsset = { id: 'asset-1', filename: 'photo.jpg' }
    mockGet.mockResolvedValue({ data: mockAsset } as any)
    mockGetFileUrl.mockReturnValue('/api/assets/asset-1/file')

    const cv = createCv({ photo_asset_id: 'asset-1' })
    const { result, rerender } = renderHook(
      ({ cv }) => useProfilePhoto(cv),
      { initialProps: { cv } },
    )

    await waitFor(() => {
      expect(result.current).toBe('/api/assets/asset-1/file')
    })

    // Remove photo
    const cvNoPhoto = createCv({ photo_asset_id: undefined })
    rerender({ cv: cvNoPhoto })

    expect(result.current).toBeNull()
  })

  it('handles API errors gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGet.mockRejectedValue(new Error('Network error'))

    const cv = createCv({ photo_asset_id: 'asset-1' })
    const { result } = renderHook(() => useProfilePhoto(cv))

    // Should remain null on error (no crash)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('asset-1')
    })
    expect(result.current).toBeNull()
  })
})
