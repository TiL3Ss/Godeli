// app/hooks/useSessionTimeout.ts
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';

interface UseSessionTimeoutReturn {
  timeRemaining: number;
  isExpiringSoon: boolean;
  extendSession: () => Promise<void>;
  isExtending: boolean;
}

export function useSessionTimeout(warningMinutes: number = 5): UseSessionTimeoutReturn {
  const { data: session, update, status } = useSession();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  
  // Referencias para evitar efectos innecesarios
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastExpiresRef = useRef<number | null>(null);
  const hasLoggedExpirationRef = useRef<boolean>(false);

  // Función para limpiar intervalo
  const clearTimeInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Limpiar intervalo anterior
    clearTimeInterval();

    // Solo proceder si la sesión está cargada y disponible
    if (status === 'loading' || !session) {
      setTimeRemaining(0);
      setIsExpiringSoon(false);
      return;
    }

    const updateTimeRemaining = () => {
      // Determinar tiempo de expiración
      let expiresAt: number;
      
      if (session.accessTokenExpires) {
        expiresAt = session.accessTokenExpires;
      } else if (session.expires) {
        expiresAt = new Date(session.expires).getTime();
      } else {
        if (!hasLoggedExpirationRef.current) {
          console.warn('No se encontró información de expiración en la sesión');
          hasLoggedExpirationRef.current = true;
        }
        return;
      }
      
      // Solo actualizar si cambió la fecha de expiración
      if (lastExpiresRef.current === expiresAt) return;
      lastExpiresRef.current = expiresAt;

      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      
      setTimeRemaining(remaining);
      
      const warningThreshold = warningMinutes * 60 * 1000;
      const shouldShowWarning = remaining <= warningThreshold && remaining > 0;
      
      setIsExpiringSoon(shouldShowWarning);
      
      // Auto logout cuando expire completamente
      if (remaining <= 0) {
        console.log('Sesión expirada, cerrando sesión automáticamente');
        clearTimeInterval();
        
        // Dar tiempo para mostrar notificación antes de redirect
        setTimeout(() => {
          signOut({ 
            callbackUrl: '/',
            redirect: true 
          });
        }, 1500); // 1.5 segundos de delay
        return;
      }
    };

    // Verificación inicial
    updateTimeRemaining();

    // Configurar intervalo basado en tiempo restante
    const currentExpires = session.accessTokenExpires || 
                          (session.expires ? new Date(session.expires).getTime() : null);
    
    if (currentExpires) {
      const timeUntilExpiry = currentExpires - Date.now();
      
      // Intervalo dinámico basado en tiempo restante
      let intervalTime: number;
      if (timeUntilExpiry > 10 * 60 * 1000) {
        // Más de 10 minutos: verificar cada 5 minutos
        intervalTime = 5 * 60 * 1000;
      } else if (timeUntilExpiry > 2 * 60 * 1000) {
        // Entre 2-10 minutos: verificar cada minuto
        intervalTime = 60 * 1000;
      } else {
        // Menos de 2 minutos: verificar cada 10 segundos
        intervalTime = 10 * 1000;
      }

      intervalRef.current = setInterval(updateTimeRemaining, intervalTime);
    }

    return () => clearTimeInterval();
  }, [session?.accessTokenExpires, session?.expires, warningMinutes, status, clearTimeInterval]);

  // Resetear flag de log cuando cambie la sesión
  useEffect(() => {
    hasLoggedExpirationRef.current = false;
  }, [session]);

  const extendSession = useCallback(async () => {
    if (!session) {
      console.error('No hay sesión activa para extender');
      return;
    }

    if (isExtending) {
      console.log('Ya hay una extensión en progreso');
      return;
    }

    setIsExtending(true);

    try {
      console.log('Iniciando extensión de sesión...');
      
      // Llamar a update() que disparará el callback JWT con trigger: 'update'
      const updatedSession = await update();
      
      if (updatedSession) {
        console.log('Sesión extendida exitosamente');
        
        // Resetear warnings
        setIsExpiringSoon(false);
        hasLoggedExpirationRef.current = false;
        lastExpiresRef.current = null; // Forzar actualización en próximo effect
        
        // Opcional: mostrar notificación de éxito
        // toast.success('Sesión extendida exitosamente');
      } else {
        throw new Error('No se pudo actualizar la sesión');
      }
      
    } catch (error) {
      console.error('Error al extender la sesión:', error);
      
      // Si la extensión falla, probablemente la sesión ya expiró
      signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } finally {
      setIsExtending(false);
    }
  }, [session, update, isExtending]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => clearTimeInterval();
  }, [clearTimeInterval]);

  return {
    timeRemaining,
    isExpiringSoon,
    extendSession,
    isExtending,
  };
}

// Función helper para formatear el tiempo restante
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Hook adicional para mostrar notificaciones de expiración de sesión
export function useSessionNotifications() {
  const { isExpiringSoon, timeRemaining, extendSession, isExtending } = useSessionTimeout();
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    action?: {
      label: string;
      onClick: () => void;
      loading?: boolean;
    };
    persistent?: boolean;
  } | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Detectar cuando la sesión ha expirado completamente
  useEffect(() => {
    if (timeRemaining <= 0 && timeRemaining > 0) { // Solo cuando cambia de positivo a 0
      setIsSessionExpired(true);
      setNotification({
        show: true,
        message: 'Tu sesión ha expirado. Serás redirigido al login...',
        type: 'error',
        persistent: true // Mantener visible durante el redirect
      });
    }
  }, [timeRemaining]);

  useEffect(() => {
    if (isExpiringSoon && !notification?.show && !isSessionExpired) {
      const minutes = Math.floor(timeRemaining / (60 * 1000));
      const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
      
      let message = '';
      if (minutes > 0) {
        message = `Tu sesión expirará en ${minutes} minuto${minutes > 1 ? 's' : ''}`;
      } else {
        message = `Tu sesión expirará en ${seconds} segundo${seconds > 1 ? 's' : ''}`;
      }
      
      setNotification({
        show: true,
        message,
        type: 'warning',
        persistent: true, // No se cierra automáticamente
        action: {
          label: 'Extender Sesión',
          onClick: handleExtendSession,
          loading: isExtending
        }
      });
    }

    // Reset warning cuando la sesión se extienda o ya no esté expirando
    if (!isExpiringSoon && notification?.show && notification.type === 'warning' && !isSessionExpired) {
      setNotification(null);
    }
  }, [isExpiringSoon, timeRemaining, notification?.show, isExtending, isSessionExpired]);

  // Manejar extensión exitosa
  useEffect(() => {
    if (!isExtending && notification?.show && notification.type === 'warning' && !isExpiringSoon && !isSessionExpired) {
      setNotification({
        show: true,
        message: 'Sesión extendida exitosamente',
        type: 'success',
        persistent: false
      });
      
      // Resetear el estado de expiración
      setIsSessionExpired(false);
      
      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isExtending, isExpiringSoon, notification?.show, notification?.type, isSessionExpired]);

  const handleCloseNotification = () => {
    // No permitir cerrar notificación de sesión expirada
    if (notification?.type === 'error' && isSessionExpired) {
      return;
    }
    setNotification(null);
  };

  const handleExtendSession = async () => {
    if (isExtending || isSessionExpired) return;
    
    // Actualizar el estado del botón de acción
    setNotification(prev => prev ? {
      ...prev,
      action: prev.action ? { ...prev.action, loading: true } : undefined
    } : null);
    
    try {
      await extendSession();
      // El efecto anterior manejará el mensaje de éxito
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error al extender la sesión. Por favor, inicia sesión nuevamente.',
        type: 'error',
        persistent: false
      });
      
      // Redirect después de mostrar el error
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  return {
    isExpiringSoon,
    timeRemaining,
    extendSession: handleExtendSession,
    isExtending,
    notification,
    onCloseNotification: handleCloseNotification,
    isSessionExpired
  };
}