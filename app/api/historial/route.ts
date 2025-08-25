// app/api/historial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getTursoClient } from '../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    const productos = searchParams.get('productos');
    const esRepartidor = searchParams.get('repartidor') === 'true';

    if (!tiendaId) {
      return NextResponse.json({ 
        success: false, 
        error: 'tienda_id requerido' 
      }, { status: 400 });
    }

    const client = getTursoClient();
    
    // Verificar acceso del usuario a la tienda
    if (esRepartidor) {
      // Verificar que el repartidor tiene acceso a esta tienda
      const accessCheck = await client.execute({
        sql: `
          SELECT rt.id 
          FROM repartidor_tiendas rt 
          WHERE rt.repartidor_id = ? AND rt.tienda_id = ?
        `,
        args: [session.user.id, tiendaId]
      });

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No tienes acceso a esta tienda' 
        }, { status: 403 });
      }
    } else {
      // Para tiendas, verificar que el usuario es propietario de la tienda
      const tiendaCheck = await client.execute({
        sql: `
          SELECT t.id 
          FROM tiendas t 
          WHERE t.id = ? AND t.usuario_id = ?
        `,
        args: [tiendaId, session.user.id]
      });

      if (tiendaCheck.rows.length === 0 && session.user.tipo !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: 'No tienes acceso a esta tienda' 
        }, { status: 403 });
      }
    }
    
    let sql = `
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
        u.nombre as repartidor_nombre,
        u.username as repartidor_telefono
      FROM comandas c
      LEFT JOIN usuarios u ON c.repartidor_id = u.id
      WHERE c.tienda_id = ?
    `;
    
    const args = [tiendaId];

    // Filtros adicionales
    if (estado) {
      sql += ' AND c.estado = ?';
      args.push(estado);
    }

    if (fecha) {
      sql += ' AND DATE(c.created_at) = ?';
      args.push(fecha);
    }

    if (esRepartidor) {
      sql += ' AND c.repartidor_id = ?';
      args.push(session.user.id);
    }

    // Si hay filtro por productos, necesitamos JOIN
    if (productos) {
      const productosIds = productos.split(',').map(Number);
      const placeholders = productosIds.map(() => '?').join(',');
      sql += `
        AND c.id IN (
          SELECT DISTINCT cp.comanda_id 
          FROM comanda_productos cp 
          WHERE cp.producto_id IN (${placeholders})
        )
      `;
      args.push(...productosIds);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 100';

    const result = await client.execute({ sql, args });

    const comandas = [];
    
    for (const row of result.rows) {
      // Obtener productos para cada comanda
      const productosResult = await client.execute({
        sql: `
          SELECT 
            cp.id,
            cp.cantidad,
            cp.precio_unitario,
            p.id as producto_id,
            p.nombre as producto_nombre
          FROM comanda_productos cp
          JOIN productos p ON cp.producto_id = p.id
          WHERE cp.comanda_id = ?
        `,
        args: [row.id]
      });

      comandas.push({
        id: row.id,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        cliente_direccion: row.cliente_direccion,
        total: Number(row.total),
        estado: row.estado,
        comentario_problema: row.comentario_problema,
        created_at: row.created_at,
        updated_at: row.updated_at,
        repartidor: row.repartidor_id ? {
          id: row.repartidor_id,
          nombre: row.repartidor_nombre,
          telefono: row.repartidor_telefono || null
        } : null,
        productos: productosResult.rows.map(prodRow => ({
          id: prodRow.id,
          cantidad: Number(prodRow.cantidad),
          precio_unitario: Number(prodRow.precio_unitario),
          producto: {
            id: Number(prodRow.producto_id),
            nombre: prodRow.producto_nombre
          }
        }))
      });
    }

    return NextResponse.json({
      success: true,
      comandas
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}