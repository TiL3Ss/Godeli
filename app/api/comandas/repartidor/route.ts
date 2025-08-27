// app/api/comandas/repartidor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.tipo !== 'repartidor') {
      return NextResponse.json({ success: false, error: 'Solo repartidores pueden acceder' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');
    if (!tiendaId) return NextResponse.json({ success: false, error: 'tienda_id requerido' }, { status: 400 });

    const client = getTursoClient();

    // Verificar acceso del repartidor a la tienda
    const accesoResult = await client.execute({
      sql: `SELECT id FROM repartidor_tiendas WHERE repartidor_id = ? AND tienda_id = ?`,
      args: [session.user.id, tiendaId]
    });
    if (accesoResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Sin acceso a esta tienda' }, { status: 403 });
    }

    // Comandas disponibles - estado 'en_proceso' sin repartidor asignado
    const disponiblesResult = await client.execute({
      sql: `
        SELECT c.*, r.nombre as repartidor_nombre, r.username as repartidor_username
        FROM comandas c
        LEFT JOIN usuarios r ON c.repartidor_id = r.id
        WHERE c.tienda_id = ? AND c.estado = 'en_proceso' AND c.repartidor_id IS NULL
        ORDER BY c.created_at DESC
      `,
      args: [tiendaId]
    });

    const disponibles = await Promise.all(disponiblesResult.rows.map(async row => {
      const productosResult = await client.execute({
        sql: `
          SELECT cp.id, cp.cantidad, cp.precio_unitario, cp.producto_id, p.nombre as producto_nombre, p.precio as producto_precio
          FROM comanda_productos cp
          JOIN productos p ON cp.producto_id = p.id
          WHERE cp.comanda_id = ?
          ORDER BY cp.id
        `,
        args: [row.id]
      });

      return {
        id: Number(row.id),
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        cliente_direccion: row.cliente_direccion,
        total: Number(row.total),
        estado: row.estado,
        comentario_problema: row.comentario_problema,
        created_at: row.created_at,
        updated_at: row.updated_at,
        disponible: true,
        productos: productosResult.rows.map(p => ({
          id: Number(p.id),
          cantidad: Number(p.cantidad),
          precio_unitario: Number(p.precio_unitario),
          producto: { id: Number(p.producto_id), nombre: p.producto_nombre, precio: Number(p.producto_precio) }
        }))
      };
    }));

    // Comandas asignadas - estado 'activa' asignadas a este repartidor
    const asignadasResult = await client.execute({
      sql: `
        SELECT c.*, r.nombre as repartidor_nombre, r.username as repartidor_username
        FROM comandas c
        LEFT JOIN usuarios r ON c.repartidor_id = r.id
        WHERE c.tienda_id = ? AND c.estado = 'activa' AND c.repartidor_id = ?
        ORDER BY c.created_at DESC
      `,
      args: [tiendaId, session.user.id]
    });

    const asignadas = await Promise.all(asignadasResult.rows.map(async row => {
      const productosResult = await client.execute({
        sql: `
          SELECT cp.id, cp.cantidad, cp.precio_unitario, cp.producto_id, p.nombre as producto_nombre, p.precio as producto_precio
          FROM comanda_productos cp
          JOIN productos p ON cp.producto_id = p.id
          WHERE cp.comanda_id = ?
          ORDER BY cp.id
        `,
        args: [row.id]
      });

      return {
        id: Number(row.id),
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        cliente_direccion: row.cliente_direccion,
        total: Number(row.total),
        estado: row.estado,
        comentario_problema: row.comentario_problema,
        created_at: row.created_at,
        updated_at: row.updated_at,
        disponible: false,
        repartidor: {
          id: Number(row.repartidor_id),
          nombre: row.repartidor_nombre,
          username: row.repartidor_username
        },
        productos: productosResult.rows.map(p => ({
          id: Number(p.id),
          cantidad: Number(p.cantidad),
          precio_unitario: Number(p.precio_unitario),
          producto: { id: Number(p.producto_id), nombre: p.producto_nombre, precio: Number(p.producto_precio) }
        }))
      };
    }));

    return NextResponse.json({ success: true, disponibles, asignadas, data: [...disponibles, ...asignadas] });

  } catch (error) {
    console.error('Error obteniendo comandas para repartidor:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Asignar repartidor a una comanda
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo repartidores pueden usar esta API
    if (session.user.tipo !== 'repartidor') {
      return NextResponse.json(
        { success: false, error: 'Solo repartidores pueden acceder' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { comanda_id } = body;

    if (!comanda_id) {
      return NextResponse.json(
        { success: false, error: 'comanda_id requerido' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que la comanda existe y está disponible
    const comandaResult = await client.execute({
      sql: `
        SELECT c.id, c.estado, c.tienda_id, c.repartidor_id
        FROM comandas c
        WHERE c.id = ? AND c.estado = 'en_proceso' AND c.repartidor_id IS NULL
      `,
      args: [comanda_id]
    });

    if (comandaResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comanda no disponible o ya asignada' }, 
        { status: 400 }
      );
    }

    const comanda = comandaResult.rows[0];

    // Verificar que el repartidor tiene acceso a esta tienda
    const accesoResult = await client.execute({
      sql: `
        SELECT rt.id 
        FROM repartidor_tiendas rt 
        WHERE rt.repartidor_id = ? AND rt.tienda_id = ?
      `,
      args: [session.user.id, comanda.tienda_id]
    });

    if (accesoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sin acceso a esta tienda' }, 
        { status: 403 }
      );
    }

    // Asignar repartidor a la comanda y cambiar estado a 'activa'
    await client.execute({
      sql: `
        UPDATE comandas 
        SET repartidor_id = ?, estado = 'activa', updated_at = datetime('now')
        WHERE id = ? AND repartidor_id IS NULL AND estado = 'en_proceso'
      `,
      args: [session.user.id, comanda_id]
    });

    // Verificar que la actualización fue exitosa
    const verificacionResult = await client.execute({
      sql: 'SELECT id, estado, repartidor_id FROM comandas WHERE id = ?',
      args: [comanda_id]
    });

    if (verificacionResult.rows.length === 0 || 
        verificacionResult.rows[0].estado !== 'activa' || 
        Number(verificacionResult.rows[0].repartidor_id) !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Error al asignar comanda, puede que ya esté tomada' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Comanda asignada exitosamente'
    });

  } catch (error) {
    console.error('Error asignando comanda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}