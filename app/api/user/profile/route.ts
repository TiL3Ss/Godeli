// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const client = getTursoClient();
    
    // Obtener información completa del usuario
    const userResult = await client.execute({
      sql: `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.nombre,
          u.telefono,
          u.tienda_id,
          t.nombre as tienda_nombre,
          t.direccion as tienda_direccion,
          t.telefono as tienda_telefono
        FROM users u
        LEFT JOIN tiendas t ON u.tienda_id = t.id
        WHERE u.id = ?
      `,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Preparar la respuesta con la estructura del perfil
    const userProfile = {
      id: user.id as string,
      username: user.username as string,
      email: user.email as string,
      role: user.role as string,
      nombre: user.nombre as string,
      telefono: user.telefono as string,
      tienda_id: user.tienda_id as number,
      tienda: user.tienda_nombre ? {
        id: user.tienda_id as number,
        nombre: user.tienda_nombre as string,
        direccion: user.tienda_direccion as string,
        telefono: user.tienda_telefono as string,
      } : null,
    };

    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('Error obteniendo perfil del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}