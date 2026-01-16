import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface FontOption {
  value: string;
  label: string;
  category: 'Sans Serif' | 'Serif' | 'Monospace' | 'Display';
  isGoogleFont?: boolean;
}

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  fontType?: 'heading' | 'body' | 'monospace';
  availableFonts?: string[];
}

// Comprehensive font list with popular Google Fonts for CVs
export const FONT_OPTIONS: FontOption[] = [
  // System Fonts
  { value: 'Inter, system-ui, sans-serif', label: 'Inter', category: 'Sans Serif' },
  { value: 'Arial, sans-serif', label: 'Arial', category: 'Sans Serif' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica', category: 'Sans Serif' },
  { value: 'Georgia, serif', label: 'Georgia', category: 'Serif' },
  { value: '"Times New Roman", serif', label: 'Times New Roman', category: 'Serif' },
  { value: 'Courier New, monospace', label: 'Courier New', category: 'Monospace' },

  // Google Fonts - Sans Serif (Professional/Business)
  { value: '"Roboto", sans-serif', label: 'Roboto', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Open Sans", sans-serif', label: 'Open Sans', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Lato", sans-serif', label: 'Lato', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Montserrat", sans-serif', label: 'Montserrat', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Poppins", sans-serif', label: 'Poppins', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Raleway", sans-serif', label: 'Raleway', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Work Sans", sans-serif', label: 'Work Sans', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Nunito", sans-serif', label: 'Nunito', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro', category: 'Sans Serif', isGoogleFont: true },
  { value: '"IBM Plex Sans", sans-serif', label: 'IBM Plex Sans', category: 'Sans Serif', isGoogleFont: true },
  { value: '"DM Sans", sans-serif', label: 'DM Sans', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Karla", sans-serif', label: 'Karla', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Rubik", sans-serif', label: 'Rubik', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Manrope", sans-serif', label: 'Manrope', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Outfit", sans-serif', label: 'Outfit', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Inter Tight", sans-serif', label: 'Inter Tight', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Plus Jakarta Sans", sans-serif', label: 'Plus Jakarta Sans', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Lexend", sans-serif', label: 'Lexend', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Quicksand", sans-serif', label: 'Quicksand', category: 'Sans Serif', isGoogleFont: true },
  { value: '"Nunito Sans", sans-serif', label: 'Nunito Sans', category: 'Sans Serif', isGoogleFont: true },

  // Google Fonts - Serif (Classic/Elegant/Calm)
  { value: '"Merriweather", serif', label: 'Merriweather', category: 'Serif', isGoogleFont: true },
  { value: '"Playfair Display", serif', label: 'Playfair Display', category: 'Serif', isGoogleFont: true },
  { value: '"Lora", serif', label: 'Lora', category: 'Serif', isGoogleFont: true },
  { value: '"PT Serif", serif', label: 'PT Serif', category: 'Serif', isGoogleFont: true },
  { value: '"Crimson Text", serif', label: 'Crimson Text', category: 'Serif', isGoogleFont: true },
  { value: '"EB Garamond", serif', label: 'EB Garamond', category: 'Serif', isGoogleFont: true },
  { value: '"Cormorant Garamond", serif', label: 'Cormorant Garamond', category: 'Serif', isGoogleFont: true },
  { value: '"Libre Baskerville", serif', label: 'Libre Baskerville', category: 'Serif', isGoogleFont: true },
  { value: '"Spectral", serif', label: 'Spectral', category: 'Serif', isGoogleFont: true },
  { value: '"Source Serif Pro", serif', label: 'Source Serif Pro', category: 'Serif', isGoogleFont: true },
  { value: '"Bitter", serif', label: 'Bitter', category: 'Serif', isGoogleFont: true },
  { value: '"Cardo", serif', label: 'Cardo', category: 'Serif', isGoogleFont: true },
  { value: '"Noto Serif", serif', label: 'Noto Serif', category: 'Serif', isGoogleFont: true },
  { value: '"IBM Plex Serif", serif', label: 'IBM Plex Serif', category: 'Serif', isGoogleFont: true },

  // Google Fonts - Monospace (Technical CVs)
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono', category: 'Monospace', isGoogleFont: true },
  { value: '"Source Code Pro", monospace', label: 'Source Code Pro', category: 'Monospace', isGoogleFont: true },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono', category: 'Monospace', isGoogleFont: true },
  { value: '"IBM Plex Mono", monospace', label: 'IBM Plex Mono', category: 'Monospace', isGoogleFont: true },
  { value: '"Fira Code", monospace', label: 'Fira Code', category: 'Monospace', isGoogleFont: true },
  { value: '"Space Mono", monospace', label: 'Space Mono', category: 'Monospace', isGoogleFont: true },

  // Google Fonts - Display (Modern/Creative - use sparingly for CVs)
  { value: '"Oswald", sans-serif', label: 'Oswald', category: 'Display', isGoogleFont: true },
  { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue', category: 'Display', isGoogleFont: true },
  { value: '"Abril Fatface", serif', label: 'Abril Fatface', category: 'Display', isGoogleFont: true },
];

// Get Google Fonts URL for all fonts
export const getGoogleFontsUrl = () => {
  const googleFonts = FONT_OPTIONS
    .filter(f => f.isGoogleFont)
    .map(f => f.label.replace(/\s+/g, '+'))
    .join('|');

  return `https://fonts.googleapis.com/css2?family=${googleFonts}&display=swap`;
};

export const FontSelector: React.FC<FontSelectorProps> = ({
  label,
  value,
  onChange,
  description,
  fontType = 'body'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter fonts based on search and font type
  const filteredFonts = FONT_OPTIONS.filter(font => {
    const matchesSearch = font.label.toLowerCase().includes(searchQuery.toLowerCase());

    // Recommend appropriate fonts based on type
    if (fontType === 'heading') {
      return matchesSearch; // All fonts can be used for headings
    } else if (fontType === 'monospace') {
      return matchesSearch && font.category === 'Monospace';
    } else {
      // For body, prefer readable fonts (exclude Display fonts for better readability)
      return matchesSearch && font.category !== 'Display';
    }
  });

  // Group fonts by category
  const groupedFonts = filteredFonts.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {} as Record<string, FontOption[]>);

  // Find current font label
  const currentFont = FONT_OPTIONS.find(f => f.value === value);
  const currentLabel = currentFont?.label || value.split(',')[0].replace(/['"]/g, '');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (fontValue: string) => {
    onChange(fontValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="mb-4" ref={dropdownRef}>
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}

      {/* Selected font display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary flex items-center justify-between hover:bg-surface"
      >
        <span style={{ fontFamily: value }}>{currentLabel}</span>
        <MagnifyingGlass size={16} className="text-gray-500" />
      </button>

      {/* Dropdown with search */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border sticky top-0 bg-background">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Font list */}
          <div className="overflow-y-auto max-h-80">
            {Object.keys(groupedFonts).length === 0 ? (
              <div className="p-4 text-sm text-text-secondary text-center">
                No fonts found
              </div>
            ) : (
              Object.entries(groupedFonts).map(([category, fonts]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-semibold text-text-secondary bg-surface sticky top-0">
                    {category}
                  </div>
                  {fonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => handleSelect(font.value)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center justify-between ${
                        value === font.value ? 'bg-primary/10 text-primary' : 'text-text-primary'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      <span>{font.label}</span>
                      {font.isGoogleFont && (
                        <span className="text-xs text-text-secondary">Google</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
