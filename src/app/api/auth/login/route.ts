import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createToken, setAuthCookie } from '@/lib/auth';

const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { error: 'Credencial não fornecida' },
        { status: 400 }
      );
    }

    // Verificar o token do Google
    const client = new OAuth2Client(GOOGLE_SERVICE_ACCOUNT);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_SERVICE_ACCOUNT,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    const user = {
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
    };

    // Criar token JWT
    const token = await createToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
