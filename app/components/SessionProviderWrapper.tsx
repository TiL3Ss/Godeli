// app/components/SessionProviderWrapper.tsx
'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasCheckedInitialAuth = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar el intervalo
  const clearExpirationInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Función para cerrar sesión de forma controlada
  const handleSignOut = useCallback(async () => {
    clearExpirationInterval();
    
    // Dar tiempo para que las notificaciones se muestren
    await new Promise(resolve => setTimeout(resolve, 100));
    
    signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
  }, [clearExpirationInterval]);

  // Verificación inicial de autenticación (solo una vez)
  useEffect(() => {
    if (status === 'loading') return;

    if (!hasCheckedInitialAuth.current) {
      hasCheckedInitialAuth.current = true;
      
      if (status === 'unauthenticated') {
        router.push('/');
        return;
      }
    }
  }, [status, router]);

  // Manejo de expiración de token (optimizado)
  useEffect(() => {
    // Limpiar intervalo anterior
    clearExpirationInterval();

    if (status === 'loading' || !session?.accessTokenExpires) return;

    const checkExpiration = () => {
      const timeUntilExpiry = session.accessTokenExpires! - Date.now();
      
      // Si la sesión ha expirado
      if (timeUntilExpiry <= 0) {
        console.log('Sesión expirada');
        handleSignOut();
        return;
      }
      
      // Advertencia solo cuando quedan menos de 5 minutos (sin spam en consola)
      if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 4 * 60 * 1000) {
        console.warn('La sesión expirará en menos de 5 minutos');
      }
    };

    // Verificar inmediatamente
    checkExpiration();

    // Solo establecer intervalo si la sesión no está cerca de expirar
    const timeUntilExpiry = session.accessTokenExpires - Date.now();
    if (timeUntilExpiry > 60 * 1000) { // Si quedan más de 1 minuto
      // Verificar cada 2 minutos en lugar de cada minuto
      intervalRef.current = setInterval(checkExpiration, 2 * 60 * 1000);
    } else {
      // Si queda menos de 1 minuto, verificar cada 10 segundos
      intervalRef.current = setInterval(checkExpiration, 10 * 1000);
    }

    return () => clearExpirationInterval();
  }, [session?.accessTokenExpires, status, handleSignOut, clearExpirationInterval]);

  // Verificación al enfocar ventana (optimizada para evitar recargas innecesarias)
  useEffect(() => {
    let isCheckingFocus = false;

    const handleFocus = async () => {
      // Evitar múltiples verificaciones simultáneas
      if (isCheckingFocus || !session?.accessTokenExpires) return;
      
      isCheckingFocus = true;
      
      // Pequeño delay para evitar verificaciones muy frecuentes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (Date.now() >= session.accessTokenExpires) {
        handleSignOut();
      }
      
      isCheckingFocus = false;
    };

    // Solo agregar listener si hay una sesión activa
    if (session?.accessTokenExpires) {
      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('focus', handleFocus);
        isCheckingFocus = false;
      };
    }
  }, [session?.accessTokenExpires, handleSignOut]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => clearExpirationInterval();
  }, [clearExpirationInterval]);

  return <>{children}</>;
}

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Configuración optimizada para reducir recargas
      refetchInterval={0} // Desactivar refetch automático
      refetchOnWindowFocus={false} // Manejaremos esto manualmente
      refetchWhenOffline={false} // No refetch cuando esté offline
    >
      <SessionChecker>
        {children}
      </SessionChecker>
    </SessionProvider>
  );
}