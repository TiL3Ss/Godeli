// app/rol/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { TruckIcon } from "@heroicons/react/24/solid";

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
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gray-300 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-sm">
        {/* User Avatar Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center mb-4 shadow-2xl border-4 border-gray-300 backdrop-blur-sm">
            <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-gray-800 mb-2">
            {session?.user?.name || "Usuario"}
          </h1>
          <p className="text-gray-600 text-sm font-light">
            Selecciona tu rol de acceso
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-3">
          {/* Admin Role */}
          <Link
            href="/admin"
            className="group block w-full p-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-medium">Administrador</h3>
                <p className="text-gray-600 text-sm">Acceso completo al sistema</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Store User Role */}
          <Link
            href="/select-tienda"
            className="group block w-full p-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-medium">Usuario Tienda</h3>
                <p className="text-gray-600 text-sm">Gestión de tienda</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Delivery User Role */}
          <Link
            href="/select-tienda"
            className="group block w-full p-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl hover:bg-white/90 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-medium">Usuario Repartidor</h3>
                <p className="text-gray-600 text-sm">Gestión de entregas</p>
              </div>
              
            </div>
          </Link>
        </div>

        {/* Logout Button */}
        {session && (
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 group"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-gray-700 group-hover:text-red-600 font-light">Cerrar Sesión</span>
              </div>
            </button>
          </div>
        )}

        {/* Windows 11 Style Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-gray-500 text-xs">
            <button className="hover:text-gray-700 transition-colors">Términos de uso</button>
            <span>•</span>
            <button className="hover:text-gray-700 transition-colors">Privacidad</button>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300"></div>
    </main>
  );
}