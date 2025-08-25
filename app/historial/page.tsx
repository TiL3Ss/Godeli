// app/historial/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../components/ProtectedRoute';

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

interface UserProfile {
  id: number;
  username: string;
  name: string;
  tipo: 'admin' | 'tienda' | 'repartidor';
  tienda_id?: number;
}

export default function HistorialPage() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<FiltrosHistorial>({});
  const [showProductFilter, setShowProductFilter] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Get user profile from session or API
  useEffect(() => {
    const loadUserProfile = async () => {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated' || !session?.user) {
        router.push('/');
        return;
      }

      try {
        // If user profile is in session, use it
        if (session.user.tipo) {
          const profile: UserProfile = {
            id: session.user.id || 0,
            username: session.user.username || '',
            name: session.user.name || '',
            tipo: session.user.tipo as 'admin' | 'tienda' | 'repartidor',
            tienda_id: session.user.tienda_id
          };
          setUserProfile(profile);
          return;
        }

        // Otherwise fetch from API
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserProfile(data.user);
          } else {
            setError('Error al obtener perfil de usuario');
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Error de conexión al obtener perfil');
      }
    };

    loadUserProfile();
  }, [session, status, router]);

  // Load data when user profile is available
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.tipo === 'tienda' && userProfile.tienda_id) {
      setTiendaId(userProfile.tienda_id);
      loadData(userProfile.tienda_id, false);
    } else {
      // For admin or repartidor, get tienda from session storage
      const selectedTiendaId = sessionStorage.getItem('selected_tienda_id');
      if (selectedTiendaId) {
        const tiendaIdNum = Number(selectedTiendaId);
        setTiendaId(tiendaIdNum);
        loadData(tiendaIdNum, userProfile.tipo === 'repartidor');
      } else {
        router.push('/select-tienda');
      }
    }
  }, [userProfile, router]);

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
        tienda_id: tiendaId.toString(),
        repartidor: esRepartidor.toString()
      });

      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.productos && filtros.productos.length > 0) {
        params.append('productos', filtros.productos.join(','));
      }

      const response = await fetch(`/api/historial?${params}`, {
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
        return data.comandas || [];
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
        return data.productos || [];
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
    if (tiendaId && userProfile) {
      setLoading(true);
      try {
        const comandasData = await getHistorialComandas(tiendaId, filtros, userProfile.tipo === 'repartidor');
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
    if (tiendaId && userProfile) {
      loadData(tiendaId, userProfile.tipo === 'repartidor');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
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
        return 'bg-green-100 text-green-800';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Show loading while session is loading
  if (status === 'loading' || (!userProfile && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show error if user profile failed to load
  if (error && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Historial de Comandas</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filtros.estado || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="activa">Activa</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Filtro por fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={filtros.fecha || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div></div>
              <div></div>
            </div>

            {/* Filtro por productos */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Productos</label>
                <button
                  onClick={() => setShowProductFilter(!showProductFilter)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showProductFilter ? 'Ocultar' : 'Mostrar'} filtro de productos
                </button>
              </div>
              
              {showProductFilter && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {productos.map((producto) => (
                      <div key={producto.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`producto-${producto.id}`}
                          checked={filtros.productos?.includes(producto.id) || false}
                          onChange={() => toggleProducto(producto.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`producto-${producto.id}`}
                          className="ml-2 text-sm text-gray-900 truncate"
                        >
                          {producto.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
              <button
                onClick={aplicarFiltros}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Aplicando...' : 'Aplicar Filtros'}
              </button>
            </div>
          </div>

          {/* Lista de Comandas */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Comandas ({comandas.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {userProfile?.tipo === 'repartidor' ? 'Comandas asignadas a ti' : 'Historial de todas las comandas'}
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando historial...</p>
              </div>
            ) : comandas.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay comandas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron comandas con los filtros aplicados.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {comandas.map((comanda) => (
                  <li key={comanda.id} className="px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">#{comanda.id}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {comanda.cliente_nombre}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(comanda.estado)}`}>
                              {getEstadoText(comanda.estado)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(comanda.created_at)}
                          </div>
                          {comanda.cliente_direccion && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {comanda.cliente_direccion}
                            </div>
                          )}
                          {comanda.repartidor?.nombre && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Repartidor: {comanda.repartidor.nombre}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${comanda.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {comanda.productos?.length || 0} productos
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/comanda/${comanda.id}`)}
                          className="ml-2 flex-shrink-0 p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mostrar productos si hay productos */}
                    {comanda.productos && comanda.productos.length > 0 && (
                      <div className="mt-3 pl-14">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Productos: </span>
                          {comanda.productos.map((item, index) => (
                            <span key={item.id}>
                              {item.producto?.nombre || 'Producto'} (x{item.cantidad})
                              {index < comanda.productos!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mostrar notas si existen */}
                    {comanda.comentario_problema && (
                      <div className="mt-2 pl-14">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Comentarios: </span>
                          {comanda.comentario_problema}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}