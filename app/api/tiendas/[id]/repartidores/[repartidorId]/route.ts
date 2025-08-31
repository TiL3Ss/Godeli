// app/api/tiendas/[id]/repartidores/[repartidorId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repartidorId: string }> }
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

    const { id: tiendaId, repartidorId } = await params;
    const user = session.user;

    // Solo los propietarios de la tienda pueden quitar repartidores
    if (user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo los propietarios de tienda pueden quitar repartidores' },
        { status: 403 }
      );
    }

    // Verificar que la tienda pertenezca al usuario
    const tiendaResult = await tursoClient.execute({
      sql: `SELECT usuario_id FROM tiendas WHERE id = ?`,
      args: [tiendaId]
    });

    if (tiendaResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    if (tiendaResult.rows[0].usuario_id.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para modificar esta tienda' },
        { status: 403 }
      );
    }

    // Verificar que la asignación existe
    const existingResult = await tursoClient.execute({
      sql: `SELECT 1 FROM repartidor_tiendas WHERE repartidor_id = ? AND tienda_id = ?`,
      args: [repartidorId, tiendaId]
    });

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El repartidor no está asignado a esta tienda' },
        { status: 404 }
      );
    }

    // Quitar la asignación
    await tursoClient.execute({
      sql: `DELETE FROM repartidor_tiendas WHERE repartidor_id = ? AND tienda_id = ?`,
      args: [repartidorId, tiendaId]
    });

    return NextResponse.json({
      success: true,
      message: 'Repartidor removido exitosamente de la tienda'
    });

  } catch (error) {
    console.error('Error al quitar repartidor:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}