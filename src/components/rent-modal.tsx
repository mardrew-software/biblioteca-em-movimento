'use client';

import { useState } from 'react';
import { Book } from '@/lib/google-sheets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RentModalProps {
  book: Book;
  onClose: () => void;
  onRent: (rentalData: {
    name: string;
    email: string;
    date: string;
  }) => void;
}

export function RentModal({ book, onClose, onRent }: RentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setLoading(true);
    try {
      await onRent(formData);
    } finally {
      setLoading(false);
    }
  };

  const availableCopies = book.quantity - book.quantityRented;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 px-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reservar livro</h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">{book.title}</h3>
            <p className="text-sm text-gray-600">por {book.author}</p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${availableCopies > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {availableCopies} de {book.quantity} disponíveis
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ff4e00] hover:bg-[#e64500]"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
