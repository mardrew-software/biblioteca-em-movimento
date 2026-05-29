'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/book-card';
import { RentModal } from '@/components/rent-modal';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { Book, Rental } from '@/lib/google-sheets';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rentingBook, setRentingBook] = useState<Book | null>(null);

  // Genre filter state
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
      }
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique genres from books
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    books.forEach(book => {
      book.genres.forEach(genre => {
        if (genre && genre.trim()) {
          genres.add(genre.trim());
        }
      });
    });
    const result = Array.from(genres).sort();
    console.log('[Genre Filter] Available genres:', result);
    return result;
  }, [books]);

  const filteredBooks = useMemo(() => {
    console.log('[Genre Filter] Selected genres:', selectedGenres);
    console.log('[Genre Filter] Total books:', books.length);

    const filtered = books.filter(book => {
      // Text search
      const matchesSearch = !search.trim() ||
        book.filter.includes(search.toLowerCase()) ||
        book.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));

      // Genre filter
      const matchesGenres = selectedGenres.length === 0 ||
        selectedGenres.some(genre => book.genres.includes(genre));

      return matchesSearch && matchesGenres;
    });

    console.log('[Genre Filter] Filtered books:', filtered.length);
    return filtered;
  }, [books, search, selectedGenres]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearGenreFilter = () => {
    setSelectedGenres([]);
  };

  const handleRent = async (rentalData: {
    name: string;
    email: string;
    date: string;
    returnDate: string;
  }) => {
    if (!rentingBook) return;

    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowId: rentingBook.rowId,
          rental: {
            ...rentalData,
            status: 'RENTED',
          },
        }),
      });

      if (res.ok) {
        await fetchBooks();
        setRentingBook(null);
        alert('Livro alugado com sucesso!');
      } else {
        throw new Error('Erro ao alugar livro');
      }
    } catch (error) {
      console.error('Erro ao alugar livro:', error);
      alert('Erro ao alugar livro. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4e00]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search and Filter Section */}
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex w-3/4">
          <Input
            type="text"
            placeholder="Buscar por título, autor, ISBN ou gênero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Genre Filter Dropdown */}
        <div className="w-1/4">
          <button
            onClick={() => setShowGenreFilter(!showGenreFilter)}
            className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">filtrar por gênero</span>
            {selectedGenres.length > 0 && (
              <span className="bg-[#ff4e00] text-white text-xs px-2 py-0.5 rounded-full">
                {selectedGenres.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showGenreFilter ? 'rotate-180' : ''}`} />
          </button>

          {/* Genre Filter Dropdown Panel */}
          {showGenreFilter && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Selecionar Gêneros</span>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={clearGenreFilter}
                    className="text-xs text-[#ff4e00] hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="p-2">
                {allGenres.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum gênero encontrado</p>
                ) : (
                  allGenres.map((genre) => (
                    <label
                      key={genre}
                      className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                        className="w-4 h-4 rounded border-gray-300 text-[#ff4e00] focus:ring-[#ff4e00]"
                      />
                      <span className="text-sm text-gray-700">{genre}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'} encontrado
        {filteredBooks.length !== 1 ? 's' : ''}
        {selectedGenres.length > 0 && ` • Filtrando por: ${selectedGenres.join(', ')}`}
      </p>

      {/* Books List */}
      <div className="flex flex-col gap-4 mt-4">
        {filteredBooks.map((book) => (
          <BookCard
            key={book.rowId}
            book={book}
            onRent={setRentingBook}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg text-gray-500">nenhum livro encontrado</h3>
        </div>
      )}

      {rentingBook && (
        <RentModal
          book={rentingBook}
          onClose={() => setRentingBook(null)}
          onRent={handleRent}
        />
      )}
    </div>
  );
}
