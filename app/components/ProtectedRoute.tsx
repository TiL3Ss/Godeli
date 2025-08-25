// components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

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
  const { isAuthenticated, isLoading, userProfile, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    // Si requiere un rol específico y el usuario no lo tiene
    if (!isLoading && isAuthenticated && requiredRole && !hasRole(requiredRole)) {
      // Redirigir según el rol actual del usuario
      if (userProfile?.role === 'tienda') {
        router.push('/dashboard/tienda');
      } else if (userProfile?.role === 'repartidor') {
        router.push('/dashboard/repartidor');
      } else if (userProfile?.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/select-tienda');
      }
    }
  }, [isAuthenticated, isLoading, userProfile, requiredRole, router, hasRole, fallbackUrl]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // No mostrar contenido si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // No mostrar contenido si no tiene el rol requerido
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}