'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import type { Reserva } from '@/lib/google-sheets';
import { ArrowLeft, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { ToastContainer, useToast } from '@/components/ui/toast';

export default function ReservasPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/');
        return;
      }
      setAuthChecking(false);
      fetchReservas();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/');
    }
  };

  const fetchReservas = async () => {
    try {
      const res = await fetch('/api/renters');
      if (res.ok) {
        const data = await res.json();
        setReservas(data.reservas);
      }
    } catch (error) {
      console.error('Erro ao buscar Reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevolver = async (reserva: Reserva) => {
    try {
      const res = await fetch('/api/admin/return', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowId: reserva.rowId,
          rental: { name: reserva.name, email: reserva.email }
        })
      });

      if (res.ok) {
        // Refresh the list
        fetchReservas();
        success('Livro devolvido com sucesso!');
      } else {
        const data = await res.json();
        error('Erro ao devolver: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao devolver:', err);
      error('Erro ao devolver livro');
    }
  };

  // Helper function to parse date in DD-MM-YYYY format
  const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(0);
  };

  // Helper function to format date as DD-MM-YYYY
  const formatDate = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // Input is YYYY-MM-DD, convert to DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Return as is if already in DD-MM-YYYY or unknown format
    return dateStr;
  };

  const handleSortByDate = () => {
    if (sortDirection === null) {
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortDirection(null);
    }
  };

  const filteredReservas = useMemo(() => {
    let result = reservas;

    // Apply filter
    if (filter.trim()) {
      const query = filter.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.bookTitle.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query)
      );
    }

    // Apply sort
    if (sortDirection) {
      result = [...result].sort((a, b) => {
        const dateA = parseDate(formatDate(a.since));
        const dateB = parseDate(formatDate(b.since));
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    }

    return result;
  }, [reservas, filter, sortDirection]);

  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4e00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2">
          <Link href="/"><ArrowLeft className="w-8 text-gray-400 cursor-pointer" onClick={() => router.back()} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">todas as reservas</h1>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Buscar por nome, título do livro ou email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-10"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {filteredReservas.length} reserva
          {filteredReservas.length !== 1 ? 's' : ''} ativa
          {filteredReservas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredReservas.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={handleSortByDate}
                  >
                    <div className="flex items-center gap-1">
                      Data da Reserva
                      {sortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
                      {sortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
                      {sortDirection === null && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devolver
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservas.map((reserva, index) => (
                  <tr key={`${reserva.name}-${reserva.bookTitle}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reserva.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reserva.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reserva.bookTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(reserva.bookAuthor)
                        ? reserva.bookAuthor.join(', ')
                        : reserva.bookAuthor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(reserva.since)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDevolver(reserva)}
                        className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        title="Devolver livro"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h3 className="text-lg text-gray-500">Nenhuma reserva ativa</h3>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
