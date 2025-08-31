// app/api/tiendas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: tiendaId } = await params; // Await params before accessing properties
    const user = session.user;

    // Obtener información de la tienda
    const result = await tursoClient.execute({
      sql: `SELECT t.id, t.usuario_id, t.nombre, t.direccion, t.telefono, t.created_at,
                   u.nombre as propietario_nombre
            FROM tiendas t
            LEFT JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.id = ?`,
      args: [tiendaId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    const tienda = result.rows[0];

    // Verificar permisos de acceso
    if (user.tipo === 'tienda' && tienda.usuario_id.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para acceder a esta tienda' },
        { status: 403 }
      );
    }

    if (user.tipo === 'repartidor') {
      // Verificar que el repartidor esté asignado a esta tienda
      const assignmentResult = await tursoClient.execute({
        sql: `SELECT 1 FROM repartidor_tiendas WHERE repartidor_id = ? AND tienda_id = ?`,
        args: [user.id, tiendaId]
      });

      if (assignmentResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para acceder a esta tienda' },
          { status: 403 }
        );
      }
    }

    // Formatear respuesta
    const tiendaData = {
      id: tienda.id,
      usuario_id: tienda.usuario_id,
      nombre: tienda.nombre,
      direccion: tienda.direccion,
      telefono: tienda.telefono,
      propietario_nombre: tienda.propietario_nombre,
      created_at: tienda.created_at
    };

    return NextResponse.json({
      success: true,
      data: tiendaData
    });

  } catch (error) {
    console.error('Error al obtener tienda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}