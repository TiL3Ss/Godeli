// lib/turso.ts
import { createClient } from "@libsql/client";

let client: ReturnType<typeof createClient> | null = null;

export function getTursoClient() {
  if (!client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error("Missing Turso environment variables");
    }

    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}
