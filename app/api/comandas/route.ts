// app/api/comandas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getTursoClient } from '../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');
    const activas = searchParams.get('activas') === 'true';
    const esRepartidor = searchParams.get('repartidor') === 'true';
    
    // Filtros adicionales para historial
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    const productos = searchParams.get('productos');

    if (!tiendaId) {
      return NextResponse.json(
        { success: false, error: 'tienda_id requerido' }, 
        { status: 400 }
      );
    }

    const client = getTursoClient();
    
    // Verificar permisos de acceso a la tienda
    if (session.user.tipo === 'tienda') {
      // Las tiendas solo pueden ver sus propias comandas
      if (session.user.tienda_id && Number(tiendaId) !== Number(session.user.tienda_id)) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos para esta tienda' }, 
          { status: 403 }
        );
      }
    } else if (session.user.tipo === 'repartidor') {
      // Verificar que el repartidor tiene acceso a esta tienda
      const accesoResult = await client.execute({
        sql: `
          SELECT rt.id 
          FROM repartidor_tiendas rt 
          WHERE rt.repartidor_id = ? AND rt.tienda_id = ?
        `,
        args: [session.user.id, tiendaId]
      });

      if (accesoResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Sin acceso a esta tienda' }, 
          { status: 403 }
        );
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

    // Solo filtrar por comandas activas si se especifica explícitamente
    if (activas) {
      sql += " AND c.estado IN ('activa', 'en_proceso')";
    }

    // Filtro por estado específico (para historial)
    if (estado) {
      sql += ' AND c.estado = ?';
      args.push(estado);
    }

    // Filtro por fecha (para historial)
    if (fecha) {
      sql += ' AND DATE(c.created_at) = ?';
      args.push(fecha);
    }

    // Para repartidores, solo sus comandas asignadas
    if (esRepartidor) {
      sql += ' AND c.repartidor_id = ?';
      args.push(session.user.id);
    }

    // Filtro por productos (para historial)
    if (productos) {
      const productosIds = productos.split(',').map(Number).filter(id => !isNaN(id));
      if (productosIds.length > 0) {
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
    }

    sql += ' ORDER BY c.created_at DESC';

    // Limitar resultados solo si no hay filtros específicos aplicados
    if (!estado && !fecha && !productos) {
      sql += ' LIMIT 100';
    }

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
            cp.producto_id,
            p.nombre as producto_nombre,
            p.precio as producto_precio
          FROM comanda_productos cp
          JOIN productos p ON cp.producto_id = p.id
          WHERE cp.comanda_id = ?
          ORDER BY cp.id
        `,
        args: [row.id]
      });

      comandas.push({
        id: Number(row.id),
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        cliente_direccion: row.cliente_direccion,
        total: Number(row.total),
        estado: row.estado,
        comentario_problema: row.comentario_problema,
        created_at: row.created_at,
        updated_at: row.updated_at,
        repartidor: row.repartidor_id ? {
          id: Number(row.repartidor_id),
          nombre: row.repartidor_nombre,
          telefono: row.repartidor_telefono
        } : null,
        productos: productosResult.rows.map(prodRow => ({
          id: Number(prodRow.id),
          cantidad: Number(prodRow.cantidad),
          precio_unitario: Number(prodRow.precio_unitario),
          producto: {
            id: Number(prodRow.producto_id),
            nombre: prodRow.producto_nombre,
            precio: Number(prodRow.producto_precio)
          }
        }))
      });
    }

    return NextResponse.json({
      success: true,
      data: comandas
    });

  } catch (error) {
    console.error('Error obteniendo comandas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear nueva comanda
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo las tiendas pueden crear comandas
    if (session.user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo las tiendas pueden crear comandas' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tienda_id, cliente_nombre, cliente_telefono, cliente_direccion, productos } = body;

    if (!tienda_id || !cliente_nombre || !cliente_direccion || !productos?.length) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Verificar que la tienda pertenece al usuario
    if (session.user.tienda_id && Number(tienda_id) !== Number(session.user.tienda_id)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para esta tienda' }, 
        { status: 403 }
      );
    }

    const client = getTursoClient();

    // Calcular total y validar productos
    let total = 0;
    const productosValidos = [];
    
    for (const item of productos) {
      if (!item.producto_id || !item.cantidad || item.cantidad <= 0) {
        return NextResponse.json(
          { success: false, error: 'Datos de producto inválidos' },
          { status: 400 }
        );
      }

      const productoResult = await client.execute({
        sql: 'SELECT precio FROM productos WHERE id = ? AND tienda_id = ? AND activo = TRUE',
        args: [item.producto_id, tienda_id]
      });
      
      if (productoResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Producto ${item.producto_id} no encontrado o inactivo` },
          { status: 400 }
        );
      }

      const precio = Number(productoResult.rows[0].precio);
      const subtotal = precio * item.cantidad;
      total += subtotal;

      productosValidos.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precio,
        subtotal: subtotal
      });
    }

    // Crear comanda
    const comandaResult = await client.execute({
      sql: `
        INSERT INTO comandas (
          tienda_id, cliente_nombre, cliente_telefono, cliente_direccion, 
          total, estado, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'en_proceso', datetime('now'), datetime('now'))
      `,
      args: [tienda_id, cliente_nombre, cliente_telefono || '', cliente_direccion, total]
    });

    // CORRECCIÓN: Convertir BigInt a Number
    const comandaId = Number(comandaResult.lastInsertRowid);

    // Agregar productos
    for (const item of productosValidos) {
      await client.execute({
        sql: `
          INSERT INTO comanda_productos (comanda_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [comandaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
      });
    }

    return NextResponse.json({ 
      success: true,
      data: {
        id: comandaId, 
        total: total
      },
      message: 'Comanda creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creando comanda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}