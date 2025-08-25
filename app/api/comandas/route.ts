// app/api/comandas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/[...nextauth]/route';
import { getTursoClient } from '../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');
    const activas = searchParams.get('activas') === 'true';
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

    if (activas) {
      sql += " AND c.estado IN ('activa', 'en_proceso')";
    }

    if (esRepartidor) {
      sql += " AND c.repartidor_id = ?";
      args.push(session.user.id);
    }

    sql += " ORDER BY c.created_at DESC";

    const result = await client.execute({ sql, args });

    const comandas = result.rows.map(row => ({
      id: row.id,
      cliente_nombre: row.cliente_nombre,
      cliente_telefono: row.cliente_telefono,
      cliente_direccion: row.cliente_direccion,
      total: row.total,
      estado: row.estado,
      comentario_problema: row.comentario_problema,
      created_at: row.created_at,
      updated_at: row.updated_at,
      repartidor: row.repartidor_id ? {
        id: row.repartidor_id,
        nombre: row.repartidor_nombre,
        telefono: row.repartidor_telefono
      } : null
    }));

    // Obtener productos para cada comanda
    for (const comanda of comandas) {
      const productosResult = await client.execute({
        sql: `
          SELECT 
            cp.id,
            cp.cantidad,
            cp.precio_unitario,
            p.nombre as producto_nombre,
            p.precio as producto_precio
          FROM comanda_productos cp
          JOIN productos p ON cp.producto_id = p.id
          WHERE cp.comanda_id = ?
        `,
        args: [comanda.id]
      });

      comanda.productos = productosResult.rows.map(row => ({
        id: row.id,
        cantidad: row.cantidad,
        precio_unitario: row.precio_unitario,
        producto: {
          id: row.producto_id,
          nombre: row.producto_nombre,
          precio: row.producto_precio
        }
      }));
    }

    return NextResponse.json(comandas);

  } catch (error) {
    console.error('Error obteniendo comandas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear nueva comanda
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { tienda_id, cliente_nombre, cliente_telefono, cliente_direccion, productos } = body;

    if (!tienda_id || !cliente_nombre || !cliente_direccion || !productos?.length) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Calcular total
    let total = 0;
    for (const item of productos) {
      const productoResult = await client.execute({
        sql: 'SELECT precio FROM productos WHERE id = ?',
        args: [item.producto_id]
      });
      
      if (productoResult.rows.length > 0) {
        total += Number(productoResult.rows[0].precio) * item.cantidad;
      }
    }

    // Crear comanda
    const comandaResult = await client.execute({
      sql: `
        INSERT INTO comandas (
          tienda_id, cliente_nombre, cliente_telefono, cliente_direccion, 
          total, estado, created_at
        ) VALUES (?, ?, ?, ?, ?, 'activa', datetime('now'))
      `,
      args: [tienda_id, cliente_nombre, cliente_telefono || '', cliente_direccion, total]
    });

    const comandaId = comandaResult.lastInsertRowid;

    // Agregar productos
    for (const item of productos) {
      const productoResult = await client.execute({
        sql: 'SELECT precio FROM productos WHERE id = ?',
        args: [item.producto_id]
      });

      if (productoResult.rows.length > 0) {
        const precioUnitario = productoResult.rows[0].precio;
        await client.execute({
          sql: `
            INSERT INTO comanda_productos (comanda_id, producto_id, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
          `,
          args: [comandaId, item.producto_id, item.cantidad, precioUnitario]
        });
      }
    }

    return NextResponse.json({ 
      id: comandaId,
      message: 'Comanda creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creando comanda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}