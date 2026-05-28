'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/book-card';
import { RentModal } from '@/components/rent-modal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Book, Rental } from '@/lib/google-sheets';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [rentingBook, setRentingBook] = useState<Book | null>(null);

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

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;
    const query = search.toLowerCase();
    return books.filter(
      (book) =>
        book.filter.includes(query) ||
        book.genres.some((g) => g.toLowerCase().includes(query))
    );
  }, [books, search]);

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por título, autor, ISBN ou gênero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'} encontrado
          {filteredBooks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {filteredBooks.map((book) => (
          <BookCard
            key={book.rowId}
            book={book}
            onSelect={setSelectedBook}
            onRent={setRentingBook}
          />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhum livro encontrado</h3>
          <p className="text-gray-500">Tente ajustar seus termos de busca</p>
        </div>
      )}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onRent={() => {
            setRentingBook(selectedBook);
            setSelectedBook(null);
          }}
        />
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

function BookDetailModal({
  book,
  onClose,
  onRent,
}: {
  book: Book;
  onClose: () => void;
  onRent: () => void;
}) {
  const availableCopies = book.quantity - book.quantityRented;
  const canRent = availableCopies > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{book.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <strong>Autor:</strong> {book.author}
          </div>
          {book.subtitle && (
            <div>
              <strong>Subtítulo:</strong> {book.subtitle}
            </div>
          )}
          <div>
            <strong>ISBN:</strong> {book.isbn || 'N/A'}
          </div>
          {book.publicationDate && (
            <div>
              <strong>Data de Publicação:</strong> {book.publicationDate}
            </div>
          )}
          {book.publisher && (
            <div>
              <strong>Editora:</strong> {book.publisher}
            </div>
          )}
          {book.genres.length > 0 && (
            <div>
              <strong>Gêneros:</strong>{' '}
              {book.genres.map((g, i) => (
                <span
                  key={g}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-1"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          {book.description && (
            <div>
              <strong>Descrição:</strong>
              <p className="mt-1 text-gray-600">{book.description}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <strong>Disponibilidade:</strong>{' '}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${canRent
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                >
                  {availableCopies} de {book.quantity} disponíveis
                </span>
              </div>
              {canRent && (
                <button
                  onClick={onRent}
                  className="bg-[#ff4e00] text-white px-4 py-2 rounded-lg hover:bg-[#e64500] transition-colors"
                >
                  Alugar Livro
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
