import { NextRequest, NextResponse } from 'next/server';
import { rentBook, Rental } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowId, rental } = body as { rowId: number; rental: Rental };

    if (!rowId || !rental) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    await rentBook(rowId, rental);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alugar livro:', error);
    return NextResponse.json(
      { error: 'Erro ao alugar livro' },
      { status: 500 }
    );
  }
}
