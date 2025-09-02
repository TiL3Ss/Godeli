'use client';

import React, { useEffect, useState } from 'react';
import { CheckIcon, XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

interface NotificationPopProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
  action?: ActionButton;
  persistent?: boolean; 
}

const NotificationPop: React.FC<NotificationPopProps> = ({
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

  const typeConfig = {
    success: {
      icon: CheckIcon,
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50/90',
      iconBgColor: 'bg-green-500',
      textColor: 'text-green-800',
      closeColor: 'text-green-600 hover:text-green-800',
      progressColor: 'bg-green-500'
    },
    error: {
      icon: XMarkIcon,
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50/90',
      iconBgColor: 'bg-red-500',
      textColor: 'text-red-800',
      closeColor: 'text-red-600 hover:text-red-800',
      progressColor: 'bg-red-500'
    },
    info: {
      icon: InformationCircleIcon,
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50/90',
      iconBgColor: 'bg-blue-500',
      textColor: 'text-blue-800',
      closeColor: 'text-blue-600 hover:text-blue-800',
      progressColor: 'bg-blue-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50/90',
      iconBgColor: 'bg-amber-500',
      textColor: 'text-amber-800',
      closeColor: 'text-amber-600 hover:text-amber-800',
      progressColor: 'bg-amber-500'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const actionButtonClasses = action?.variant === 'secondary' 
    ? `${config.bgColor} hover:opacity-80 ${config.textColor} border ${config.borderColor}`
    : `${config.iconBgColor} text-white hover:opacity-90`;

  return (
    <>
      <div className={`fixed top-28 right-4 z-[60] flex items-center transition-all duration-300 ease-out transform ${animationClass}`}>
        {/* Círculo con ícono */}
        <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 bg-white shadow-xl z-20 ${config.borderColor}`}>
          <Icon className={`w-10 h-10 z-30 relative ${config.iconBgColor.replace('bg-', 'text-')}`} />
        </div>
        
        {/* Cápsula con texto y botón */}
        <div className={`ml-[-24px] flex items-center pl-10 pr-4 py-1 rounded-r-2xl border-2 shadow-lg backdrop-blur-xl max-w-sm z-10 relative ${config.borderColor} ${config.bgColor}`}>
          <div className="flex-1 z-0 relative">
            <span className={`text-sm font-medium leading-relaxed ${config.textColor}`}>
              {message}
            </span>
            
            {/* Botón de acción */}
            {action && (
              <button
                onClick={action.onClick}
                disabled={action.loading}
                className={`mt-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm block ${actionButtonClasses} ${
                  action.loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {action.loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                    Cargando...
                  </div>
                ) : (
                  action.label
                )}
              </button>
            )}
          </div>

          {/* Botón de cerrar */}
          {!(persistent && type === 'error') && (
            <button
              onClick={handleClose}
              className={`ml-4 w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-200 z-0 relative ${config.borderColor} ${config.closeColor} hover:${config.iconBgColor} hover:text-white active:scale-95`}
              aria-label="Cerrar notificación"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          
          {/* Barra de progreso */}
          {!persistent && (
            <div className="absolute bottom-0 left-10 right-0 h-1 bg-black/10 rounded-br-2xl overflow-hidden">
              <div 
                className={`h-full ${config.progressColor} transition-all ease-linear rounded-br-2xl`}
                style={{
                  width: '100%',
                  animation: `shrink ${duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
};

export default NotificationPop;
