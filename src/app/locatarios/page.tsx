'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import type { Locatario } from '@/lib/google-sheets';

const statusMap: Record<string, { label: string; color: string }> = {
  RENTED: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  EXTENDED: { label: 'Estendido', color: 'bg-yellow-100 text-yellow-800' },
  NOTIFIED: { label: 'Vencendo', color: 'bg-orange-100 text-orange-800' },
  BREACHING: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
};

export default function LocatariosPage() {
  const router = useRouter();
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
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
        // Redirecionar para home se não estiver autenticado
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/');
        return;
      }
      // Usuário autenticado, carregar locatários
      setAuthChecking(false);
      fetchLocatarios();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/');
    }
  };

  const fetchLocatarios = async () => {
    try {
      const res = await fetch('/api/renters');
      if (res.ok) {
        const data = await res.json();
        setLocatarios(data.locatarios);
      }
    } catch (error) {
      console.error('Erro ao buscar locatários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocatarios = useMemo(() => {
    if (!filter.trim()) return locatarios;
    const query = filter.toLowerCase();
    return locatarios.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.bookTitle.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query)
    );
  }, [locatarios, filter]);

  if (authChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4e00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Locatários</h1>
        <p className="text-gray-500 mb-4">Visualize todos os aluguéis ativos</p>

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
            className="pl-10"
          />
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {filteredLocatarios.length} aluguel
          {filteredLocatarios.length !== 1 ? 's' : ''} ativo
          {filteredLocatarios.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredLocatarios.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locatário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devolução
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocatarios.map((locatario, index) => (
                  <tr key={`${locatario.name}-${locatario.bookTitle}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {locatario.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {locatario.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locatario.bookTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(locatario.bookAuthor)
                        ? locatario.bookAuthor.join(', ')
                        : locatario.bookAuthor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {locatario.since}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {locatario.returnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusMap[locatario.status]?.color ||
                          'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {statusMap[locatario.status]?.label || locatario.status}
                      </span>
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
