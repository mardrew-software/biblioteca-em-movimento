import { NextResponse } from 'next/server';
import { getLocatarios } from '@/lib/google-sheets';

export async function GET() {
  try {
    const locatarios = await getLocatarios();
    return NextResponse.json({ locatarios });
  } catch (error) {
    console.error('Erro ao buscar locatários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar locatários' },
      { status: 500 }
    );
  }
}
