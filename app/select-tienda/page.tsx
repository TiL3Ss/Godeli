// app/select-tienda/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import LoadingImage from '../components/LoadingImage';
import { BuildingStorefrontIcon, MapPinIcon,ArrowsRightLeftIcon, PhoneIcon, ClockIcon, InformationCircleIcon,HomeIcon,ArrowRightCircleIcon,ArchiveBoxXMarkIcon} from '@heroicons/react/24/solid';


interface Tienda {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  propietario_nombre?: string;
  created_at?: string;
}

export default function SelectTiendaPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      loadTiendas();
    }
  }, [status, session, router]);

  // Reloj en tiempo  UTC-3
  useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadTiendas = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/tiendas');
      const data = await response.json();

      if (data.success) {
        setTiendas(data.data || []);
        
        // Si es tienda y solo tiene una tienda, seleccionarla automáticamente
        if (session?.user?.tipo === 'tienda' && data.data?.length === 1) {
          setSelectedTienda(data.data[0].id);
        }
      } else {
        setError(data.error || 'Error al cargar tiendas');
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setError('Error de conexión al cargar tiendas');
    } finally {
      setLoading(false);
    }
  };

  const handleTiendaSelect = (tiendaId: number) => {
    setSelectedTienda(tiendaId);
  };

  const handleContinue = () => {
    if (selectedTienda) {
      // Guardar en sessionStorage en lugar de localStorage para mejor compatibilidad
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selected_tienda_id', selectedTienda.toString());
      }
      router.push('/comandas');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/');
    }
  };

  // Loading state
  
  if (status === 'loading' || loading) {
    return (
    <LoadingImage 
      title="Cargando tiendas"
      subtitle="Preparando tu experiencia..."
      size="lg"
      color="#471396" 
      speed="1.2"
    />
    );
  }

  const handleCambiarRol = () => {
    router.push('/rol');
  };

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header con efecto glassmorphism */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Usuario en esquina superior izquierda */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name || user.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user.tipo}</p>
              </div>
              {/* boton return to rol */}
              <button
              onClick={handleCambiarRol}
              className="cursor-pointer w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors duration-300"
            >
              <ArrowsRightLeftIcon className="w-5 h-5 " />
            </button>
            </div>

            {/* Título centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">Gestión de Tiendas</h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="group flex cursor-pointeritems-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-red-50/80 hover:text-red-700 border border-white/30 hover:border-red-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card con diseño Bento */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Saludo principal */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <HomeIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                      ¡Hola, {user.name || user.username}! 👋
                    </h2>
                    <p className="text-slate-600 text-base leading-relaxed">
                      {user.tipo === 'tienda' 
                        ? 'Administra tu negocio de manera eficiente' 
                        : 'Selecciona una tienda para comenzar a trabajar'
                      }
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-500">Sistema operativo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de información tipo Bento */}
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Reloj en tiempo real */}
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                        <ClockIcon className="h-5 w-5 text-white" /> 
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Hora Local (UTC-3)</p>
                        <p className="text-lg font-bold text-slate-900">
                          {currentTime.toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                            timeZone: 'America/Argentina/Buenos_Aires' // 👈 forzamos UTC-3
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {currentTime.toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            timeZone: 'America/Argentina/Buenos_Aires' // 👈 también en la fecha
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Tipo de usuario */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                      <InformationCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Rol</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">{user.tipo}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-slate-500">Activo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-8">
          {/* Single Store Display */}
          {user.tipo === 'tienda' && tiendas.length === 1 ? (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{tiendas[0].nombre}</h3>
                  <div className="space-y-1">
                    {tiendas[0].direccion && (
                      <div className="flex items-center text-slate-600">
                        <MapPinIcon className="h-6 w-6 text-indigo-600" />
                        <span className="text-sm pl-0.5">{tiendas[0].direccion}</span>
                      </div>
                    )}
                    {tiendas[0].telefono && (
                      <div className="flex items-center text-slate-600">
                        <PhoneIcon className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm pl-0.5">{tiendas[0].telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Store Selection */
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {user.tipo === 'tienda' ? 'Selecciona tu tienda' : 'Elige una tienda'}
                </h2>
                <p className="text-slate-600">
                  {tiendas.length > 0 
                    ? 'Haz clic en una tienda para seleccionarla y continuar'
                    : 'No tienes tiendas disponibles en este momento'
                  }
                </p>
              </div>
              
              {tiendas.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ArchiveBoxXMarkIcon className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {user.tipo === 'tienda' ? 'No tienes tiendas configuradas' : 'No tienes tiendas asignadas'}
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {user.tipo === 'tienda' 
                      ? 'Contacta al administrador para configurar tu tienda y comenzar a gestionar tu negocio.' 
                      : 'Solicita al administrador que te asigne tiendas para poder trabajar con el sistema.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6" style={{
                  gridTemplateColumns: `repeat(${Math.min(3, tiendas.length)}, 1fr)`
                }}>
                  {tiendas.map((tienda) => (
                    <div
                      key={tienda.id}
                      onClick={() => handleTiendaSelect(tienda.id)}
                      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                        selectedTienda === tienda.id
                          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-2 border-blue-500 shadow-xl shadow-blue-500/20 scale-105'
                          : 'bg-white/70 border border-white/30 shadow-lg hover:shadow-xl hover:border-white/50'
                      }`}
                    >
                      <div className="backdrop-blur-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                            selectedTienda === tienda.id
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-slate-200 to-slate-300 group-hover:from-blue-400 group-hover:to-indigo-500'
                          }`}>
                            <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                          </div>
                          
                          {selectedTienda === tienda.id && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-semibold text-slate-900 text-lg truncate">{tienda.nombre}</h3>
                          
                          {tienda.direccion && (
                            <div className="flex items-start text-slate-600">
                              <MapPinIcon className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-sm leading-relaxed">{tienda.direccion}</span>
                            </div>
                          )}
                          
                          {tienda.telefono && (
                            <div className="flex items-center text-slate-600">
                              <PhoneIcon className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0" />
                              <span className="text-sm">{tienda.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Selection overlay */}
                      {selectedTienda === tienda.id && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 pointer-events-none" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continue Button */}
        {tiendas.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedTienda}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                selectedTienda
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer'
                  : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">Continuar</span>
                <ArrowRightCircleIcon className={`w-5 h-5 transition-transform duration-300 ${selectedTienda ? 'group-hover:translate-x-1' : ''}`} />
              </div>
              
              {/* Button shine effect */}
              {selectedTienda && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}