'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import LoadingImage from './components/LoadingImage';
import NotificationPop from './components/NotificationPop';

// Tipo para las notificaciones
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
  };
  persistent?: boolean;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Función para agregar notificaciones
  const addNotification = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning',
    options?: {
      persistent?: boolean;
      action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
        loading?: boolean;
      };
    }
  ) => {
    const id = Date.now();
    const notification: Notification = {
      id,
      message,
      type,
      persistent: options?.persistent || false,
      action: options?.action
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Función para remover notificaciones
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    // Redirigir si ya está autenticado
    if (status === 'authenticated' && session?.user) {
      addNotification('Sesión activa encontrada', 'info');
      redirectBasedOnUser(session.user);
    }
  }, [status, session, router]);

  // Redirigir según el usuario y sus permisos
  const redirectBasedOnUser = async (user: any) => {
    try {
      addNotification('Verificando permisos de usuario...', 'info');
      
      // Verificar si el usuario tiene permisos de administrador
      const response = await fetch('/api/user/check-admin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isAdmin) {
          addNotification('Permisos de administrador detectados', 'success');
          router.push('/rol');
        } else {
          addNotification(`Redirigiendo como ${user.tipo}`, 'success');
          redirectBasedOnTipo(user.tipo);
        }
      } else {
        addNotification('Error al verificar permisos, usando configuración por defecto', 'warning');
        redirectBasedOnTipo(user.tipo);
      }
    } catch (error) {
      console.error('Error verificando permisos de admin:', error);
      addNotification('Error de conexión, redirigiendo con configuración básica', 'warning');
      redirectBasedOnTipo(user.tipo);
    }
  };

  // Redirigir según el tipo de usuario (función original)
  const redirectBasedOnTipo = (tipo: string) => {
    switch (tipo) {
      case 'tienda':
        router.push('/select-tienda');
        break;
      case 'repartidor':
        router.push('/select-tienda');
        break;
      default:
        router.push('/select-tienda');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Limpiar notificaciones previas de error
    setNotifications(prev => prev.filter(n => n.type !== 'error'));

    if (!username.trim() || !password.trim()) {
      addNotification('Por favor ingresa usuario y contraseña', 'error', { persistent: true });
      setLoading(false);
      return;
    }

    try {
      console.log('Intentando login con:', username.trim());
      addNotification('Iniciando sesión...', 'info');
      
      const result = await signIn('credentials', {
        username: username.trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Error en signIn:', result.error);
        
        let errorMessage = '';
        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = 'Usuario o contraseña incorrectos';
            break;
          case 'AccessDenied':
            errorMessage = 'Acceso denegado';
            break;
          case 'Verification':
            errorMessage = 'Error de verificación';
            break;
          default:
            errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';
        }
        
        addNotification(errorMessage, 'error', { 
          persistent: true,
          action: {
            label: 'Reintentar',
            onClick: () => {
              setNotifications(prev => prev.filter(n => n.type !== 'error'));
              setUsername('');
              setPassword('');
            },
            variant: 'secondary'
          }
        });
      } else if (result?.ok) {
        console.log('Login exitoso, esperando redirección...');
        addNotification('¡Login exitoso! Redirigiendo...', 'success');
      } else {
        addNotification('Error inesperado al iniciar sesión', 'error', { persistent: true });
      }
    } catch (err: any) {
      console.error('Excepción durante login:', err);
      addNotification('Error de conexión. Verifica tu conexión a internet.', 'error', {
        persistent: true,
        action: {
          label: 'Verificar conexión',
          onClick: () => {
            // Verificar conectividad
            if (navigator.onLine) {
              addNotification('Conexión a internet detectada', 'success');
            } else {
              addNotification('Sin conexión a internet', 'error', { persistent: true });
            }
          },
          variant: 'primary'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para rellenar credenciales de prueba
  const fillTestCredentials = (userType: 'tienda' | 'repartidor' | 'admin') => {
    // Limpiar notificaciones previas
    setNotifications([]);
    
    if (userType === 'tienda') {
      setUsername('testTienda');
      setPassword('Test1234');
      addNotification('Credenciales de tienda cargadas', 'success');
    } else if (userType === 'repartidor') {
      setUsername('testRepartidor');
      setPassword('Test1234');
      addNotification('Credenciales de repartidor cargadas', 'success');
    } else if (userType === 'admin') {
      setUsername('admin');
      setPassword('Admin1234');
      addNotification('Credenciales de administrador cargadas', 'success');
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
   return (
      <LoadingImage 
        title="Verificando sesión..."
        subtitle="espera un momento"
        size="lg"
        color="#471396" 
        speed="1.2"
      />
    );
  }

  // No mostrar el formulario si ya está autenticado
  if (status === 'authenticated') {
    return (
      <LoadingImage 
        title="Redirigiendo..."
        subtitle="espera un momento"
        size="lg"
        color="#471396" 
        speed="1.2"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-indigo-100">
            <Image src="/images/go_sf.png" alt="Logo" width={100} height={100} className=""/>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Comandas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu usuario y contraseña
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              <p className="mb-3 font-medium">Usuarios de prueba:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-700">Tienda:</p>
                    <p className="text-xs text-gray-600">testTienda / Test1234</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('tienda')}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                    disabled={loading}
                  >
                    Usar
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-700">Repartidor:</p>
                    <p className="text-xs text-gray-600">testRepartidor / Test1234</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('repartidor')}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    disabled={loading}
                  >
                    Usar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renderizar notificaciones */}
      {notifications.map((notification) => (
        <NotificationPop
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          action={notification.action}
          persistent={notification.persistent}
        />
      ))}
    </div>
  );
}