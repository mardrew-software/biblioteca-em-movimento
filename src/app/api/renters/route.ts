import { NextResponse } from 'next/server';
import { getReservas } from '@/lib/google-sheets';

export async function GET() {
  try {
    const reservas = await getReservas();
    return NextResponse.json({ reservas });
  } catch (error) {
    console.error('Erro ao buscar Reservas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar Reservas' },
      { status: 500 }
    );
  }
}
