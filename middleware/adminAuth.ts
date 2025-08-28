// middleware/adminAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@libsql/client';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function adminAuth(request: NextRequest) {
  try {
    // Usar getToken en lugar de getServerSession para rutas API
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token?.username) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Consulta usando Turso con la tabla usuarios correcta
    const result = await tursoClient.execute({
      sql: 'SELECT id, AD FROM usuarios WHERE username = ?',
      args: [token.username]
    });

    const user = result.rows[0];

    if (!user || user.AD !== 1) {
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