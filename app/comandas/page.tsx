// app/comandas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ComandaCard from '../components/ComandaCard';
import AgregarComandaModal from '../components/AgregarComandaModal';
import {ArrowRightEndOnRectangleIcon ,XCircleIcon,BookOpenIcon ,UserIcon ,DocumentTextIcon, ClockIcon,PlusCircleIcon }  from '@heroicons/react/24/solid';

interface Comanda {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  total: number;
  estado: string;
  comentario_problema?: string;
  created_at: string;
  updated_at: string;
  disponible?: boolean; // Para repartidores - indica si está disponible para tomar
  repartidor?: {
    id: number;
    nombre: string;
    telefono: string;
  };
  productos?: Array<{
    id: number;
    cantidad: number;
    precio_unitario: number;
    producto: {
      id: number;
      nombre: string;
      precio: number;
    };
  }>;
}

export default function ComandasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { data: session, status } = useSession();
  const [comandasDisponibles, setComandasDisponibles] = useState<Comanda[]>([]);
  const [comandasAsignadas, setComandasAsignadas] = useState<Comanda[]>([]);

  // Reloj en tiempo real UTC-3
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      initializeApp();
    }
  }, [status, session, router]);


  const initializeApp = () => {
    const user = session?.user;
    
    if (user?.tipo === 'tienda' && user.tienda_id) {
      // Usuario tipo tienda con tienda_id definida
      setTiendaId(user.tienda_id);
      loadComandas(user.tienda_id, false);
    } else {
      // Para repartidores o usuarios sin tienda_id, obtener de sessionStorage
      const selectedTiendaId = typeof window !== 'undefined' 
        ? sessionStorage.getItem('selected_tienda_id') 
        : null;
        
      if (selectedTiendaId) {
        const tiendaIdNum = Number(selectedTiendaId);
        setTiendaId(tiendaIdNum);
        loadComandas(tiendaIdNum, user?.tipo === 'repartidor');
      } else {
        router.push('/select-tienda');
      }
    }
  };

   const loadComandas = async (tiendaId: number, esRepartidor: boolean) => {
      try {
        setLoading(true);
        setError('');

        let response;
        const params = new URLSearchParams({ tienda_id: tiendaId.toString() });

        if (esRepartidor) {
          // API específica para repartidor que devuelve disponibles y asignadas
          response = await fetch(`/api/comandas/repartidor?${params}`);
        } else {
          // API para tienda
          params.append('activas', 'true'); // Solo comandas activas
          response = await fetch(`/api/comandas?${params}`);
        }

        const data = await response.json();

        if (data.success) {
          if (esRepartidor) {
            // Para repartidores, usar la estructura específica del endpoint
            setComandasDisponibles(data.disponibles || []);
            setComandasAsignadas(data.asignadas || []);
            // Para mantener compatibilidad con el resto del código
            setComandas([...(data.disponibles || []), ...(data.asignadas || [])]);
          } else {
            // Para tiendas
            setComandas(data.data || []);
            setComandasDisponibles([]);
            setComandasAsignadas([]);
          }
        } else {
          setError(data.error || 'Error al cargar comandas');
          console.error('Error al cargar comandas:', data.error);
        }
      } catch (error) {
        console.error('Error al cargar comandas:', error);
        setError('Error de conexión al cargar comandas');
      } finally {
        setLoading(false);
      }
    };



  const handleEstadoChange = async (comandaId: number, estado: string, comentario?: string) => {
    try {
      const response = await fetch(`/api/comandas/${comandaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado, comentario }),
      });

      const data = await response.json();

      if (data.success && tiendaId) {
        loadComandas(tiendaId, session?.user?.tipo === 'repartidor');
      } else {
        setError(data.error || 'Error al actualizar estado');
        console.error('Error al actualizar estado:', data.error);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError('Error de conexión al actualizar estado');
    }
  };

  const handleTomarComanda = async (comandaId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/comandas/repartidor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comanda_id: comandaId }),
      });

      const data = await response.json();

      if (data.success && tiendaId) {
        // Recargar usando el endpoint correcto para repartidores
        setTimeout(() => {
          loadComandas(tiendaId, true);
        }, 500);
      } else {
        setError(data.error || 'Error al tomar la comanda');
        console.error('Error al tomar comanda:', data.error);
      }
    } catch (error) {
      console.error('Error al tomar comanda:', error);
      setError('Error de conexión al tomar la comanda');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('selected_tienda_id');
      }
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/');
    }
  };

  const handleComandaCreated = () => {
    setShowModal(false);
    if (tiendaId) {
      loadComandas(tiendaId, session?.user?.tipo === 'repartidor');
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-slate-700">Cargando comandas</p>
            <p className="text-sm text-slate-500">Preparando tu panel de trabajo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  const user = session.user;
  const esRepartidor = user.tipo === 'repartidor';

  


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header con efecto glassmorphism */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Usuario en esquina superior izquierda */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name || user.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user.tipo}</p>
              </div>
            </div>

            {/* Título centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                {esRepartidor ? 'Comandas Disponibles' : 'Comandas Activas'}
              </h1>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/historial')}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-blue-50/80 hover:text-blue-700 border border-white/30 hover:border-blue-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ClockIcon className="w-4 h-4 group-hover:animate-spin" />
                <span className="hidden sm:inline">Historial</span>
              </button>

              {user.tipo === 'tienda' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border border-green-500/30 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <PlusCircleIcon className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-red-50/80 hover:text-red-700 border border-white/30 hover:border-red-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ArrowRightEndOnRectangleIcon className="w-4 h-4 group-hover:animate-pulse" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Panel */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Resumen */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <BookOpenIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Panel de Comandas
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {user.tipo === 'tienda' 
                        ? 'Gestiona y supervisa todas las comandas de tu tienda' 
                        : 'Comandas disponibles y asignadas para entrega'
                      }
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-500">
                          {esRepartidor 
                            ? `${comandasDisponibles.length} disponibles, ${comandasAsignadas.length} asignadas`
                            : `${comandas.length} comandas activas`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-slate-500 capitalize">
                          Modo {user.tipo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reloj */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                    <ClockIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Hora Local</p>
                    <p className="text-lg font-bold text-slate-900">
                      {currentTime.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </p>
                    <p className="text-xs text-slate-500">UTC-3</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <BookOpenIcon  className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Total Hoy</p>
                    <p className="text-lg font-bold text-slate-900">{comandas.length}</p>
                    <p className="text-xs text-slate-500">Comandas</p>
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
                    <XCircleIcon className="w-6 h-6 text-red-600" />
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
          {comandas.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay comandas para repartir</h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                {user.tipo === 'tienda' 
                  ? 'Comienza creando una nueva comanda para gestionar los pedidos de tus clientes.' 
                  : 'No hay comandas pendientes para entregar en este momento.'
                }
              </p>
              {user.tipo === 'tienda' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2 text-white" />
                  Crear Primera Comanda
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Para repartidores: Mostrar comandas disponibles y asignadas por separado */}
              {esRepartidor && comandasDisponibles.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
                    Comandas Disponibles ({comandasDisponibles.length})
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {comandasDisponibles.map((comanda) => (
                      <ComandaCard
                        key={comanda.id}
                        comanda={comanda}
                        esRepartidor={true}
                        onEstadoChange={handleEstadoChange}
                        onTomarComanda={handleTomarComanda}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Comandas asignadas (para repartidores) o todas (para tiendas) */}
              <div>
                {(esRepartidor ? comandasAsignadas : comandas).length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 mt-8 flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      {esRepartidor ? 'Mis Comandas Asignadas' : 'Comandas Activas'} 
                      ({esRepartidor ? comandasAsignadas.length : comandas.length})
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {(esRepartidor ? comandasAsignadas : comandas).map((comanda) => (
                        <ComandaCard
                          key={comanda.id}
                          comanda={comanda}
                          esRepartidor={esRepartidor}
                          onEstadoChange={handleEstadoChange}
                          onTomarComanda={esRepartidor ? undefined : handleTomarComanda}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Mensaje si no hay comandas asignadas para repartidores */}
                {esRepartidor && comandasAsignadas.length === 0 && comandasDisponibles.length > 0 && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-6 text-center mt-8">
                    <p className="text-blue-700">
                      Toma una comanda disponible para verla en esta sección.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar comanda */}
      {showModal && user.tipo === 'tienda' && tiendaId && (
        <AgregarComandaModal
          tiendaId={tiendaId}
          onClose={() => setShowModal(false)}
          onComandaCreated={handleComandaCreated}
        />
      )}
    </div>
  );
}