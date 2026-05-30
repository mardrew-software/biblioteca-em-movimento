'use client';

import { useState } from 'react';
import { Book } from '@/lib/google-sheets';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookCardProps {
  book: Book;
  onRent: (book: Book) => void;
  isAdmin?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export function BookCard({ book, onRent, isAdmin, onEdit, onDelete }: BookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const availableCopies = book.quantity - book.quantityRented;
  const canRent = availableCopies > 0;

  return (
    <div className="bg-white rounded-sm shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors h-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-row items-start justify-between h-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {book.title}
              </h3>
              {book.subtitle && (
                <span className="text-sm text-gray-500 hidden sm:block">
                  {book.subtitle}
                </span>
              )}
            </div>
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

          <div className='flex flex-col gap-8 h-full'>
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${canRent
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {canRent ? 'Disponível' : 'Indisponível'}
              </span>

              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Admin Quick Actions */}
            {isAdmin && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(book);
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(book);
                  }}
                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col gap-4 border-t border-gray-100 p-6 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Details */}
            <div className="flex flex-col gap-2">
              {book.isbn && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">ISBN</span>
                  <p className="text-sm font-medium text-gray-900">{book.isbn}</p>
                </div>
              )}

              {book.id !== undefined && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">ID</span>
                  <p className="text-sm font-medium text-gray-900">{book.id}</p>
                </div>
              )}

              {book.subtitle && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Subtítulo</span>
                  <p className="text-sm font-medium text-gray-900">{book.subtitle}</p>
                </div>
              )}

              {book.publisher && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Editora</span>
                  <p className="text-sm font-medium text-gray-900">{book.publisher}</p>
                </div>
              )}

              {book.collection && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Coleção</span>
                  <p className="text-sm text-gray-700">{book.collection}</p>
                </div>
              )}

              {book.publicationDate && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Ano</span>
                  <p className="text-sm font-medium text-gray-900">{book.publicationDate}</p>
                </div>
              )}

              {book.city && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Cidade</span>
                  <p className="text-sm text-gray-700">{book.city}</p>
                </div>
              )}

              {book.notes && (
                <div className="flex items-center flex-row gap-2">
                  <span className="text-sm text-gray-500">Notas</span>
                  <p className="text-sm text-gray-700">{book.notes}</p>
                </div>
              )}
            </div>


            {/* Right Column - Rental Info & Action */}
            <div className='flex flex-col gap-4 justify-end'>
              {book.description && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Descrição</span>
                  <p className="text-sm text-gray-700">{book.description}</p>
                </div>
              )}

              <div className='flex flex-row gap-4 justify-end'>
                <div className='flex flex-row gap-4 bg-white py-2 px-4'>
                  <div className="flex items-center flex-row gap-1">
                    <span className="text-sm text-gray-500">Disponíveis</span>
                    <p className="text-sm text-gray-700">{canRent ? `${book.quantityRented} de ${book.quantity}` : `N/A`}</p>
                  </div>

                  <button
                    onClick={() => onRent(book)}
                    disabled={!canRent}
                    className={`${!canRent ? 'bg-gray-300 cursor-not-allowed' : 'cursor-pointer bg-[#ff4e00] hover:bg-[#e64500] transition-colors'} text-white text-sm font-medium px-4 py-1 rounded-sm`}
                  >
                    Reservar
                  </button>

                </div>
              </div>
            </div>


          </div>
        </div>
      )
      }
    </div >
  );
}
