// app/api/productos/route.ts
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

    if (!tiendaId) {
      return NextResponse.json(
        { success: false, error: 'tienda_id requerido' }, 
        { status: 400 }
      );
    }

    const client = getTursoClient();
    
    // Verificar permisos de acceso a la tienda
    if (session.user.tipo === 'tienda') {
      // Las tiendas solo pueden ver sus propios productos
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
    
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          nombre,
          descripcion,
          precio,
          activo,
          created_at
        FROM productos 
        WHERE tienda_id = ? AND activo = 1
        ORDER BY nombre ASC
      `,
      args: [tiendaId]
    });

    const productos = result.rows.map(row => ({
      id: Number(row.id),
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      activo: Boolean(row.activo),
      created_at: row.created_at
    }));

    return NextResponse.json({
      success: true,
      data: productos
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo las tiendas pueden crear productos
    if (session.user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo las tiendas pueden crear productos' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tienda_id, nombre, descripcion, precio } = body;

    if (!tienda_id || !nombre || !precio) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos: tienda_id, nombre, precio' },
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

    // Validar precio
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'El precio debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que no existe un producto con el mismo nombre en la tienda
    const existeResult = await client.execute({
      sql: 'SELECT id FROM productos WHERE tienda_id = ? AND nombre = ? AND activo = 1',
      args: [tienda_id, nombre]
    });

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese nombre' },
        { status: 400 }
      );
    }

    // Crear producto
    const result = await client.execute({
      sql: `
        INSERT INTO productos (tienda_id, nombre, descripcion, precio, activo, created_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
      `,
      args: [tienda_id, nombre, descripcion || '', precioNum]
    });

    const productoId = result.lastInsertRowid;

    return NextResponse.json({
      success: true,
      data: {
        id: productoId,
        nombre,
        descripcion: descripcion || '',
        precio: precioNum,
        activo: true
      },
      message: 'Producto creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar producto
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo las tiendas pueden actualizar productos
    if (session.user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo las tiendas pueden actualizar productos' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, nombre, descripcion, precio, activo } = body;

    if (!id || !nombre || precio === undefined) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos: id, nombre, precio' },
        { status: 400 }
      );
    }

    // Validar precio
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'El precio debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que el producto existe y pertenece a la tienda del usuario
    const productoResult = await client.execute({
      sql: 'SELECT tienda_id FROM productos WHERE id = ?',
      args: [id]
    });

    if (productoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const producto = productoResult.rows[0];
    if (session.user.tienda_id && Number(producto.tienda_id) !== Number(session.user.tienda_id)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para modificar este producto' }, 
        { status: 403 }
      );
    }

    // Verificar que no existe otro producto con el mismo nombre en la tienda
    const existeResult = await client.execute({
      sql: 'SELECT id FROM productos WHERE tienda_id = ? AND nombre = ? AND id != ? AND activo = 1',
      args: [producto.tienda_id, nombre, id]
    });

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe otro producto con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar producto
    await client.execute({
      sql: `
        UPDATE productos 
        SET nombre = ?, descripcion = ?, precio = ?, activo = ?
        WHERE id = ?
      `,
      args: [nombre, descripcion || '', precioNum, activo !== false ? 1 : 0, id]
    });

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar producto (marcar como inactivo)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo las tiendas pueden eliminar productos
    if (session.user.tipo !== 'tienda') {
      return NextResponse.json(
        { success: false, error: 'Solo las tiendas pueden eliminar productos' }, 
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del producto requerido' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que el producto existe y pertenece a la tienda del usuario
    const productoResult = await client.execute({
      sql: 'SELECT tienda_id FROM productos WHERE id = ?',
      args: [id]
    });

    if (productoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const producto = productoResult.rows[0];
    if (session.user.tienda_id && Number(producto.tienda_id) !== Number(session.user.tienda_id)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar este producto' }, 
        { status: 403 }
      );
    }

    // Marcar como inactivo en lugar de eliminar físicamente
    await client.execute({
      sql: 'UPDATE productos SET activo = 0 WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}