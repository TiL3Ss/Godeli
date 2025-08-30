// api/admin/editar_usuario/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';
import bcrypt from 'bcryptjs';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Actualizar usuario existente (solo para administradores)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo administradores pueden editar usuarios
    if (session.user.AD !== 1) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos de administrador' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, username, password, tipo, nombre, suscripcion, AD } = body;

    // Validaciones básicas
    if (!id || !username || !tipo || !nombre) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos: id, username, tipo, nombre' },
        { status: 400 }
      );
    }

    // Validar que el ID sea un número válido
    const usuarioId = Number(id);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
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

    // Validar longitud de password si se proporciona
    if (password && password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que el usuario existe
    const usuarioExistente = await client.execute({
      sql: 'SELECT id, username FROM usuarios WHERE id = ?',
      args: [usuarioId]
    });

    if (usuarioExistente.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no existe otro usuario con el mismo username (excepto el actual)
    const usernameExistente = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE username = ? AND id != ?',
      args: [username, usuarioId]
    });

    if (usernameExistente.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe otro usuario con ese username' },
        { status: 400 }
      );
    }

    // Preparar la query de actualización
    let updateQuery = '';
    let updateArgs: any[] = [];

    if (password) {
      // Si se proporciona nueva contraseña, incluirla en la actualización
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery = `
        UPDATE usuarios 
        SET username = ?, password = ?, tipo = ?, nombre = ?, suscripcion = ?, AD = ?
        WHERE id = ?
      `;
      updateArgs = [
        username,
        hashedPassword,
        tipo,
        nombre,
        suscripcion ? 1 : 0,
        AD ? 1 : 0,
        usuarioId
      ];
    } else {
      // Si no se proporciona contraseña, no actualizarla
      updateQuery = `
        UPDATE usuarios 
        SET username = ?, tipo = ?, nombre = ?, suscripcion = ?, AD = ?
        WHERE id = ?
      `;
      updateArgs = [
        username,
        tipo,
        nombre,
        suscripcion ? 1 : 0,
        AD ? 1 : 0,
        usuarioId
      ];
    }

    // Ejecutar la actualización
    const result = await client.execute({
      sql: updateQuery,
      args: updateArgs
    });

    // Verificar que se actualizó correctamente
    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudo actualizar el usuario' },
        { status: 500 }
      );
    }

    // Obtener el usuario actualizado para devolverlo
    const usuarioActualizado = await client.execute({
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
        WHERE id = ?
      `,
      args: [usuarioId]
    });

    if (usuarioActualizado.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener usuario actualizado' },
        { status: 500 }
      );
    }

    const usuario = usuarioActualizado.rows[0];
    const usuarioResponse = {
      id: Number(usuario.id),
      username: usuario.username,
      tipo: usuario.tipo,
      nombre: usuario.nombre,
      suscripcion: Number(usuario.suscripcion),
      AD: Number(usuario.AD),
      created_at: usuario.created_at
    };

    return NextResponse.json({
      success: true,
      data: usuarioResponse,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Método GET para obtener un usuario específico (opcional, para debugging)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' }, 
        { status: 401 }
      );
    }

    // Solo administradores pueden ver detalles de usuarios
    if (session.user.AD !== 1) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos de administrador' }, 
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const usuarioId = Number(id);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
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
        WHERE id = ?
      `,
      args: [usuarioId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const usuario = result.rows[0];
    const usuarioResponse = {
      id: Number(usuario.id),
      username: usuario.username,
      tipo: usuario.tipo,
      nombre: usuario.nombre,
      suscripcion: Number(usuario.suscripcion),
      AD: Number(usuario.AD),
      created_at: usuario.created_at
    };

    return NextResponse.json({
      success: true,
      data: usuarioResponse
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}