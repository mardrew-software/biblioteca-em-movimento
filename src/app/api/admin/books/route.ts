import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveBook, deleteBook, Book } from '@/lib/google-sheets';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './service_account_credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function checkAuth() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 401 }
        );
    }
    return null;
}

export async function POST(request: NextRequest) {
    const authError = await checkAuth();
    if (authError) return authError;

    try {
        const body = await request.json();
        const book = body.book as Partial<Book> & { rowId?: number };

        if (!book.title || !book.author) {
            return NextResponse.json(
                { error: 'Título e autor são obrigatórios' },
                { status: 400 }
            );
        }

        await saveBook(book);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar livro:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar livro' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await checkAuth();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const rowId = parseInt(searchParams.get('rowId') || '');

        if (!rowId) {
            return NextResponse.json(
                { error: 'ID do livro não fornecido' },
                { status: 400 }
            );
        }

        await deleteBook(rowId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir livro' },
            { status: 500 }
        );
    }
}
