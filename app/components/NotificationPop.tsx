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
      accentColor: 'rgb(52, 199, 89)', // iOS Green
      bgGradient: 'from-green-500/20 via-green-400/15 to-emerald-500/20',
      iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
      textColor: 'text-green-900/90',
      closeHover: 'hover:bg-green-100/80',
      shadowColor: 'shadow-green-500/25',
      progressColor: 'bg-gradient-to-r from-green-400 to-emerald-500'
    },
    error: {
      icon: XMarkIcon,
      accentColor: 'rgb(255, 59, 48)', // iOS Red
      bgGradient: 'from-red-500/20 via-red-400/15 to-rose-500/20',
      iconBg: 'bg-gradient-to-br from-red-400 to-red-600',
      textColor: 'text-red-900/90',
      closeHover: 'hover:bg-red-100/80',
      shadowColor: 'shadow-red-500/25',
      progressColor: 'bg-gradient-to-r from-red-400 to-rose-500'
    },
    info: {
      icon: InformationCircleIcon,
      accentColor: 'rgb(0, 122, 255)', // iOS Blue
      bgGradient: 'from-blue-500/20 via-blue-400/15 to-cyan-500/20',
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      textColor: 'text-blue-900/90',
      closeHover: 'hover:bg-blue-100/80',
      shadowColor: 'shadow-blue-500/25',
      progressColor: 'bg-gradient-to-r from-blue-400 to-cyan-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      accentColor: 'rgb(255, 149, 0)', // iOS Orange
      bgGradient: 'from-amber-500/20 via-orange-400/15 to-yellow-500/20',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-600',
      textColor: 'text-amber-900/90',
      closeHover: 'hover:bg-amber-100/80',
      shadowColor: 'shadow-amber-500/25',
      progressColor: 'bg-gradient-to-r from-amber-400 to-orange-500'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const actionButtonClasses = action?.variant === 'secondary' 
    ? `bg-white/60 backdrop-blur-xl border border-white/30 ${config.textColor} hover:bg-white/80 hover:border-white/50 hover:scale-[1.02] active:scale-[0.98]`
    : `${config.iconBg} text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg`;

  return (
    <>
      <div className={`fixed top-20 right-6 z-[60] transition-all duration-500 ease-out transform ${animationClass}`}>
        {/* Contenedor principal con glassmorphism */}
        <div className={`
          flex items-center max-w-sm
          bg-gradient-to-br ${config.bgGradient}
          backdrop-blur-2xl
          border border-white/20
          rounded-3xl
          shadow-2xl ${config.shadowColor}
          overflow-hidden
          relative
        `}>
          {/* Reflejo superior para efecto glass */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          {/* Círculo con ícono */}
          <div className="flex-shrink-0 m-4 relative">
            <div className={`
              w-12 h-12 rounded-2xl ${config.iconBg}
              flex items-center justify-center
              shadow-lg
              relative overflow-hidden
            `}>
              {/* Efecto de brillo en el ícono */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Icon className="w-6 h-6 text-white relative z-10" />
            </div>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 pr-4 py-4 min-h-[4rem] flex flex-col justify-center">
            <p className={`text-sm font-medium leading-snug ${config.textColor} mb-0`}>
              {message}
            </p>
            
            {/* Botón de acción */}
            {action && (
              <button
                onClick={action.onClick}
                disabled={action.loading}
                className={`
                  mt-3 px-4 py-2 rounded-xl text-xs font-semibold 
                  transition-all duration-300 ease-out
                  ${actionButtonClasses}
                  ${action.loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {action.loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
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
            <div className="flex-shrink-0 mr-4">
              <button
                onClick={handleClose}
                className={`
                  w-8 h-8 rounded-full 
                  bg-white/20 backdrop-blur-xl border border-white/30
                  ${config.closeHover}
                  flex items-center justify-center
                  transition-all duration-300 ease-out
                  hover:scale-110 active:scale-95
                  shadow-sm
                `}
                aria-label="Cerrar notificación"
              >
                <XMarkIcon className="w-4 h-4 text-white/80" />
              </button>
            </div>
          )}
          
          {/* Barra de progreso moderna */}
          {!persistent && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div 
                className={`
                  h-full ${config.progressColor} 
                  shadow-sm
                  transition-all ease-linear
                `}
                style={{
                  width: '100%',
                  animation: `shrink ${duration}ms linear forwards`
                }}
              />
              {/* Efecto de brillo en la barra de progreso */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { 
            width: 100%; 
            opacity: 1;
          }
          to { 
            width: 0%; 
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationPop;