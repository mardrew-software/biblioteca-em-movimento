import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { returnBook } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rowId, rental } = body as { rowId: number; rental: { name: string; email: string } };

    if (!rowId || !rental) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    await returnBook(rowId, rental);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao devolver livro:', error);
    return NextResponse.json(
      { error: 'Erro ao devolver livro' },
      { status: 500 }
    );
  }
}
