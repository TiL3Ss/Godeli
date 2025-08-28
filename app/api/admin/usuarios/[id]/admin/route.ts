// app/api/admin/usuarios/[id]/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { AD } = await request.json();

    // Validar que el ID sea un número válido
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Validar que AD sea 0 o 1
    if (AD !== 0 && AD !== 1) {
      return NextResponse.json(
        { error: 'Valor de AD debe ser 0 o 1' },
        { status: 400 }
      );
    }

    const client = getTursoClient();

    // Verificar que el usuario existe
    const userCheck = await client.execute({
      sql: 'SELECT id FROM usuarios WHERE id = ?',
      args: [userId]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar los permisos de administrador
    await client.execute({
      sql: 'UPDATE usuarios SET AD = ? WHERE id = ?',
      args: [AD, userId]
    });

    return NextResponse.json({ 
      success: true, 
      message: `Permisos de administrador ${AD === 1 ? 'otorgados' : 'revocados'} correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar permisos de administrador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}