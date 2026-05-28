'use client';

import { Book } from '@/lib/google-sheets';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onRent: (book: Book) => void;
}

export function BookCard({ book, onSelect, onRent }: BookCardProps) {
  const availableCopies = book.quantity - book.quantityRented;
  const canRent = availableCopies > 0;

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(book)}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{book.author}</p>
          
          {book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                >
                  {genre}
                </span>
              ))}
              {book.genres.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{book.genres.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              canRent
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {availableCopies} disponíveis
          </span>
          
          {canRent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRent(book);
              }}
              className="block mt-2 bg-[#ff4e00] text-white text-sm px-4 py-2 rounded hover:bg-[#e64500] transition-colors"
            >
              Alugar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
