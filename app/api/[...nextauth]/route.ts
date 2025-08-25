// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getTursoClient } from '../../../lib/turso';
import bcrypt from 'bcryptjs';
import { DefaultSession } from 'next-auth';

// Constantes para mejor legibilidad
const SESSION_MAX_AGE = 60 * 60 * 3; 
const SESSION_UPDATE_AGE = 30 * 60; 
const JWT_EXPIRATION = 3 * 60 * 60 * 1000; 

export const authOptions = { 
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<"identifier" | "password", string> | undefined) {
        try {
          // Validar que las credenciales existen
          if (!credentials?.identifier || !credentials?.password) {
            console.log('Credenciales faltantes');
            return null;
          }

          const normalizedIdentifier = credentials.identifier.toLowerCase().trim();
          console.log('Intentando autenticar:', normalizedIdentifier);

          const client = getTursoClient();
          
          // Consulta mejorada con manejo de errores
          const result = await client.execute({
            sql: 'SELECT id, username, email, password, role FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
            args: [normalizedIdentifier, normalizedIdentifier]
          });

          console.log('Resultado de la consulta:', result.rows.length, 'filas encontradas');

          if (result.rows.length === 0) {
            console.log('Usuario no encontrado');
            return null;
          }

          const user = result.rows[0];
          console.log('Usuario encontrado:', user.username);

          // Verificar contraseña
          const passwordMatch = await bcrypt.compare(credentials.password, user.password as string);
          
          if (!passwordMatch) {
            console.log('Contraseña incorrecta');
            return null;
          }

          console.log('Autenticación exitosa');
          
          // Retornar usuario autenticado
          return {
            id: user.id.toString(),
            name: user.username as string,
            email: user.email as string,
            role: user.role as string,
          };

        } catch (error) {
          console.error('Error en authorize:', error);
          // Es importante NO lanzar el error aquí, sino retornar null
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user?: any; trigger?: string }) {
      try {
        // Si es un nuevo login
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.role = user.role;
          token.accessTokenExpires = Date.now() + JWT_EXPIRATION;
          console.log('JWT: Nuevo login para usuario:', user.name);
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
      } catch (error) {
        console.error('Error en JWT callback:', error);
        return token;
      }
    },
    
    async session({ session, token }: { session: any; token: any }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.role = token.role as string;
          session.accessTokenExpires = token.accessTokenExpires;
          
          if (token.accessTokenExpires) {
            session.expires = new Date(token.accessTokenExpires).toISOString();
          }
        }
        return session;
      } catch (error) {
        console.error('Error en session callback:', error);
        return session;
      }
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
    error: '/', // Redirigir errores al login
  },
  events: {
    async session({ session, token }) {
      console.log('Session event - Usuario:', session?.user?.name);
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn event - Usuario:', user?.name);
      return true;
    },
  },
  debug: process.env.NODE_ENV === 'development', // Habilitar debug en desarrollo
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Declaraciones de módulos para TypeScript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    } & DefaultSession['user'];
    accessTokenExpires?: number;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: string;
    accessTokenExpires?: number;
  }
}