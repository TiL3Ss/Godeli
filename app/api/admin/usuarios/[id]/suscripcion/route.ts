// app/api/admin/usuarios/[id]/suscripcion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';
import { adminAuth } from '@/middleware/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verificar permisos de administrador
  const authError = await adminAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const { suscripcion } = await request.json();

    // Validar que el ID sea un número válido
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Validar que suscripcion sea 0 o 1
    if (suscripcion !== 0 && suscripcion !== 1) {
      return NextResponse.json(
        { error: 'Valor de suscripción debe ser 0 o 1' },
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

    // Actualizar la suscripción
    await client.execute({
      sql: 'UPDATE usuarios SET suscripcion = ? WHERE id = ?',
      args: [suscripcion, userId]
    });

    return NextResponse.json({ 
      success: true, 
      message: `Suscripción ${suscripcion === 1 ? 'activada' : 'desactivada'} correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}// app/api/admin/usuarios/[id]/suscripcion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { suscripcion } = await request.json();

    // Validar que el ID sea un número válido
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Validar que suscripcion sea 0 o 1
    if (suscripcion !== 0 && suscripcion !== 1) {
      return NextResponse.json(
        { error: 'Valor de suscripción debe ser 0 o 1' },
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

    // Actualizar la suscripción
    await client.execute({
      sql: 'UPDATE usuarios SET suscripcion = ? WHERE id = ?',
      args: [suscripcion, userId]
    });

    return NextResponse.json({ 
      success: true, 
      message: `Suscripción ${suscripcion === 1 ? 'activada' : 'desactivada'} correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}