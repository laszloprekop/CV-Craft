/**
 * Hook to calculate A4 page break positions for the preview page markers.
 * Extracted from CVPreview for independent testability.
 */

import { useState, useEffect, type RefObject } from 'react'

const A4_HEIGHT_MM = 297
const PAGE_MARGIN_MM = 20

export function usePageBreaks(
  contentRef: RefObject<HTMLDivElement | null>,
  pageMarkersVisible: boolean,
  previewMode: string,
  deps: unknown[] = [],
) {
  const [pageBreaks, setPageBreaks] = useState<number[]>([])

  useEffect(() => {
    if (!pageMarkersVisible || previewMode !== 'html' || !contentRef.current) {
      setPageBreaks([])
      return
    }

    const calculatePageBreaks = () => {
      if (!contentRef.current) return

      const contentElement = contentRef.current
      const contentHeight = contentElement.scrollHeight

      // Convert mm to pixels (assuming 96 DPI standard)
      // 1mm = 3.7795275591 pixels at 96 DPI
      const MM_TO_PX = 3.7795275591
      const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX
      const marginPx = PAGE_MARGIN_MM * MM_TO_PX
      const contentAreaHeightPx = pageHeightPx - 2 * marginPx

      const breaks: number[] = []
      let currentPosition = contentAreaHeightPx

      while (currentPosition < contentHeight) {
        breaks.push(currentPosition)
        currentPosition += contentAreaHeightPx
      }

      setPageBreaks(breaks)
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      setTimeout(calculatePageBreaks, 100)
    })

    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageMarkersVisible, previewMode, ...deps])

  return pageBreaks
}
