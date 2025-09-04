// app/api/tiendas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = session.user;
    let tiendas = [];

    if (user.tipo === 'tienda') {
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t 
              WHERE t.usuario_id = ?`,
        args: [user.id]
      });

      tiendas = result.rows;
    } else if (user.tipo === 'repartidor') {
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t
              INNER JOIN repartidor_tiendas rt ON t.id = rt.tienda_id
              WHERE rt.repartidor_id = ?`,
        args: [user.id]
      });

      tiendas = result.rows;
    } else {
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t
              ORDER BY t.nombre`
      });

      tiendas = result.rows;
    }

    return NextResponse.json({
      success: true,
      data: tiendas
    });

  } catch (error) {
    console.error('Error al obtener tiendas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = session.user;
    const body = await request.json();
    const { nombre, direccion, telefono } = body;

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre de la tienda es obligatorio' },
        { status: 400 }
      );
    }

    // Insertar tienda asociada al usuario autenticado
    const result = await tursoClient.execute({
      sql: `INSERT INTO tiendas (usuario_id, nombre, direccion, telefono)
            VALUES (?, ?, ?, ?)`,
      args: [user.id, nombre, direccion || null, telefono || null]
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        usuario_id: user.id,
        nombre,
        direccion,
        telefono
      }
    });

  } catch (error) {
    console.error('Error al crear tienda:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
