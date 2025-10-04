/**
 * useGoogleFonts Hook
 *
 * React hook for managing Google Fonts
 */

import { useState, useEffect } from 'react';
import { getGoogleFonts, loadFonts, type GoogleFont } from '../services/GoogleFontsService';

export function useGoogleFonts() {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchFonts() {
      try {
        const fontList = await getGoogleFonts();
        if (mounted) {
          setFonts(fontList);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load fonts');
          setLoading(false);
        }
      }
    }

    fetchFonts();

    return () => {
      mounted = false;
    };
  }, []);

  return { fonts, loading, error };
}

/**
 * Load specific fonts dynamically
 */
export function useLoadFonts(fontFamilies: string[]) {
  useEffect(() => {
    if (fontFamilies.length > 0) {
      loadFonts(fontFamilies);
    }
  }, [fontFamilies.join(',')]);
}
