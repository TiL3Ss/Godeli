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
    // Verificar autenticación
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
      // Si es tienda, obtener solo su tienda
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t 
              WHERE t.usuario_id = ?`,
        args: [user.id]
      });
      
      tiendas = result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        direccion: row.direccion,
        telefono: row.telefono,
        created_at: row.created_at
      }));

    } else if (user.tipo === 'repartidor') {
      // Si es repartidor, obtener tiendas asignadas
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t
              INNER JOIN repartidor_tiendas rt ON t.id = rt.tienda_id
              WHERE rt.repartidor_id = ?`,
        args: [user.id]
      });
      
      tiendas = result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        direccion: row.direccion,
        telefono: row.telefono,
        created_at: row.created_at
      }));

    } else {
      // Para otros tipos (si los hay), obtener todas las tiendas
      const result = await tursoClient.execute({
        sql: `SELECT t.id, t.nombre, t.direccion, t.telefono, t.created_at
              FROM tiendas t
              ORDER BY t.nombre`
      });
      
      tiendas = result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        direccion: row.direccion,
        telefono: row.telefono,
        created_at: row.created_at
      }));
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