// app/api/comandas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';


// Actualizar estado de comanda
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const comandaId = params.id;
    const body = await request.json();
    const { estado, comentario } = body;

    if (!estado) {
      return NextResponse.json({ error: 'Estado requerido' }, { status: 400 });
    }

    const client = getTursoClient();

    // Verificar que la comanda existe
    const comandaResult = await client.execute({
      sql: 'SELECT id, estado FROM comandas WHERE id = ?',
      args: [comandaId]
    });

    if (comandaResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comanda no encontrada' }, { status: 404 });
    }

    // Actualizar comanda
    let sql = 'UPDATE comandas SET estado = ?, updated_at = datetime(\'now\')';
    const args = [estado];

    if (comentario) {
      sql += ', comentario_problema = ?';
      args.push(comentario);
    }

    // Si se asigna un repartidor
    if (estado === 'en_proceso') {
      sql += ', repartidor_id = ?';
      args.push(session.user.id);
    }

    sql += ' WHERE id = ?';
    args.push(comandaId);

    await client.execute({ sql, args });

    return NextResponse.json({ message: 'Estado actualizado correctamente' });

  } catch (error) {
    console.error('Error actualizando comanda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener detalles de una comanda específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const comandaId = params.id;
    const client = getTursoClient();

    // Obtener comanda con detalles del repartidor
    const comandaResult = await client.execute({
      sql: `
        SELECT 
          c.id,
          c.cliente_nombre,
          c.cliente_telefono,
          c.cliente_direccion,
          c.total,
          c.estado,
          c.comentario_problema,
          c.created_at,
          c.updated_at,
          c.repartidor_id,
          c.tienda_id,
          r.nombre as repartidor_nombre,
          r.telefono as repartidor_telefono,
          t.nombre as tienda_nombre
        FROM comandas c
        LEFT JOIN users r ON c.repartidor_id = r.id
        LEFT JOIN tiendas t ON c.tienda_id = t.id
        WHERE c.id = ?
      `,
      args: [comandaId]
    });

    if (comandaResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comanda no encontrada' }, { status: 404 });
    }

    const comanda = comandaResult.rows[0];

    // Obtener productos de la comanda
    const productosResult = await client.execute({
      sql: `
        SELECT 
          cp.id,
          cp.cantidad,
          cp.precio_unitario,
          p.id as producto_id,
          p.nombre as producto_nombre,
          p.descripcion as producto_descripcion,
          p.precio as producto_precio
        FROM comanda_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.comanda_id = ?
      `,
      args: [comandaId]
    });

    const comandaCompleta = {
      id: comanda.id,
      cliente_nombre: comanda.cliente_nombre,
      cliente_telefono: comanda.cliente_telefono,
      cliente_direccion: comanda.cliente_direccion,
      total: comanda.total,
      estado: comanda.estado,
      comentario_problema: comanda.comentario_problema,
      created_at: comanda.created_at,
      updated_at: comanda.updated_at,
      tienda_id: comanda.tienda_id,
      tienda_nombre: comanda.tienda_nombre,
      repartidor: comanda.repartidor_id ? {
        id: comanda.repartidor_id,
        nombre: comanda.repartidor_nombre,
        telefono: comanda.repartidor_telefono
      } : null,
      productos: productosResult.rows.map(row => ({
        id: row.id,
        cantidad: row.cantidad,
        precio_unitario: row.precio_unitario,
        producto: {
          id: row.producto_id,
          nombre: row.producto_nombre,
          descripcion: row.producto_descripcion,
          precio: row.producto_precio
        }
      }))
    };

    return NextResponse.json(comandaCompleta);

  } catch (error) {
    console.error('Error obteniendo comanda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}