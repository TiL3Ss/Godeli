import { createClient } from '@libsql/client';

// Singleton para evitar múltiples conexiones
let client: ReturnType<typeof createClient> | null = null;

export function getTursoClient() {
  if (!client) {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    console.log('DB URL exists:', !!dbUrl);
    console.log('Auth Token exists:', !!authToken);
    
    if (!dbUrl || !authToken) {
      throw new Error(`Missing Turso environment variables. DB URL: ${!!dbUrl}, Token: ${!!authToken}`);
    }
    
    client = createClient({
      url: dbUrl,
      authToken: authToken,
    });
  }
  
  return client;
}