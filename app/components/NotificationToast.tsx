// components/NotificationToast.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
  action?: ActionButton;
  persistent?: boolean; 
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type,
  duration = 4000, 
  onClose,
  action,
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationClass, setAnimationClass] = useState('translate-x-full opacity-0');

  useEffect(() => {
    
    const enterTimer = setTimeout(() => {
      setAnimationClass('translate-x-0 opacity-100');
    }, 50);

    
    let timer: NodeJS.Timeout;
    if (!persistent) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(enterTimer);
      if (timer) clearTimeout(timer);
    };
  }, [duration, onClose, persistent]);

  const handleClose = () => {
    
    if (persistent && type === 'error') {
      return;
    }
    
    setAnimationClass('translate-x-full opacity-0');
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  // Z-index más alto para estar por encima de modales (z-50)
  const baseClasses = 'fixed top-28 right-4 p-4 rounded-lg shadow-lg text-white transition-all duration-300 ease-out z-[60] transform max-w-md';
  
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  }[type];

  const actionButtonClasses = action?.variant === 'secondary' 
    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
    : 'bg-white text-gray-800 hover:bg-gray-100';

  return (
    <div className={`${baseClasses} ${typeClasses} ${animationClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <span className="font-medium text-sm block">{message}</span>
          
          {/* Botón de acción */}
          {action && (
            <button
              onClick={action.onClick}
              disabled={action.loading}
              className={`mt-2 px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${actionButtonClasses} ${
                action.loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {action.loading ? 'Cargando...' : action.label}
            </button>
          )}
        </div>

        {/* Botón de cerrar - condicional */}
        {!(persistent && type === 'error') && (
          <button
            onClick={handleClose}
            className="ml-2 text-white hover:text-gray-100 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 flex-shrink-0"
            aria-label="Cerrar notificación"
          >
            X
          </button>
        )}
      </div>
      
      {/* Barra de progreso para notificaciones temporales */}
      {!persistent && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-white/60 transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;