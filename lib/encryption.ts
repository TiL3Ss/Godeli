// lib/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ID_ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-cbc";

const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
const iv = Buffer.alloc(16, 0);

export function encryptId(id: number): string {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(id.toString(), "utf8", "base64");
  encrypted += cipher.final("base64");

  // Convertir base64 → base64url
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decryptId(encryptedId: string): number {
  // Convertir base64url → base64
  let input = encryptedId.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) {
    input += "=";
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(input, "base64", "utf8");
  decrypted += decipher.final("utf8");

  const parsed = Number(decrypted);
  if (isNaN(parsed)) {
    throw new Error("El id desencriptado no es un número válido");
  }
  return parsed;
}
