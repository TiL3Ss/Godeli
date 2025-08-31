// app/api/tiendas/[id]/repartidores/route.ts
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

    const { id: tiendaId } = await params;
    const user = session.user;

    // Verificar que el usuario tenga permisos para ver esta tienda
    if (user.tipo === 'tienda') {
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
          { success: false, error: 'No tienes permisos para acceder a esta tienda' },
          { status: 403 }
        );
      }
    }

    // Obtener repartidores asignados a esta tienda
    const result = await tursoClient.execute({
      sql: `SELECT u.id, u.username, u.nombre, u.suscripcion, u.created_at,
                   rt.created_at as asignado_desde
            FROM usuarios u
            INNER JOIN repartidor_tiendas rt ON u.id = rt.repartidor_id
            WHERE rt.tienda_id = ? AND u.tipo = 'repartidor'
            ORDER BY u.nombre`,
      args: [tiendaId]
    });

    const repartidores = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      nombre: row.nombre,
      suscripcion: row.suscripcion,
      created_at: row.created_at,
      asignado_desde: row.asignado_desde
    }));

    return NextResponse.json({
      success: true,
      data: repartidores
    });

  } catch (error) {
    console.error('Error al obtener repartidores de la tienda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id: tiendaId } = await params;
    const user = session.user;
    
    // Solo los propietarios de la tienda pueden asignar repartidores
    if (user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo los propietarios de tienda pueden asignar repartidores' },
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

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { repartidor_id } = body;

    if (!repartidor_id) {
      return NextResponse.json(
        { success: false, error: 'ID del repartidor es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el repartidor existe
    const repartidorResult = await tursoClient.execute({
      sql: `SELECT id FROM usuarios WHERE id = ? AND tipo = 'repartidor'`,
      args: [repartidor_id]
    });

    if (repartidorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Repartidor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no esté ya asignado
    const existingResult = await tursoClient.execute({
      sql: `SELECT 1 FROM repartidor_tiendas WHERE repartidor_id = ? AND tienda_id = ?`,
      args: [repartidor_id, tiendaId]
    });

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El repartidor ya está asignado a esta tienda' },
        { status: 400 }
      );
    }

    // Asignar el repartidor a la tienda
    await tursoClient.execute({
      sql: `INSERT INTO repartidor_tiendas (repartidor_id, tienda_id, created_at) VALUES (?, ?, datetime('now'))`,
      args: [repartidor_id, tiendaId]
    });

    return NextResponse.json({
      success: true,
      message: 'Repartidor asignado exitosamente'
    });

  } catch (error) {
    console.error('Error al asignar repartidor:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}