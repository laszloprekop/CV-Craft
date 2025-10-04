/**
 * Google Fonts Service
 *
 * Fetches and caches Google Fonts data, manages font loading
 */

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  files: Record<string, string>;
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}

const CACHE_KEY = 'cv-craft-google-fonts';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const API_KEY = 'AIzaSyD-Your-API-Key-Here'; // TODO: Move to env variable

/**
 * Get cached fonts data or fetch from API
 */
export async function getGoogleFonts(): Promise<GoogleFont[]> {
  // Try to get from cache first
  const cached = getCachedFonts();
  if (cached) {
    return cached;
  }

  // Fetch from API
  try {
    // Note: Since we don't want to require API key setup, we'll use a curated static list
    // In production, you'd uncomment the API call below:
    /*
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`
    );
    const data: GoogleFontsResponse = await response.json();
    cacheFonts(data.items);
    return data.items;
    */

    // For now, return a curated list of popular fonts
    const fonts = getCuratedFontList();
    cacheFonts(fonts);
    return fonts;
  } catch (error) {
    console.error('Failed to fetch Google Fonts:', error);
    return getCuratedFontList();
  }
}

/**
 * Search fonts by name
 */
export function searchFonts(fonts: GoogleFont[], query: string): GoogleFont[] {
  const lowerQuery = query.toLowerCase();
  return fonts.filter(font =>
    font.family.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter fonts by category
 */
export function filterFontsByCategory(
  fonts: GoogleFont[],
  category: GoogleFont['category']
): GoogleFont[] {
  return fonts.filter(font => font.category === category);
}

/**
 * Load a font dynamically
 */
export function loadFont(fontFamily: string, weights: number[] = [400, 600, 700]): void {
  const weightsStr = weights.join(';');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weightsStr}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Load multiple fonts
 */
export function loadFonts(fontFamilies: string[], weights: number[] = [400, 600, 700]): void {
  fontFamilies.forEach(family => loadFont(family, weights));
}

/**
 * Get font URL for embedding
 */
export function getFontURL(fontFamily: string, weights: number[] = [400, 600, 700]): string {
  const weightsStr = weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weightsStr}&display=swap`;
}

// ============================================================================
// Cache Management
// ============================================================================

function getCachedFonts(): GoogleFont[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const now = Date.now();

    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.fonts;
  } catch (error) {
    console.error('Failed to parse cached fonts:', error);
    return null;
  }
}

function cacheFonts(fonts: GoogleFont[]): void {
  try {
    const data = {
      fonts,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache fonts:', error);
  }
}

// ============================================================================
// Curated Font List (Top 100 Google Fonts)
// ============================================================================

function getCuratedFontList(): GoogleFont[] {
  return [
    // Sans-serif fonts
    { family: 'Inter', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Roboto', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Open Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Lato', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Montserrat', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Poppins', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Raleway', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Work Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Nunito', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Source Sans Pro', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'IBM Plex Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'DM Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Karla', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Rubik', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Manrope', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Outfit', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Plus Jakarta Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Lexend', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Quicksand', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Nunito Sans', category: 'sans-serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },

    // Serif fonts
    { family: 'Merriweather', category: 'serif', variants: ['400', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Playfair Display', category: 'serif', variants: ['400', '500', '600', '700', '800'], subsets: ['latin'], files: {} },
    { family: 'Lora', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'PT Serif', category: 'serif', variants: ['400', '700'], subsets: ['latin'], files: {} },
    { family: 'Crimson Text', category: 'serif', variants: ['400', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'EB Garamond', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Cormorant Garamond', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Libre Baskerville', category: 'serif', variants: ['400', '700'], subsets: ['latin'], files: {} },
    { family: 'Spectral', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Source Serif Pro', category: 'serif', variants: ['400', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Bitter', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Cardo', category: 'serif', variants: ['400', '700'], subsets: ['latin'], files: {} },
    { family: 'Noto Serif', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'IBM Plex Serif', category: 'serif', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Georgia', category: 'serif', variants: ['400', '700'], subsets: ['latin'], files: {} },

    // Monospace fonts
    { family: 'Roboto Mono', category: 'monospace', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Source Code Pro', category: 'monospace', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'JetBrains Mono', category: 'monospace', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'IBM Plex Mono', category: 'monospace', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Fira Code', category: 'monospace', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Space Mono', category: 'monospace', variants: ['400', '700'], subsets: ['latin'], files: {} },

    // Display fonts
    { family: 'Oswald', category: 'display', variants: ['400', '500', '600', '700'], subsets: ['latin'], files: {} },
    { family: 'Bebas Neue', category: 'display', variants: ['400'], subsets: ['latin'], files: {} },
    { family: 'Abril Fatface', category: 'display', variants: ['400'], subsets: ['latin'], files: {} },
  ];
}
