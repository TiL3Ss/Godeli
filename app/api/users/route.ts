// app/api/users/route.ts
import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET() {
  const db = getTursoClient();
  const result = await db.execute("SELECT * FROM users");

  return NextResponse.json(result.rows);
}
