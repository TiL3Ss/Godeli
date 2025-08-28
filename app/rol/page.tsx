// app/rol/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function RolPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("selected_tienda_id");
      }
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.push("/");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Selecciona el rol con el que deseas ingresar
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="block w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
          >
            Admin
          </Link>

          <Link
            href="/select-tienda"
            className="block w-full px-4 py-3 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
          >
            Usuario Tienda
          </Link>

          <Link
            href="/select-tienda"
            className="block w-full px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow hover:bg-orange-600 transition"
          >
            Usuario Repartidor
          </Link>
        </div>

        {session && (
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </main>
  );
}
