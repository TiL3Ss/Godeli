// app/api/historial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { getTursoClient } from '../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    const productos = searchParams.get('productos');
    const esRepartidor = searchParams.get('repartidor') === 'true';

    if (!tiendaId) {
      return NextResponse.json({ error: 'tienda_id requerido' }, { status: 400 });
    }

    const client = getTursoClient();
    
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
        r.nombre as repartidor_nombre,
        r.telefono as repartidor_telefono
      FROM comandas c
      LEFT JOIN users r ON c.repartidor_id = r.id
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
          telefono: row.repartidor_telefono
        } : null,
        productos: productosResult.rows.map(prodRow => ({
          id: prodRow.id,
          cantidad: prodRow.cantidad,
          precio_unitario: Number(prodRow.precio_unitario),
          producto: {
            id: prodRow.producto_id,
            nombre: prodRow.producto_nombre
          }
        }))
      });
    }

    return NextResponse.json(comandas);

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}