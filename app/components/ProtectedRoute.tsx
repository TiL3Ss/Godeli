// components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'tienda' | 'repartidor' | 'admin';
  fallbackUrl?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackUrl = '/' 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si está cargando, no hacer nada
    if (status === 'loading') return;

    // Si no está autenticado, redirigir al login
    if (status === 'unauthenticated') {
      router.push(fallbackUrl);
      return;
    }

    // Si está autenticado pero no tiene session o usuario
    if (status === 'authenticated' && (!session || !session.user)) {
      router.push(fallbackUrl);
      return;
    }

    // Si requiere un rol específico y el usuario no lo tiene
    if (status === 'authenticated' && session?.user && requiredRole) {
      const userRole = session.user.tipo;
      
      if (userRole !== requiredRole) {
        // Redirigir según el rol actual del usuario
        if (userRole === 'tienda') {
          router.push('/comandas');
        } else if (userRole === 'repartidor') {
          // Los repartidores van a select-tienda si no tienen tienda_id
          router.push('/select-tienda');
        } else {
          // Por defecto redirigir a select-tienda
          router.push('/select-tienda');
        }
        return;
      }
    }

    // Verificar si necesita seleccionar tienda
    if (status === 'authenticated' && session?.user) {
      const user = session.user;
      
      // Para usuarios tipo tienda sin tienda_id
      if (user.tipo === 'tienda' && !user.tienda_id) {
        router.push('/select-tienda');
        return;
      }
      
      // Para repartidores, verificar si tienen tienda seleccionada en sessionStorage
      if (user.tipo === 'repartidor') {
        const selectedTienda = typeof window !== 'undefined' 
          ? sessionStorage.getItem('selected_tienda_id') 
          : null;
        
        if (!selectedTienda && window.location.pathname !== '/select-tienda') {
          router.push('/select-tienda');
          return;
        }
      }
    }
  }, [session, status, requiredRole, router, fallbackUrl]);

  // Mostrar loading mientras se verifica la autenticación
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-slate-700">Verificando permisos</p>
            <p className="text-sm text-slate-500">Validando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar contenido si no está autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700 mb-2">Acceso restringido</p>
          <p className="text-sm text-slate-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Verificar si tiene session válida
  if (status === 'authenticated' && (!session || !session.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700 mb-2">Sesión inválida</p>
          <p className="text-sm text-slate-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Verificar rol requerido
  if (requiredRole && session?.user?.tipo !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700 mb-2">Permisos insuficientes</p>
          <p className="text-sm text-slate-500">
            Rol requerido: <span className="font-medium capitalize">{requiredRole}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Redirigiendo a tu panel...</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}