// Color model conversion utilities
// Internal representation is always #rrggbb hex. These convert to/from display formats.

export type ColorModel = 'hex' | 'rgb' | 'hsl' | 'oklch';

export const COLOR_MODELS: { value: ColorModel; label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'oklch', label: 'OKLCH' },
];

/* ── Hex ↔ RGB ── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
}

/* ── RGB ↔ HSL ── */

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

/* ── RGB ↔ OKLCH (via OKLab) ── */

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  // sRGB → linear RGB
  const lr = linearize(r / 255);
  const lg = linearize(g / 255);
  const lb = linearize(b / 255);

  // Linear RGB → LMS (using OKLab matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m_);
  const s3 = Math.cbrt(s_);

  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bLab = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = Math.atan2(bLab, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return [
    Math.round(L * 1000) / 1000,
    Math.round(C * 1000) / 1000,
    Math.round(H * 10) / 10,
  ];
}

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = H * (Math.PI / 180);
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l3 = L + 0.3963377774 * a + 0.2158037573 * b;
  const m3 = L - 0.1055613458 * a - 0.0638541728 * b;
  const s3 = L - 0.0894841775 * a - 1.2914855480 * b;

  const l_ = l3 * l3 * l3;
  const m_ = m3 * m3 * m3;
  const s_ = s3 * s3 * s3;

  const lr = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  return [
    Math.max(0, Math.min(255, Math.round(delinearize(lr) * 255))),
    Math.max(0, Math.min(255, Math.round(delinearize(lg) * 255))),
    Math.max(0, Math.min(255, Math.round(delinearize(lb) * 255))),
  ];
}

/* ── Public API ── */

/** Convert internal hex value to a display string for the given model */
export function hexToDisplay(hex: string, model: ColorModel): string {
  const [r, g, b] = hexToRgb(hex);
  switch (model) {
    case 'hex':
      return hex;
    case 'rgb':
      return `${r}, ${g}, ${b}`;
    case 'hsl': {
      const [h, s, l] = rgbToHsl(r, g, b);
      return `${h}, ${s}%, ${l}%`;
    }
    case 'oklch': {
      const [L, C, H] = rgbToOklch(r, g, b);
      return `${L} ${C} ${H}`;
    }
  }
}

/** Parse a display string in the given model back to hex. Returns null if invalid. */
export function displayToHex(input: string, model: ColorModel): string | null {
  const s = input.trim();
  switch (model) {
    case 'hex': {
      if (/^#?[0-9a-fA-F]{6}$/.test(s)) {
        return s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;
      }
      if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
        const h = s.replace('#', '');
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
      }
      return null;
    }
    case 'rgb': {
      const m = s.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
      if (!m) return null;
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      if (r > 255 || g > 255 || b > 255) return null;
      return rgbToHex(r, g, b);
    }
    case 'hsl': {
      const m = s.match(/^(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?$/);
      if (!m) return null;
      const [h, sat, l] = [+m[1], +m[2], +m[3]];
      if (h > 360 || sat > 100 || l > 100) return null;
      const [r, g, b] = hslToRgb(h, sat, l);
      return rgbToHex(r, g, b);
    }
    case 'oklch': {
      const m = s.match(/^([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)$/);
      if (!m) return null;
      const [L, C, H] = [+m[1], +m[2], +m[3]];
      if (L > 1 || C > 0.5 || H > 360) return null;
      const [r, g, b] = oklchToRgb(L, C, H);
      return rgbToHex(r, g, b);
    }
  }
}

/** Placeholder text for each model */
export function modelPlaceholder(model: ColorModel): string {
  switch (model) {
    case 'hex': return '#000000';
    case 'rgb': return '0, 0, 0';
    case 'hsl': return '0, 0%, 0%';
    case 'oklch': return '0 0 0';
  }
}
