// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { DefaultSession } from 'next-auth';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Constantes para mejor legibilidad
const SESSION_MAX_AGE = 60 * 60 * 3; // 3 horas
const SESSION_UPDATE_AGE = 30 * 60; // 30 minutos
const JWT_EXPIRATION = 3 * 60 * 60 * 1000; // 3 horas en milisegundos

export const authOptions = { 
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<"identifier" | "password", string> | undefined) {
        if (!credentials?.identifier || !credentials?.password) {
          console.log('Faltan credenciales');
          return null;
        }

        try {
          const normalizedIdentifier = credentials.identifier.toLowerCase();
          console.log('Buscando usuario:', normalizedIdentifier);
          
          // Consulta para tu esquema específico
          const result = await tursoClient.execute({
            sql: `SELECT u.id, u.username, u.password, u.tipo, u.nombre,
                         t.id as tienda_id, t.nombre as tienda_nombre, t.direccion, t.telefono
                  FROM usuarios u
                  LEFT JOIN tiendas t ON u.id = t.usuario_id
                  WHERE LOWER(u.username) = ?`,
            args: [normalizedIdentifier]
          });

          if (result.rows.length === 0) {
            console.log('Usuario no encontrado');
            return null;
          }

          const user = result.rows[0];
          console.log('Usuario encontrado:', user.username, 'tipo:', user.tipo);

          // Para este ejemplo, asumiendo que las contraseñas están en texto plano
          // En producción deberías usar bcrypt
          const passwordMatch = credentials.password === user.password;
          // const passwordMatch = await bcrypt.compare(credentials.password, user.password as string);

          if (!passwordMatch) {
            console.log('Contraseña incorrecta');
            return null;
          }

          console.log('Autenticación exitosa para:', user.username);

          // Retornar todos los datos necesarios
          const userData = {
            id: user.id.toString(),
            name: user.nombre as string,
            username: user.username as string,
            tipo: user.tipo as string, // 'tienda' o 'repartidor'
            tienda_id: user.tienda_id ? Number(user.tienda_id) : null,
          };

          // Si es una tienda, agregar datos de la tienda
          if (user.tipo === 'tienda' && user.tienda_id) {
            userData['tienda'] = {
              id: Number(user.tienda_id),
              nombre: user.tienda_nombre as string,
              direccion: user.direccion as string,
              telefono: user.telefono as string,
            };
          }

          return userData;
        } catch (error) {
          console.error('Error en autorización:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user?: any; trigger?: string }) {
      // Si es un nuevo login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.tipo = user.tipo;
        token.tienda_id = user.tienda_id;
        token.tienda = user.tienda;
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION;
        console.log('JWT: Nuevo login para usuario:', user.username, 'tipo:', user.tipo);
      }
      
      // Si es una actualización manual
      if (trigger === 'update') {
        console.log('JWT: Extendiendo sesión por update()');
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION;
        return token;
      }
      
      // Verificar si el token está próximo a expirar
      if (token.accessTokenExpires && Date.now() > (token.accessTokenExpires - (30 * 60 * 1000))) {
        console.log('JWT: Token próximo a expirar, refrescando...');
        token.accessTokenExpires = Date.now() + JWT_EXPIRATION;
      }
      
      return token;
    },
    
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.tipo = token.tipo as string;
        session.user.tienda_id = token.tienda_id as number;
        session.user.tienda = token.tienda;
        session.accessTokenExpires = token.accessTokenExpires;
        
        if (token.accessTokenExpires) {
          session.expires = new Date(token.accessTokenExpires).toISOString();
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/', 
  },
  events: {
    async session({ session }) {
      console.log('Session event - Usuario:', session?.user?.username, 'tipo:', session?.user?.tipo);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Declaraciones de módulos para TypeScript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      tipo: string;
      tienda_id?: number;
      tienda?: {
        id: number;
        nombre: string;
        direccion: string;
        telefono: string;
      };
    } & DefaultSession['user'];
    accessTokenExpires?: number;
  }

  interface User {
    id: string;
    name: string;
    username: string;
    tipo: string;
    tienda_id?: number;
    tienda?: {
      id: number;
      nombre: string;
      direccion: string;
      telefono: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    username: string;
    tipo: string;
    tienda_id?: number;
    tienda?: {
      id: number;
      nombre: string;
      direccion: string;
      telefono: string;
    };
    accessTokenExpires?: number;
  }
}