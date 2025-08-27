'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ArrowRightEndOnRectangleIcon,
  XCircleIcon,
  CheckBadgeIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  MapPinIcon,
  TruckIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BoltIcon,
  NoSymbolIcon
} from '@heroicons/react/24/solid';

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

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
    };
  }>;
}

interface FiltrosHistorial {
  estado?: string;
  fecha?: string;
  productos?: number[];
}

export default function HistorialPage() {
  const { data: session, status } = useSession();
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<FiltrosHistorial>({});
  const [showProductFilter, setShowProductFilter] = useState(false);
  const [error, setError] = useState<string>('');
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedComandas, setExpandedComandas] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Reloj en tiempo real
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
      loadData(user.tienda_id, false);
    } else {
      // Para repartidores o usuarios sin tienda_id, obtener de sessionStorage
      const selectedTiendaId = typeof window !== 'undefined' 
        ? sessionStorage.getItem('selected_tienda_id') 
        : null;
        
      if (selectedTiendaId) {
        const tiendaIdNum = Number(selectedTiendaId);
        setTiendaId(tiendaIdNum);
        loadData(tiendaIdNum, user?.tipo === 'repartidor');
      } else {
        router.push('/select-tienda');
      }
    }
  };

  const loadData = async (tiendaId: number, esRepartidor: boolean) => {
    try {
      setLoading(true);
      setError('');

      const [comandasData, productosData] = await Promise.all([
        getHistorialComandas(tiendaId, filtros, esRepartidor),
        getProductosTienda(tiendaId)
      ]);
      
      setComandas(comandasData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del historial');
    } finally {
      setLoading(false);
    }
  };

  const getHistorialComandas = async (tiendaId: number, filtros: FiltrosHistorial, esRepartidor: boolean) => {
    try {
      const params = new URLSearchParams({
        tienda_id: tiendaId.toString()
      });

      // Para repartidores, usar el endpoint específico sin filtros adicionales por ahora
      if (esRepartidor) {
        params.append('repartidor', 'true');
      }

      // Agregar filtros
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.productos && filtros.productos.length > 0) {
        params.append('productos', filtros.productos.join(','));
      }

      // Usar el endpoint de comandas regular que ya maneja filtros
      const response = await fetch(`/api/comandas?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener historial');
      }

      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Error al obtener historial');
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
      throw error;
    }
  };

  const getProductosTienda = async (tiendaId: number) => {
    try {
      const response = await fetch(`/api/productos?tienda_id=${tiendaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('Error al obtener productos:', data.error);
        return [];
      }

      if (data.success) {
        return data.data || [];
      } else {
        console.warn('Error al obtener productos:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching productos:', error);
      return [];
    }
  };

  const aplicarFiltros = async () => {
    if (tiendaId && session?.user) {
      setLoading(true);
      setFiltrosAplicados(true);
      try {
        const comandasData = await getHistorialComandas(tiendaId, filtros, session.user.tipo === 'repartidor');
        setComandas(comandasData);
        setError('');
      } catch (error) {
        console.error('Error al aplicar filtros:', error);
        setError('Error al aplicar filtros');
      } finally {
        setLoading(false);
      }
    }
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setFiltrosAplicados(false);
    if (tiendaId && session?.user) {
      loadData(tiendaId, session.user.tipo === 'repartidor');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'Activa';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const toggleProducto = (productoId: number) => {
    const productosActuales = filtros.productos || [];
    const existe = productosActuales.includes(productoId);
    
    if (existe) {
      setFiltros(prev => ({
        ...prev,
        productos: productosActuales.filter(id => id !== productoId)
      }));
    } else {
      setFiltros(prev => ({
        ...prev,
        productos: [...productosActuales, productoId]
      }));
    }
  };

  const toggleComandaExpansion = (comandaId: number) => {
    const newExpanded = new Set(expandedComandas);
    if (newExpanded.has(comandaId)) {
      newExpanded.delete(comandaId);
    } else {
      newExpanded.add(comandaId);
    }
    setExpandedComandas(newExpanded);
  };

  const getComandaStats = () => {
    const stats = {
      activas: comandas.filter(c => c.estado === 'activa').length,
      en_proceso: comandas.filter(c => c.estado === 'en_proceso').length,
      completadas: comandas.filter(c => c.estado === 'completada').length,
      canceladas: comandas.filter(c => c.estado === 'cancelada').length,
      total: comandas.reduce((sum, c) => sum + c.total, 0)
    };
    return stats;
  };

  // Loading state
  if (status === 'loading' || (loading && !comandas.length)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-slate-700">Cargando historial</p>
            <p className="text-sm text-slate-500">Preparando el historial de comandas...</p>
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
  const stats = getComandaStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header con efecto glassmorphism */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Botón volver y usuario */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-blue-50/80 hover:text-blue-700 border border-white/30 hover:border-blue-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user.name || user.username}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.tipo}</p>
                </div>
              </div>
            </div>

            {/* Título centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                Historial de Comandas
              </h1>
            </div>

            {/* Botón logout */}
            <div className="flex items-center space-x-2">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Historial de Comandas
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {user.tipo === 'tienda' 
                        ? 'Consulta el historial completo de comandas de tu tienda' 
                        : 'Historial de comandas que has gestionado como repartidor'
                      }
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-500">
                          {comandas.length} comandas {filtrosAplicados ? 'filtradas' : 'totales'}
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
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Total</p>
                    <p className="text-lg font-bold text-slate-900">{comandas.length}</p>
                    <p className="text-xs text-slate-500">Comandas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <BoltIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.activas}</p>
                <p className="text-xs text-slate-600">Activas</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <ClockIcon className='w-5 h-5 text-white' />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.en_proceso}</p>
                <p className="text-xs text-slate-600">En Proceso</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <CheckBadgeIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.completadas}</p>
                <p className="text-xs text-slate-600">Completadas</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <NoSymbolIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.canceladas}</p>
                <p className="text-xs text-slate-600">Canceladas</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">${stats.total.toFixed(0)}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <FunnelIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Filtros de Búsqueda</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                <select
                  value={filtros.estado || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value || undefined }))}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="">Todos los estados</option>
                  <option value="activa">Activa</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Filtro por fecha */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={filtros.fecha || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value || undefined }))}
                  className="w-full px-4 py-3 border text-slate-700 bg-white border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-end space-x-3">
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 font-medium"
                >
                  Limpiar
                </button>
                <button
                  onClick={aplicarFiltros}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Aplicando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      <span>Aplicar</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Filtro por productos */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700">Filtrar por Productos</label>
                <button
                  onClick={() => setShowProductFilter(!showProductFilter)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-300"
                >
                  {showProductFilter ? 'Ocultar productos' : 'Mostrar productos'}
                </button>
              </div>
              
              {showProductFilter && (
                <div className="bg-slate-50/50 rounded-xl border border-slate-200/50 p-4 max-h-48 overflow-y-auto">
                  {productos.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No hay productos disponibles</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {productos.map((producto) => (
                        <div key={producto.id} className="flex items-center space-x-3 p-2 hover:bg-white/50 rounded-lg transition-colors duration-300">
                          <input
                            type="checkbox"
                            id={`producto-${producto.id}`}
                            checked={filtros.productos?.includes(producto.id) || false}
                            onChange={() => toggleProducto(producto.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded transition-colors duration-300"
                          />
                          <label
                            htmlFor={`producto-${producto.id}`}
                            className="text-sm text-slate-900 truncate cursor-pointer flex-1"
                          >
                            {producto.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 transition-colors duration-300"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Comandas */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          {comandas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay comandas</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                {filtrosAplicados 
                  ? 'No se encontraron comandas con los filtros aplicados. Intenta modificar los criterios de búsqueda.'
                  : 'No hay comandas en el historial para mostrar.'
                }
              </p>
              {filtrosAplicados && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {comandas.map((comanda, index) => (
                <div key={comanda.id} className="p-6 hover:bg-white/50 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">#{comanda.id}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{comanda.cliente_nombre}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(comanda.estado)}`}>
                            {getEstadoText(comanda.estado)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4 text-slate-400" />
                            <span>{formatDate(comanda.created_at)}</span>
                          </div>
                          
                          {comanda.cliente_telefono && (
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="w-4 h-4 text-slate-400" />
                              <span>{comanda.cliente_telefono}</span>
                            </div>
                          )}
                          
                          {comanda.cliente_direccion && (
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="w-4 h-4 text-slate-400" />
                              <span className="truncate">{comanda.cliente_direccion}</span>
                            </div>
                          )}
                          
                          {comanda.repartidor?.nombre && (
                            <div className="flex items-center space-x-2">
                              <TruckIcon className="w-4 h-4 text-slate-400" />
                              <span>Repartidor: {comanda.repartidor.nombre}</span>
                            </div>
                          )}
                        </div>

                        {/* Productos resumen */}
                        {comanda.productos && comanda.productos.length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                Productos ({comanda.productos.length})
                              </span>
                              <button
                                onClick={() => toggleComandaExpansion(comanda.id)}
                                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-300"
                              >
                                <span>{expandedComandas.has(comanda.id) ? 'Ocultar' : 'Ver detalles'}</span>
                                {expandedComandas.has(comanda.id) ? (
                                  <ChevronUpIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronDownIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            
                            {expandedComandas.has(comanda.id) ? (
                              <div className="space-y-2">
                                {comanda.productos.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex-1">
                                      <span className="text-slate-900 font-medium">
                                        {item.producto.nombre}
                                      </span>
                                      <span className="text-slate-500 ml-2">
                                        x{item.cantidad}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-slate-900 font-medium">
                                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        ${item.precio_unitario.toFixed(2)} c/u
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-600">
                                {comanda.productos.slice(0, 2).map((item, idx) => (
                                  <span key={item.id}>
                                    {item.producto.nombre} (x{item.cantidad})
                                    {idx < Math.min(comanda.productos!.length, 2) - 1 ? ', ' : ''}
                                  </span>
                                ))}
                                {comanda.productos.length > 2 && (
                                  <span className="text-indigo-600 font-medium">
                                    {' '}y {comanda.productos.length - 2} más...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Comentarios/Problemas */}
                        {comanda.comentario_problema && (
                          <div className="mt-3 p-3 bg-red-50/50 rounded-lg border border-red-200/50">
                            <div className="flex items-start space-x-2">
                              <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-800">Comentario:</p>
                                <p className="text-sm text-red-700">{comanda.comentario_problema}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Precio y acciones */}
                    <div className="flex items-start space-x-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">
                          ${comanda.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {comanda.productos?.length || 0} productos
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/comanda/${comanda.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}