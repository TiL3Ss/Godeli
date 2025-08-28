// app/api/admin/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';
import bcrypt from 'bcryptjs';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};


// Obtener todos los usuarios (solo para administradores)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo administradores pueden ver la lista de usuarios
    if (session.user.AD !== 1) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos de administrador' }, 
        { status: 403 }
      );
    }

    const client = getTursoClient();
    
    const result = await client.execute({
      sql: `
        SELECT 
          id,
          username,
          tipo,
          nombre,
          suscripcion,
          AD,
          created_at
        FROM usuarios 
        ORDER BY created_at DESC
      `,
      args: []
    });

    const usuarios = result.rows.map(row => ({
      id: Number(row.id),
      username: row.username,
      tipo: row.tipo,
      nombre: row.nombre,
      suscripcion: Number(row.suscripcion),
      AD: Number(row.AD),
      created_at: row.created_at
    }));

    return NextResponse.json(usuarios);

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Crear nuevo usuario (solo para administradores)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo administradores pueden crear usuarios
    if (session.user.AD !== 1) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos de administrador' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, tipo, nombre, suscripcion, AD } = body;

    // Validaciones
    if (!username || !password || !tipo || !nombre) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos: username, password, tipo, nombre' },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!['tienda', 'repartidor'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo debe ser "tienda" o "repartidor"' },
        { status: 400 }
      );
    }

    // Validar longitud de username
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Validar longitud de password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que no existe un usuario con el mismo username
    const existeResult = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE username = ?',
      args: [username]
    });

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese username' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const result = await client.execute({
      sql: `
        INSERT INTO usuarios (username, password, tipo, nombre, suscripcion, AD, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      args: [
        username, 
        hashedPassword, 
        tipo, 
        nombre, 
        suscripcion ? 1 : 0, 
        AD ? 1 : 0
      ]
    });

    const usuarioId = Number(result.lastInsertRowid);

    // Devolver el usuario creado (sin password)
    const nuevoUsuario = {
      id: usuarioId,
      username,
      tipo,
      nombre,
      suscripcion: suscripcion ? 1 : 0,
      AD: AD ? 1 : 0,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: nuevoUsuario,
      message: 'Usuario creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}