// app/api/comandas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';

// Actualizar estado de comanda
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    const comandaId = params.id;
    const body = await request.json();
    const { estado, comentario } = body;

    if (!estado) {
      return NextResponse.json(
        { success: false, error: 'Estado requerido' }, 
        { status: 400 }
      );
    }

    // Validar estados permitidos
    const estadosValidos = ['activa', 'en_proceso', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { success: false, error: 'Estado no válido' }, 
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que la comanda existe
    const comandaResult = await client.execute({
      sql: 'SELECT id, estado, tienda_id FROM comandas WHERE id = ?',
      args: [comandaId]
    });

    if (comandaResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comanda no encontrada' }, 
        { status: 404 }
      );
    }

    const comanda = comandaResult.rows[0];

    // Verificar permisos según el tipo de usuario
    if (session.user.tipo === 'tienda') {
      // Las tiendas solo pueden modificar sus propias comandas
      if (session.user.tienda_id && Number(comanda.tienda_id) !== Number(session.user.tienda_id)) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos para modificar esta comanda' }, 
          { status: 403 }
        );
      }
    } else if (session.user.tipo === 'repartidor') {
      // Los repartidores solo pueden cambiar a ciertos estados
      const estadosRepartidor = ['en_proceso', 'completada'];
      if (!estadosRepartidor.includes(estado)) {
        return NextResponse.json(
          { success: false, error: 'Estado no permitido para repartidores' }, 
          { status: 403 }
        );
      }

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
    }

    // Construir query de actualización
    let sql = 'UPDATE comandas SET estado = ?, updated_at = datetime(\'now\')';
    const args = [estado];

    if (comentario) {
      sql += ', comentario_problema = ?';
      args.push(comentario);
    }

    // Si se asigna un repartidor al cambiar a 'en_proceso'
    if (estado === 'en_proceso' && session.user.tipo === 'repartidor') {
      sql += ', repartidor_id = ?';
      args.push(session.user.id);
    }

    sql += ' WHERE id = ?';
    args.push(comandaId);

    await client.execute({ sql, args });

    return NextResponse.json({ 
      success: true, 
      message: 'Estado actualizado correctamente' 
    });

  } catch (error) {
    console.error('Error actualizando comanda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    const comandaId = params.id;
    const client = getTursoClient();

    // Obtener comanda con detalles del repartidor y tienda
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
          r.username as repartidor_username,
          t.nombre as tienda_nombre,
          t.direccion as tienda_direccion,
          t.telefono as tienda_telefono
        FROM comandas c
        LEFT JOIN usuarios r ON c.repartidor_id = r.id
        LEFT JOIN tiendas t ON c.tienda_id = t.id
        WHERE c.id = ?
      `,
      args: [comandaId]
    });

    if (comandaResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comanda no encontrada' }, 
        { status: 404 }
      );
    }

    const comanda = comandaResult.rows[0];

    // Verificar permisos de acceso
    if (session.user.tipo === 'tienda') {
      if (session.user.tienda_id && Number(comanda.tienda_id) !== Number(session.user.tienda_id)) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos para ver esta comanda' }, 
          { status: 403 }
        );
      }
    } else if (session.user.tipo === 'repartidor') {
      // Verificar acceso del repartidor a la tienda
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
    }

    // Obtener productos de la comanda
    const productosResult = await client.execute({
      sql: `
        SELECT 
          cp.id,
          cp.cantidad,
          cp.precio_unitario,
          cp.subtotal,
          p.id as producto_id,
          p.nombre as producto_nombre,
          p.descripcion as producto_descripcion,
          p.precio as producto_precio
        FROM comanda_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.comanda_id = ?
        ORDER BY cp.id
      `,
      args: [comandaId]
    });

    const comandaCompleta = {
      id: Number(comanda.id),
      cliente_nombre: comanda.cliente_nombre,
      cliente_telefono: comanda.cliente_telefono,
      cliente_direccion: comanda.cliente_direccion,
      total: Number(comanda.total),
      estado: comanda.estado,
      comentario_problema: comanda.comentario_problema,
      created_at: comanda.created_at,
      updated_at: comanda.updated_at,
      tienda: {
        id: Number(comanda.tienda_id),
        nombre: comanda.tienda_nombre,
        direccion: comanda.tienda_direccion,
        telefono: comanda.tienda_telefono
      },
      repartidor: comanda.repartidor_id ? {
        id: Number(comanda.repartidor_id),
        nombre: comanda.repartidor_nombre,
        username: comanda.repartidor_username
      } : null,
      productos: productosResult.rows.map(row => ({
        id: Number(row.id),
        cantidad: Number(row.cantidad),
        precio_unitario: Number(row.precio_unitario),
        subtotal: Number(row.subtotal),
        producto: {
          id: Number(row.producto_id),
          nombre: row.producto_nombre,
          descripcion: row.producto_descripcion,
          precio: Number(row.producto_precio)
        }
      }))
    };

    return NextResponse.json({
      success: true,
      data: comandaCompleta
    });

  } catch (error) {
    console.error('Error obteniendo comanda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}