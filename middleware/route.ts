// middleware/adminAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function adminAuth(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Consulta usando Turso
    const result = await tursoClient.execute({
      sql: 'SELECT id, is_moderator FROM users WHERE email = ?',
      args: [session.user.email]
    });

    const user = result.rows[0];

    if (!user || user.is_moderator !== 1) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Se requieren permisos de administrador.' 
      }, { status: 403 });
    }

    return null; // null significa que la verificación fue exitosa
  } catch (error) {
    console.error('Error en adminAuth middleware:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}