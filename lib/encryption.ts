// lib/encryption.ts
import crypto from "crypto";

// Intentar obtener la clave de diferentes variables de entorno
const ENCRYPTION_KEY = 
  process.env.ID_ENCRYPTION_KEY || 
  process.env.NEXT_PUBLIC_ID_ENCRYPTION_KEY;

const ALGORITHM = "aes-256-cbc";

// Validar que la clave existe
if (!ENCRYPTION_KEY) {
  throw new Error("Variable de entorno de encriptación no encontrada. Se requiere ID_ENCRYPTION_KEY o NEXT_PUBLIC_ID_ENCRYPTION_KEY");
}

// Validar que la clave no está vacía
if (ENCRYPTION_KEY.trim() === "") {
  throw new Error("La clave de encriptación no puede estar vacía");
}

const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
const iv = Buffer.alloc(16, 0);

export function encryptId(id: number): string {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(id.toString(), "utf8", "base64");
    encrypted += cipher.final("base64");

    // Convertir base64 → base64url
    return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (error) {
    console.error("Error al encriptar ID:", error);
    throw new Error("Error interno al encriptar el ID");
  }
}

export function decryptId(encryptedId: string): number {
  try {
    // Validar input
    if (!encryptedId || typeof encryptedId !== 'string') {
      throw new Error("ID encriptado inválido");
    }

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
  } catch (error) {
    console.error("Error al desencriptar ID:", error);
    throw new Error("ID encriptado inválido o corrupto");
  }
}