// app/api/repartidores/[id]/tiendas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../[...nextauth]/route';
import { createClient } from '@libsql/client';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const repartidorId = params.id;

    // Verificar que el usuario puede acceder a esta información
    if (session.user.id !== repartidorId && session.user.tipo !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No autorizado para acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener tiendas asignadas al repartidor
    const result = await tursoClient.execute({
      sql: `SELECT t.id, t.nombre, t.direccion, t.telefono 
            FROM tiendas t
            INNER JOIN repartidor_tiendas rt ON t.id = rt.tienda_id
            WHERE rt.repartidor_id = ?
            ORDER BY t.nombre`,
      args: [repartidorId]
    });

    const tiendas = result.rows.map(row => ({
      id: Number(row.id),
      nombre: row.nombre as string,
      direccion: row.direccion as string,
      telefono: row.telefono as string,
    }));

    return NextResponse.json({
      success: true,
      data: tiendas
    });

  } catch (error) {
    console.error('Error en GET /api/repartidores/[id]/tiendas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}