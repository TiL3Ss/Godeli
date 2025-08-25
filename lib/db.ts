// lib/db.ts
import { getTursoClient } from './turso';
import { Usuario, Tienda, Comanda, Producto, ComandaFormData, FiltrosHistorial } from '@/types';

const client = getTursoClient();

// Autenticación
export async function loginUser(username: string, password: string) {
  const result = await client.execute({
    sql: `
      SELECT u.*, t.id as tienda_id, t.nombre as tienda_nombre, t.direccion, t.telefono 
      FROM usuarios u 
      LEFT JOIN tiendas t ON u.id = t.usuario_id 
      WHERE u.username = ? AND u.password = ?
    `,
    args: [username, password]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: Number(row.id),
    username: String(row.username),
    tipo: String(row.tipo) as 'tienda' | 'repartidor',
    nombre: String(row.nombre),
    tienda: row.tienda_id ? {
      id: Number(row.tienda_id),
      usuario_id: Number(row.id),
      nombre: String(row.tienda_nombre),
      direccion: row.direccion ? String(row.direccion) : undefined,
      telefono: row.telefono ? String(row.telefono) : undefined,
      created_at: ''
    } : undefined
  };
}

// Obtener tiendas para repartidor
export async function getTiendasRepartidor(repartidorId: number): Promise<Tienda[]> {
  const result = await client.execute({
    sql: `
      SELECT t.* FROM tiendas t
      JOIN repartidor_tiendas rt ON t.id = rt.tienda_id
      WHERE rt.repartidor_id = ?
    `,
    args: [repartidorId]
  });

  return result.rows.map(row => ({
    id: Number(row.id),
    usuario_id: Number(row.usuario_id),
    nombre: String(row.nombre),
    direccion: row.direccion ? String(row.direccion) : undefined,
    telefono: row.telefono ? String(row.telefono) : undefined,
    created_at: String(row.created_at)
  }));
}

// Obtener comandas activas
export async function getComandasActivas(tiendaId: number, esRepartidor = false): Promise<Comanda[]> {
  const sql = esRepartidor ? `
    SELECT c.*, t.nombre as tienda_nombre, u.nombre as repartidor_nombre
    FROM comandas c
    JOIN tiendas t ON c.tienda_id = t.id
    LEFT JOIN usuarios u ON c.repartidor_id = u.id
    WHERE c.tienda_id = ? AND c.estado IN ('activa', 'en_proceso')
    ORDER BY c.created_at DESC
  ` : `
    SELECT c.*, u.nombre as repartidor_nombre
    FROM comandas c
    LEFT JOIN usuarios u ON c.repartidor_id = u.id
    WHERE c.tienda_id = ? AND c.estado IN ('activa', 'en_proceso')
    ORDER BY c.created_at DESC
  `;

  const result = await client.execute({
    sql,
    args: [tiendaId]
  });

  const comandas: Comanda[] = [];
  
  for (const row of result.rows) {
    // Obtener productos de la comanda
    const productosResult = await client.execute({
      sql: `
        SELECT cp.*, p.nombre as producto_nombre, p.descripcion
        FROM comanda_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.comanda_id = ?
      `,
      args: [Number(row.id)]
    });

    const productos = productosResult.rows.map(prodRow => ({
      id: Number(prodRow.id),
      comanda_id: Number(prodRow.comanda_id),
      producto_id: Number(prodRow.producto_id),
      cantidad: Number(prodRow.cantidad),
      precio_unitario: Number(prodRow.precio_unitario),
      subtotal: Number(prodRow.subtotal),
      producto: {
        id: Number(prodRow.producto_id),
        tienda_id: 0,
        nombre: String(prodRow.producto_nombre),
        precio: Number(prodRow.precio_unitario),
        descripcion: prodRow.descripcion ? String(prodRow.descripcion) : undefined,
        activo: true,
        created_at: ''
      }
    }));

    comandas.push({
      id: Number(row.id),
      tienda_id: Number(row.tienda_id),
      repartidor_id: row.repartidor_id ? Number(row.repartidor_id) : undefined,
      cliente_nombre: String(row.cliente_nombre),
      cliente_telefono: row.cliente_telefono ? String(row.cliente_telefono) : undefined,
      cliente_direccion: String(row.cliente_direccion),
      estado: String(row.estado) as any,
      total: Number(row.total),
      comentario_problema: row.comentario_problema ? String(row.comentario_problema) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      productos,
      tienda: esRepartidor ? {
        id: Number(row.tienda_id),
        usuario_id: 0,
        nombre: String(row.tienda_nombre),
        created_at: ''
      } : undefined,
      repartidor: row.repartidor_nombre ? {
        id: Number(row.repartidor_id),
        username: '',
        tipo: 'repartidor' as const,
        nombre: String(row.repartidor_nombre),
        created_at: ''
      } : undefined
    });
  }

  return comandas;
}

// Obtener productos de una tienda
export async function getProductosTienda(tiendaId: number): Promise<Producto[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM productos WHERE tienda_id = ? AND activo = TRUE ORDER BY nombre',
    args: [tiendaId]
  });

  return result.rows.map(row => ({
    id: Number(row.id),
    tienda_id: Number(row.tienda_id),
    nombre: String(row.nombre),
    precio: Number(row.precio),
    descripcion: row.descripcion ? String(row.descripcion) : undefined,
    activo: Boolean(row.activo),
    created_at: String(row.created_at)
  }));
}

// Crear comanda
export async function crearComanda(tiendaId: number, data: ComandaFormData): Promise<number> {
  const total = await calcularTotalComanda(data.productos);
  
  const result = await client.execute({
    sql: `
      INSERT INTO comandas (tienda_id, cliente_nombre, cliente_telefono, cliente_direccion, total)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [tiendaId, data.cliente_nombre, data.cliente_telefono, data.cliente_direccion, total]
  });

  const comandaId = Number(result.lastInsertRowid);

  // Insertar productos de la comanda
  for (const item of data.productos) {
    const producto = await getProducto(item.producto_id);
    if (producto) {
      const subtotal = producto.precio * item.cantidad;
      await client.execute({
        sql: `
          INSERT INTO comanda_productos (comanda_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [comandaId, item.producto_id, item.cantidad, producto.precio, subtotal]
      });
    }
  }

  return comandaId;
}

async function getProducto(id: number): Promise<Producto | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM productos WHERE id = ?',
    args: [id]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: Number(row.id),
    tienda_id: Number(row.tienda_id),
    nombre: String(row.nombre),
    precio: Number(row.precio),
    descripcion: row.descripcion ? String(row.descripcion) : undefined,
    activo: Boolean(row.activo),
    created_at: String(row.created_at)
  };
}

async function calcularTotalComanda(productos: Array<{ producto_id: number; cantidad: number }>): Promise<number> {
  let total = 0;
  for (const item of productos) {
    const producto = await getProducto(item.producto_id);
    if (producto) {
      total += producto.precio * item.cantidad;
    }
  }
  return total;
}

// Actualizar estado de comanda
export async function actualizarEstadoComanda(
  comandaId: number, 
  estado: string, 
  comentario?: string
): Promise<void> {
  await client.execute({
    sql: `
      UPDATE comandas 
      SET estado = ?, comentario_problema = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
    args: [estado, comentario || null, comandaId]
  });
}

// Obtener historial con filtros
export async function getHistorialComandas(
  tiendaId: number, 
  filtros: FiltrosHistorial = {},
  esRepartidor = false
): Promise<Comanda[]> {
  let sql = `
    SELECT c.*, t.nombre as tienda_nombre, u.nombre as repartidor_nombre
    FROM comandas c
    ${esRepartidor ? 'JOIN' : 'LEFT JOIN'} tiendas t ON c.tienda_id = t.id
    LEFT JOIN usuarios u ON c.repartidor_id = u.id
    WHERE c.tienda_id = ?
  `;
  
  const args: any[] = [tiendaId];
  
  if (filtros.estado) {
    sql += ' AND c.estado = ?';
    args.push(filtros.estado);
  }
  
  if (filtros.fecha) {
    sql += ' AND DATE(c.created_at) = ?';
    args.push(filtros.fecha);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  
  const result = await client.execute({ sql, args });
  
  const comandas: Comanda[] = [];
  
  for (const row of result.rows) {
    // Obtener productos si hay filtro de productos
    const productosResult = await client.execute({
      sql: `
        SELECT cp.*, p.nombre as producto_nombre, p.descripcion
        FROM comanda_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.comanda_id = ?
      `,
      args: [Number(row.id)]
    });

    const productos = productosResult.rows.map(prodRow => ({
      id: Number(prodRow.id),
      comanda_id: Number(prodRow.comanda_id),
      producto_id: Number(prodRow.producto_id),
      cantidad: Number(prodRow.cantidad),
      precio_unitario: Number(prodRow.precio_unitario),
      subtotal: Number(prodRow.subtotal),
      producto: {
        id: Number(prodRow.producto_id),
        tienda_id: 0,
        nombre: String(prodRow.producto_nombre),
        precio: Number(prodRow.precio_unitario),
        descripcion: prodRow.descripcion ? String(prodRow.descripcion) : undefined,
        activo: true,
        created_at: ''
      }
    }));

    // Filtrar por productos si se especifica
    if (filtros.productos && filtros.productos.length > 0) {
      const tieneProductoFiltrado = productos.some(p => 
        filtros.productos!.includes(p.producto_id)
      );
      if (!tieneProductoFiltrado) continue;
    }

    comandas.push({
      id: Number(row.id),
      tienda_id: Number(row.tienda_id),
      repartidor_id: row.repartidor_id ? Number(row.repartidor_id) : undefined,
      cliente_nombre: String(row.cliente_nombre),
      cliente_telefono: row.cliente_telefono ? String(row.cliente_telefono) : undefined,
      cliente_direccion: String(row.cliente_direccion),
      estado: String(row.estado) as any,
      total: Number(row.total),
      comentario_problema: row.comentario_problema ? String(row.comentario_problema) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      productos,
      tienda: esRepartidor ? {
        id: Number(row.tienda_id),
        usuario_id: 0,
        nombre: String(row.tienda_nombre),
        created_at: ''
      } : undefined,
      repartidor: row.repartidor_nombre ? {
        id: Number(row.repartidor_id),
        username: '',
        tipo: 'repartidor' as const,
        nombre: String(row.repartidor_nombre),
        created_at: ''
      } : undefined
    });
  }

  return comandas;
}