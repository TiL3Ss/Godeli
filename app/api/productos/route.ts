// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getTursoClient } from '../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tienda_id');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tienda_id requerido' }, { status: 400 });
    }

    const client = getTursoClient();
    
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
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      activo: Boolean(row.activo),
      created_at: row.created_at
    }));

    return NextResponse.json(productos);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}