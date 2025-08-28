// app/api/user/check-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTursoClient } from '@/lib/turso';

export async function GET(request: NextRequest) {
  try {
    // Usar getToken en lugar de getServerSession para rutas API
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token?.username) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const client = getTursoClient();
    
    // Verificar si el usuario tiene permisos de administrador
    const result = await client.execute({
      sql: 'SELECT AD FROM usuarios WHERE username = ?',
      args: [token.username]
    });

    const user = result.rows[0];
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isAdmin: user.AD === 1,
      username: token.username
    });
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}