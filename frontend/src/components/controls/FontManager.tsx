/**
 * Font Manager Component
 *
 * Allows users to add/remove Google Fonts from their curated list
 */

import React, { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Trash } from '@phosphor-icons/react';
import { useGoogleFonts } from '../../hooks/useGoogleFonts';
import { searchFonts, filterFontsByCategory, type GoogleFont } from '../../services/GoogleFontsService';

interface FontManagerProps {
  availableFonts: string[]; // User's curated list
  onAdd: (fontFamily: string) => void;
  onRemove: (fontFamily: string) => void;
}

export const FontManager: React.FC<FontManagerProps> = ({
  availableFonts,
  onAdd,
  onRemove,
}) => {
  const { fonts, loading } = useGoogleFonts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoogleFont['category'] | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredFonts = useMemo(() => {
    let result = fonts;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = filterFontsByCategory(result, selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      result = searchFonts(result, searchQuery);
    }

    // Exclude already added fonts
    result = result.filter(font => !availableFonts.includes(font.family));

    return result.slice(0, 50); // Limit to 50 results
  }, [fonts, searchQuery, selectedCategory, availableFonts]);

  if (loading) {
    return <div className="text-xs text-text-secondary">Loading fonts...</div>;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-text-primary">
          Font Library
        </label>
        <button
          onClick={() => setShowAddDialog(!showAddDialog)}
          className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus size={12} weight="bold" />
          Add Font
        </button>
      </div>

      {/* User's curated font list */}
      <div className="border border-border rounded p-2 mb-2 max-h-32 overflow-y-auto">
        {availableFonts.length === 0 ? (
          <p className="text-xs text-text-muted">No fonts added yet. Click "Add Font" to get started.</p>
        ) : (
          <div className="space-y-1">
            {availableFonts.map((fontFamily) => (
              <div
                key={fontFamily}
                className="flex items-center justify-between py-1 px-2 hover:bg-surface rounded group"
              >
                <span className="text-xs" style={{ fontFamily }}>
                  {fontFamily}
                </span>
                <button
                  onClick={() => onRemove(fontFamily)}
                  className="opacity-0 group-hover:opacity-100 text-error hover:text-error/80 transition-opacity"
                  title="Remove font"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Font Dialog */}
      {showAddDialog && (
        <div className="border border-border rounded p-2 bg-surface">
          <div className="mb-2">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-7 pr-2 py-1 text-xs border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1 mb-2 flex-wrap">
            {(['all', 'sans-serif', 'serif', 'monospace', 'display'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[10px] px-2 py-0.5 rounded ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-background text-text-secondary hover:bg-surface'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredFonts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                {searchQuery ? 'No fonts found' : 'All fonts added'}
              </p>
            ) : (
              filteredFonts.map((font) => (
                <div
                  key={font.family}
                  className="flex items-center justify-between py-1 px-2 hover:bg-background rounded group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ fontFamily: font.family }}>
                      {font.family}
                    </div>
                    <div className="text-[10px] text-text-muted">{font.category}</div>
                  </div>
                  <button
                    onClick={() => {
                      onAdd(font.family);
                      setSearchQuery('');
                    }}
                    className="text-primary hover:text-primary/80 flex-shrink-0 ml-2"
                    title="Add font"
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-text-muted mt-1">
        Add fonts to your library to use them in your CV. Only added fonts will appear in font selectors.
      </p>
    </div>
  );
};
