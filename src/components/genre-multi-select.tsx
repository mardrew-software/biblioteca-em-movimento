'use client';

import { useState } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';

interface GenreMultiSelectProps {
  availableGenres: string[];
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

export function GenreMultiSelect({ availableGenres, selectedGenres, onChange }: GenreMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newGenre, setNewGenre] = useState('');

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter(g => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  const addNewGenre = () => {
    const trimmed = newGenre.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      onChange([...selectedGenres, trimmed]);
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    onChange(selectedGenres.filter(g => g !== genre));
  };

  // Filter out already selected genres from available list
  const unselectedAvailableGenres = availableGenres.filter(g => !selectedGenres.includes(g));

  return (
    <div className="relative">
      {/* Selected genres tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedGenres.map(genre => (
          <span
            key={genre}
            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
          >
            {genre}
            <button
              type="button"
              onClick={() => removeGenre(genre)}
              className="hover:text-orange-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4e00] focus:border-transparent"
      >
        <span className="text-gray-500">
          {selectedGenres.length > 0 ? `${selectedGenres.length} gênero(s) selecionado(s)` : 'Selecione ou adicione gêneros'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Add new genre input */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewGenre();
                  }
                }}
                placeholder="Novo gênero..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4e00] focus:border-transparent"
              />
              <button
                type="button"
                onClick={addNewGenre}
                disabled={!newGenre.trim()}
                className="px-3 py-1.5 bg-[#ff4e00] text-white text-sm rounded-md hover:bg-[#e64500] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Available genres list */}
          {unselectedAvailableGenres.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              {availableGenres.length === 0 ? 'Nenhum gênero disponível' : 'Todos os gêneros já selecionados'}
            </div>
          ) : (
            <div className="p-1">
              {unselectedAvailableGenres.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#ff4e00] rounded-md transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
