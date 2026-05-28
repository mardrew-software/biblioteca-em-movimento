'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, BookOpen, ArrowLeft, Search } from 'lucide-react';
import type { Book } from '@/lib/google-sheets';

interface User {
    email: string;
    name: string;
    picture?: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [books, setBooks] = useState<Book[]>([]);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        subtitle: '',
        publisher: '',
        publicationDate: '',
        description: '',
        genres: '',
        quantity: '1',
        notes: '',
    });

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
            setUser(data.user);
            fetchBooks();
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            router.push('/');
        } finally {
            setLoading(false);
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
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            isbn: '',
            subtitle: '',
            publisher: '',
            publicationDate: '',
            description: '',
            genres: '',
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
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            subtitle: book.subtitle,
            publisher: book.publisher,
            publicationDate: book.publicationDate,
            description: book.description,
            genres: book.genres.join(', '),
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
                alert('Livro excluído com sucesso!');
            } else {
                throw new Error('Erro ao excluir livro');
            }
        } catch (error) {
            console.error('Erro ao excluir livro:', error);
            alert('Erro ao excluir livro. Tente novamente.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const bookData = {
            title: formData.title,
            author: formData.author,
            isbn: formData.isbn,
            subtitle: formData.subtitle,
            publisher: formData.publisher,
            publicationDate: formData.publicationDate,
            description: formData.description,
            genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
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
                alert(editingBook ? 'Livro atualizado com sucesso!' : 'Livro adicionado com sucesso!');
            } else {
                throw new Error('Erro ao salvar livro');
            }
        } catch (error) {
            console.error('Erro ao salvar livro:', error);
            alert('Erro ao salvar livro. Tente novamente.');
        }
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        book.isbn.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4e00]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel de Admin</h1>
                    <p className="text-gray-500">Gerencie os livros da biblioteca</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.push('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <Button onClick={handleAddBook} className="bg-[#ff4e00] hover:bg-[#e64500]">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Livro
                    </Button>
                </div>
            </div>

            {/* User Info & Logout */}
            {user && (
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {user.picture && (
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        Sair
                    </Button>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar por título, autor ou ISBN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Books List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livro</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alugados</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBooks.map((book) => (
                                <tr key={book.rowId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{book.title}</p>
                                                <p className="text-sm text-gray-500">{book.author}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{book.isbn}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {book.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${book.quantityRented > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {book.quantityRented}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditBook(book)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDeleteBook(book)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredBooks.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum livro encontrado</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingBook ? 'Editar Livro' : 'Adicionar Novo Livro'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                        type="date"
                                        value={formData.publicationDate}
                                        onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
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
                                        Gêneros
                                    </label>
                                    <Input
                                        value={formData.genres}
                                        onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                                        placeholder="Ficção, Romance, Aventura"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descrição do livro..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4e00] focus:border-transparent"
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
                            <div className="flex justify-end gap-3 pt-4 border-t">
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
                                    {editingBook ? 'Salvar Alterações' : 'Adicionar Livro'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
