import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageBreaks } from '../usePageBreaks'

// Mock requestAnimationFrame / cancelAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  const id = setTimeout(() => cb(0), 0)
  return id as unknown as number
})
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))

function createMockRef(scrollHeight = 0): React.RefObject<HTMLDivElement | null> {
  return {
    current: scrollHeight > 0
      ? ({ scrollHeight } as HTMLDivElement)
      : null,
  }
}

describe('usePageBreaks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns empty array when page markers are not visible', () => {
    const ref = createMockRef(2000)
    const { result } = renderHook(() =>
      usePageBreaks(ref, false, 'html'),
    )
    expect(result.current).toEqual([])
  })

  it('returns empty array when preview mode is not html', () => {
    const ref = createMockRef(2000)
    const { result } = renderHook(() =>
      usePageBreaks(ref, true, 'exact-pdf'),
    )
    expect(result.current).toEqual([])
  })

  it('returns empty array when ref is null', () => {
    const ref = createMockRef(0) // null current
    const { result } = renderHook(() =>
      usePageBreaks(ref, true, 'html'),
    )
    expect(result.current).toEqual([])
  })

  it('calculates page breaks for tall content', async () => {
    // A4 height = 297mm, margin = 20mm, content area = 257mm
    // 1mm = 3.7795275591px, so content area = ~971.1px
    const contentAreaPx = (297 - 40) * 3.7795275591 // ~971.1px
    const scrollHeight = contentAreaPx * 3 // 3 pages worth

    const ref = createMockRef(scrollHeight)
    const { result } = renderHook(() =>
      usePageBreaks(ref, true, 'html'),
    )

    // Advance timers to trigger RAF + setTimeout
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Should have 2 page breaks (at end of page 1 and page 2)
    expect(result.current.length).toBe(2)
    expect(result.current[0]).toBeCloseTo(contentAreaPx, 0)
    expect(result.current[1]).toBeCloseTo(contentAreaPx * 2, 0)
  })

  it('returns empty array for content shorter than one page', async () => {
    const contentAreaPx = (297 - 40) * 3.7795275591
    const scrollHeight = contentAreaPx * 0.5 // Half a page

    const ref = createMockRef(scrollHeight)
    const { result } = renderHook(() =>
      usePageBreaks(ref, true, 'html'),
    )

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toEqual([])
  })

  it('recalculates when deps change', async () => {
    const contentAreaPx = (297 - 40) * 3.7795275591
    const ref = createMockRef(contentAreaPx * 2)

    let dep = 'initial'
    const { result, rerender } = renderHook(() =>
      usePageBreaks(ref, true, 'html', [dep]),
    )

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.length).toBe(1)

    // Change dep to trigger recalculation
    dep = 'changed'
    rerender()

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Still 1 break (content didn't change)
    expect(result.current.length).toBe(1)
  })
})
