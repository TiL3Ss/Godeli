// app/api/repartidores/[id]/tiendas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const repartidorId = params.id;
    const user = session.user;

    // Verificar que el usuario autenticado pueda acceder a esta información
    if (user.tipo === 'repartidor' && user.id !== repartidorId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener tiendas asignadas al repartidor
    const result = await tursoClient.execute({
      sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at,
                   u.nombre as propietario_nombre,
                   rt.created_at as asignado_desde
            FROM tiendas t
            INNER JOIN repartidor_tiendas rt ON t.id = rt.tienda_id
            LEFT JOIN usuarios u ON t.usuario_id = u.id
            WHERE rt.repartidor_id = ?
            ORDER BY t.nombre`,
      args: [repartidorId]
    });

    const tiendas = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion,
      telefono: row.telefono,
      propietario_nombre: row.propietario_nombre,
      asignado_desde: row.asignado_desde,
      created_at: row.created_at
    }));

    return NextResponse.json({
      success: true,
      data: tiendas
    });

  } catch (error) {
    console.error('Error al obtener tiendas del repartidor:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}