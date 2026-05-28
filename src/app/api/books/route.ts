import { NextRequest, NextResponse } from 'next/server';
import { getBooks } from '@/lib/google-sheets';

export async function GET() {
  try {
    const books = await getBooks();
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar livros' },
      { status: 500 }
    );
  }
}
