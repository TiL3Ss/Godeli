// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const client = getTursoClient();
    
    // Obtener información básica del usuario
    const userResult = await client.execute({
      sql: `SELECT id, username, email, role FROM users WHERE id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const userProfile: any = {
      id: user.id?.toString(),
      username: user.username as string,
      email: user.email as string,
      role: user.role as string,
    };

    // Si es una tienda, obtener información adicional
    if (user.role === 'tienda') {
      const tiendaResult = await client.execute({
        sql: `SELECT u.nombre, u.telefono, u.tienda_id, t.nombre as tienda_nombre, t.direccion, t.telefono as tienda_telefono
              FROM users u
              LEFT JOIN tiendas t ON u.tienda_id = t.id
              WHERE u.id = ?`,
        args: [session.user.id]
      });

      if (tiendaResult.rows.length > 0) {
        const tiendaData = tiendaResult.rows[0];
        userProfile.nombre = tiendaData.nombre as string;
        userProfile.telefono = tiendaData.telefono as string;
        userProfile.tienda_id = tiendaData.tienda_id as number;
        
        if (tiendaData.tienda_id) {
          userProfile.tienda = {
            id: tiendaData.tienda_id as number,
            nombre: tiendaData.tienda_nombre as string,
            direccion: tiendaData.direccion as string,
            telefono: tiendaData.tienda_telefono as string,
          };
        }
      }
    }
    
    // Si es un repartidor, obtener información adicional
    if (user.role === 'repartidor') {
      const repartidorResult = await client.execute({
        sql: `SELECT nombre, telefono FROM users WHERE id = ?`,
        args: [session.user.id]
      });

      if (repartidorResult.rows.length > 0) {
        const repartidorData = repartidorResult.rows[0];
        userProfile.nombre = repartidorData.nombre as string;
        userProfile.telefono = repartidorData.telefono as string;
      }
    }

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Error en GET /api/user/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}