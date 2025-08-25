// components/SessionNotificationWrapper.tsx
'use client';

import React from 'react';
import { useSessionNotifications } from '../hooks/useSessionTimeout';
import NotificationToast from './NotificationToast';
import SessionExpiryOverlay from '../components/SessionExpiryOverlay';

interface SessionNotificationWrapperProps {
  children: React.ReactNode;
}

const SessionNotificationWrapper: React.FC<SessionNotificationWrapperProps> = ({ children }) => {
  const { 
    notification, 
    onCloseNotification, 
    timeRemaining, 
    extendSession, 
    isExtending,
    isExpiringSoon 
  } = useSessionNotifications();

  // Mostrar overlay cuando queden menos de 2 minutos
  const showOverlay = isExpiringSoon && timeRemaining <= 2 * 60 * 1000 && timeRemaining > 0;

  return (
    <>
      {children}
      
      {/* Notificación de expiración de sesión */}
      {notification?.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          duration={notification.persistent ? 0 : 4000}
          onClose={onCloseNotification}
          action={notification.action}
          persistent={notification.persistent}
        />
      )}

      {/* Overlay crítico para los últimos 2 minutos */}
      <SessionExpiryOverlay
        isVisible={showOverlay}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
        isExtending={isExtending}
      />
    </>
  );
};

export default SessionNotificationWrapper;