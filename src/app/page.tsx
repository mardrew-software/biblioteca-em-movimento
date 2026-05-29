'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/book-card';
import { RentModal } from '@/components/rent-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenreMultiSelect } from '@/components/genre-multi-select';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { Search, Filter, X, ChevronDown, Plus, Eye } from 'lucide-react';
import type { Book, Rental } from '@/lib/google-sheets';
import Link from 'next/link';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rentingBook, setRentingBook] = useState<Book | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  // Genre filter state
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Form/Modal state for Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    author: '',
    isbn: '',
    subtitle: '',
    publisher: '',
    publicationDate: '',
    description: '',
    genres: [] as string[],
    collection: '',
    city: '',
    quantity: '1',
    notes: '',
  });

  // Available genres for the multi-select
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    books.forEach(book => {
      book.genres.forEach(g => {
        if (g && g.trim()) genres.add(g.trim());
      });
    });
    return Array.from(genres).sort();
  }, [books]);

  useEffect(() => {
    checkAuth();
    fetchBooks();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.authenticated);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

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

  // Admin Actions
  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      author: '',
      isbn: '',
      subtitle: '',
      publisher: '',
      publicationDate: '',
      description: '',
      genres: [],
      collection: '',
      city: '',
      quantity: '1',
      notes: '',
    });
  };

  const handleAddBook = () => {
    resetForm();
    setEditingBook(null);
    setShowAddModal(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setFormData({
      id: book.id || '',
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      subtitle: book.subtitle,
      publisher: book.publisher,
      publicationDate: book.publicationDate,
      description: book.description,
      genres: book.genres,
      collection: book.collection || '',
      city: book.city || '',
      quantity: book.quantity.toString(),
      notes: book.notes,
    });
    setShowAddModal(true);
  };

  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Tem certeza que deseja excluir "${book.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/books?rowId=${book.rowId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchBooks();
        success('Livro excluído com sucesso!');
      } else {
        throw new Error('Erro ao excluir livro');
      }
    } catch (err) {
      console.error('Erro ao excluir livro:', err);
      error('Erro ao excluir livro. Tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookData = {
      id: formData.id,
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      subtitle: formData.subtitle,
      publisher: formData.publisher,
      publicationDate: formData.publicationDate,
      description: formData.description,
      genres: formData.genres,
      collection: formData.collection,
      city: formData.city,
      quantity: parseInt(formData.quantity) || 1,
      notes: formData.notes,
      rowId: editingBook?.rowId,
    };

    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: bookData }),
      });

      if (res.ok) {
        await fetchBooks();
        setShowAddModal(false);
        resetForm();
        success(editingBook ? 'Livro atualizado com sucesso!' : 'Livro adicionado com sucesso!');
      } else {
        throw new Error('Erro ao salvar livro');
      }
    } catch (err) {
      console.error('Erro ao salvar livro:', err);
      error('Erro ao salvar livro. Tente novamente.');
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
    return result;
  }, [books]);

  const filteredBooks = useMemo(() => {
    const filtered = books.filter(book => {
      // Text search
      const matchesSearch = !search.trim() ||
        book.filter.includes(search.toLowerCase()) ||
        book.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));

      // Genre filter - debug
      const bookGenresLower = book.genres.map(g => g.toLowerCase());
      const selectedGenresLower = selectedGenres.map(g => g.toLowerCase());
      const matchesGenres = selectedGenres.length === 0 ||
        selectedGenresLower.some(genre => bookGenresLower.includes(genre));

      return matchesSearch && matchesGenres;
    });

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
  }) => {
    if (!rentingBook) return;

    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowId: rentingBook.rowId,
          rental: rentalData,
        }),
      });

      if (res.ok) {
        await fetchBooks();
        setRentingBook(null);
        success('Livro reservado com sucesso!');
      } else {
        throw new Error('Erro ao reservar livro');
      }
    } catch (err) {
      console.error('Erro ao reservar livro:', err);
      error('Erro ao reservar livro. Tente novamente.');
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
    <div className="flex flex-col gap-6">
      {/* Admin Header Section */}
      {isAdmin && (
        <div className="gap-4 flex flex-col lg:flex-row items-center justify-between bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">... é preciso vir cá eu gerir, para ficar gerido...</h3>
          </div>
          <div className='flex flex-row flex-wrap gap-4'>
            <Link href="/reservas" className="flex flex-row gap-2 bg-[#ff4e00] hover:bg-[#e64500] bg-[#ff4e00] text-white shadow px-4 py-2 text-sm rounded-sm items-center">
              <Eye className="w-4 h-4" />
              <span>Ver reservas</span>
            </Link>
            <Button onClick={handleAddBook} className="bg-[#ff4e00] hover:bg-[#e64500]">
              <Plus className="w-4 h-4" />
              Adicionar Livro
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Buscar por título, autor, ISBN ou gênero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre Filter Dropdown */}
        <div className="sm:w-64 relative">
          <button
            onClick={() => setShowGenreFilter(!showGenreFilter)}
            className="cursor-pointer w-full flex items-center gap-2 px-4 py-2 justify-between border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors bg-white"
          >
            <div className="flex items-center gap-2" >
              <Filter className="w-4 h-4" />
              <span className="cursor-pointer text-sm">filtrar por gênero</span>
              {selectedGenres.length > 0 && (
                <span className="bg-[#ff4e00] text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedGenres.length}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showGenreFilter ? 'rotate-180' : ''}`} />
          </button>

          {/* Genre Filter Dropdown Panel */}
          {showGenreFilter && (
            <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {selectedGenres.length > 0 && (<div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={clearGenreFilter}
                  className="text-xs text-[#ff4e00] hover:underline"
                >
                  Limpar
                </button>
              </div>
              )}
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
      <div className="flex flex-col gap-4">
        {filteredBooks.map((book) => (
          <BookCard
            key={book.rowId}
            book={book}
            onRent={setRentingBook}
            isAdmin={isAdmin}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
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

      {/* Admin Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="items-center flex flex-row justify-between px-4 py-2 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBook ? 'editar livro' : 'adicionar novo livro'}
              </h2>
              <X className='cursor-pointer' onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <Input
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="ID do livro"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do livro"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtítulo
                  </label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Subtítulo do livro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autor *
                  </label>
                  <Input
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Nome do autor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <Input
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="ISBN do livro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editora
                  </label>
                  <Input
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Nome da editora"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Publicação
                  </label>
                  <Input
                    type="text"
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                    placeholder="Ex: 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coleção
                  </label>
                  <Input
                    value={formData.collection}
                    onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                    placeholder="Nome da coleção"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade de publicação"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gêneros
                  </label>
                  <GenreMultiSelect
                    availableGenres={availableGenres}
                    selectedGenres={formData.genres}
                    onChange={(genres) => setFormData({ ...formData, genres })}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do livro..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4e00] focus:border-transparent text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#ff4e00] hover:bg-[#e64500]"
                >
                  {editingBook ? 'Guardar' : 'Adicionar Livro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
