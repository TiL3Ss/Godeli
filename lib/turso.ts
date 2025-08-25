import { createClient } from '@libsql/client';

// Singleton para evitar múltiples conexiones
let client: ReturnType<typeof createClient> | null = null;

export function getTursoClient() {
  if (!client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('Missing Turso environment variables');
    }
    
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  
  return client;
}