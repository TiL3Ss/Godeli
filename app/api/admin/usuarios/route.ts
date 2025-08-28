// app/api/admin/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si el usuario es administrador
    if (session.user.AD !== 1) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const client = getTursoClient();

    // Obtener todos los usuarios con toda la información necesaria
    const result = await client.execute({
      sql: `SELECT 
              id, 
              username, 
              nombre, 
              tipo, 
              suscripcion, 
              AD,
              created_at
            FROM usuarios 
            ORDER BY created_at DESC`
    });

    // Transformar los datos para el frontend
    const usuarios = result.rows.map(row => ({
      id: Number(row.id),
      username: String(row.username),
      nombre: String(row.nombre),
      tipo: String(row.tipo),
      suscripcion: Number(row.suscripcion),
      AD: Number(row.AD),
      created_at: row.created_at
    }));

    return NextResponse.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}