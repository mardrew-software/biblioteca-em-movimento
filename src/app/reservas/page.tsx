'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import type { Reserva } from '@/lib/google-sheets';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function ReservasPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [filter, setFilter] = useState('');

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

  const filteredReservas = useMemo(() => {
    if (!filter.trim()) return reservas;
    const query = filter.toLowerCase();
    return reservas.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.bookTitle.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query)
    );
  }, [reservas, filter]);

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data da Reserva
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
                      {reserva.since}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhum aluguel ativo</h3>
          <p className="text-gray-500">
            {filter
              ? 'Tente ajustar seus termos de busca'
              : 'Todos os livros estão disponíveis para aluguel'}
          </p>
        </div>
      )}
    </div>
  );
}
