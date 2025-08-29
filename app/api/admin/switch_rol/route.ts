// app/api/admin/switch_rol/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getTursoClient } from '../../../../lib/turso';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function POST(request: NextRequest) { 
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' }, 
                { status: 401 }
            );
        }

        // Verificar que el usuario tenga permisos de administrador
        if (session.user.AD !== 1) {
            return NextResponse.json(
                { success: false, error: 'Sin permisos de administrador' }, 
                { status: 403 }
            );
        }

        const body = await request.json();
        const { tipo } = body;

        // Validar que el tipo sea válido
        if (!tipo || !['tienda', 'repartidor'].includes(tipo)) {
            return NextResponse.json(
                { success: false, error: 'Tipo debe ser "tienda" o "repartidor"' },
                { status: 400 }
            );
        }

        const client = getTursoClient();
        
        // Verificar que el usuario existe y tiene AD=1
        const userResult = await client.execute({
            sql: 'SELECT id, AD, tipo FROM usuarios WHERE id = ?',
            args: [session.user.id]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        const user = userResult.rows[0];
        if (Number(user.AD) !== 1) {
            return NextResponse.json(
                { success: false, error: 'Usuario no tiene permisos de administrador' },
                { status: 403 }
            );
        }

        // Actualizar el tipo del usuario
        const updateResult = await client.execute({
            sql: 'UPDATE usuarios SET tipo = ? WHERE id = ?',
            args: [tipo, session.user.id]
        });

        if (updateResult.rowsAffected === 0) {
            return NextResponse.json(
                { success: false, error: 'No se pudo actualizar el usuario' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Rol cambiado exitosamente a ${tipo}`,
            data: {
                userId: session.user.id,
                newRole: tipo
            }
        });

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}