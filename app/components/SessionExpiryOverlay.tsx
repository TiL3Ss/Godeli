// components/SessionExpiryOverlay.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { formatTimeRemaining } from '../hooks/useSessionTimeout';

interface SessionExpiryOverlayProps {
  isVisible: boolean;
  timeRemaining: number;
  onExtend: () => void;
  isExtending: boolean;
}

const SessionExpiryOverlay: React.FC<SessionExpiryOverlayProps> = ({
  isVisible,
  timeRemaining,
  onExtend,
  isExtending
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sesión por expirar
          </h3>
          <p className="text-gray-600 mb-4">
            Tu sesión expirará en:
          </p>
          <div className="text-3xl font-bold text-red-600 mb-4">
            {formatTimeRemaining(countdown)}
          </div>
          <p className="text-sm text-gray-500">
            ¿Deseas extender tu sesión?
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onExtend}
            disabled={isExtending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {isExtending && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isExtending ? 'Extendiendo...' : 'Sí, extender sesión'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Si no realizas ninguna acción, serás redirigido al login automáticamente
        </p>
      </div>
    </div>
  );
};

export default SessionExpiryOverlay;