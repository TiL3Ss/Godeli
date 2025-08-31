// app/api/repartidores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Solo permitir acceso a usuarios de tipo tienda o admin
    if (user.tipo !== 'tienda' && user.tipo !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener todos los repartidores
    const result = await tursoClient.execute({
      sql: `SELECT u.id, u.username, u.nombre, u.suscripcion, u.created_at
            FROM usuarios u
            WHERE u.tipo = 'repartidor'
            ORDER BY u.nombre`
    });

    const repartidores = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      nombre: row.nombre,
      suscripcion: row.suscripcion,
      created_at: row.created_at
    }));

    return NextResponse.json({
      success: true,
      data: repartidores
    });

  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}