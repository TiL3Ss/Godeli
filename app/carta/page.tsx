'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import LoadingImage from '../components/LoadingImage';
import AgregarProducto from '../components/AgregarProducto';
import ModificarProducto from '../components/ModificarProducto';
import {
  ArrowRightEndOnRectangleIcon,
  XCircleIcon,
  UserIcon,
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  ShoppingBagIcon,
  Squares2X2Icon
} from '@heroicons/react/24/solid';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  created_at: string;
}

interface FiltrosCarta {
  busqueda?: string;
  activo?: boolean | null;
  precioMin?: number;
  precioMax?: number;
}

export default function CartaPage() {
  const { data: session, status } = useSession();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosOriginal, setProductosOriginal] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [tiendaNombre, setTiendaNombre] = useState<string>('');
  const [filtros, setFiltros] = useState<FiltrosCarta>({});
  const [error, setError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarModificar, setMostrarModificar] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  
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

  const initializeApp = async () => {
    const user = session?.user;
    
    if (user?.tipo === 'tienda' && user.tienda_id) {
      // Usuario tipo tienda con tienda_id definida
      setTiendaId(user.tienda_id);
      await loadTiendaInfo(user.tienda_id);
      await loadProductos(user.tienda_id);
    } else {
      // Para repartidores o usuarios sin tienda_id, obtener de sessionStorage
      const selectedTiendaId = typeof window !== 'undefined' 
        ? sessionStorage.getItem('selected_tienda_id') 
        : null;
        
      if (selectedTiendaId) {
        const tiendaIdNum = Number(selectedTiendaId);
        setTiendaId(tiendaIdNum);
        await loadTiendaInfo(tiendaIdNum);
        await loadProductos(tiendaIdNum);
      } else {
        router.push('/select-tienda');
      }
    }
  };

  const loadTiendaInfo = async (tiendaId: number) => {
    try {
      const response = await fetch(`/api/tiendas/${tiendaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTiendaNombre(data.data.nombre || `Tienda #${tiendaId}`);
      } else {
        setTiendaNombre(`Tienda #${tiendaId}`);
      }
    } catch (error) {
      console.error('Error al cargar info de tienda:', error);
      setTiendaNombre(`Tienda #${tiendaId}`);
    }
  };

  const loadProductos = async (tiendaId: number) => {
    try {
      setLoading(true);
      setError('');

      // 👇 CAMBIO: Agregar parámetro para incluir productos inactivos
      const response = await fetch(`/api/productos?tienda_id=${tiendaId}&incluir_inactivos=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener productos');
      }

      if (data.success) {
        const productosData = data.data || [];
        setProductos(productosData);
        setProductosOriginal(productosData);
      } else {
        throw new Error(data.error || 'Error al obtener productos');
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let productosFiltrados = [...productosOriginal];

    // Filtro por búsqueda
    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
      const busqueda = filtros.busqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.descripcion.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por estado activo
    if (filtros.activo !== null && filtros.activo !== undefined) {
      productosFiltrados = productosFiltrados.filter(producto => producto.activo === filtros.activo);
    }

    // Filtro por precio mínimo
    if (filtros.precioMin !== undefined && filtros.precioMin > 0) {
      productosFiltrados = productosFiltrados.filter(producto => producto.precio >= filtros.precioMin!);
    }

    // Filtro por precio máximo
    if (filtros.precioMax !== undefined && filtros.precioMax > 0) {
      productosFiltrados = productosFiltrados.filter(producto => producto.precio <= filtros.precioMax!);
    }

    setProductos(productosFiltrados);
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setProductos(productosOriginal);
  };

  const handleEliminarProducto = async () => {
    if (!productoAEliminar || !tiendaId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/productos?id=${productoAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar producto');
      }

      // 👇 CAMBIO: Actualizar el producto como inactivo en lugar de eliminarlo de la lista
      const nuevosProductosOriginal = productosOriginal.map(p => 
        p.id === productoAEliminar.id ? { ...p, activo: false } : p
      );
      const nuevosProductos = productos.map(p => 
        p.id === productoAEliminar.id ? { ...p, activo: false } : p
      );

      setProductos(nuevosProductos);
      setProductosOriginal(nuevosProductosOriginal);
      
      setMostrarConfirmacion(false);
      setProductoAEliminar(null);

    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar producto');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleProductoAgregado = (nuevoProducto: Producto) => {
    const nuevosProductos = [...productosOriginal, nuevoProducto];
    setProductos(nuevosProductos);
    setProductosOriginal(nuevosProductos);
    setMostrarAgregar(false);
  };

  const handleProductoModificado = (productoModificado: Producto) => {
    const nuevosProductos = productosOriginal.map(p => 
      p.id === productoModificado.id ? productoModificado : p
    );
    setProductos(nuevosProductos);
    setProductosOriginal(nuevosProductos);
    setMostrarModificar(false);
    setProductoSeleccionado(null);
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

  const getProductoStats = () => {
    return {
      total: productosOriginal.length,
      activos: productosOriginal.filter(p => p.activo).length,
      inactivos: productosOriginal.filter(p => !p.activo).length,
      precioPromedio: productosOriginal.length > 0 
        ? productosOriginal.reduce((sum, p) => sum + p.precio, 0) / productosOriginal.length 
        : 0,
      mostrados: productos.length
    };
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <LoadingImage 
        title="Cargando Carta"
        subtitle="Preparando los productos de la tienda..."
        size="lg"
        color="#471396" 
        speed="1.2"
      />
    );
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  const user = session.user;
  const esTienda = user.tipo === 'tienda';
  const stats = getProductoStats();

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
                className="group cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-blue-50/80 hover:text-blue-700 border border-white/30 hover:border-blue-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
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
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <ShoppingBagIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                Carta de Productos
              </h1>
            </div>

            {/* Botón logout */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="group flex cursor-pointer items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-red-50/80 hover:text-red-700 border border-white/30 hover:border-red-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
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
                    <ShoppingBagIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Carta de {tiendaNombre}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {esTienda 
                        ? 'Gestiona los productos de tu tienda: agregar, editar y eliminar productos'
                        : 'Consulta los productos disponibles de esta tienda'
                      }
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-500">
                          {stats.mostrados} de {stats.total} productos mostrados
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-slate-500">
                          {stats.activos} activos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reloj */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
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
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Squares2X2Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Precio Promedio</p>
                    <p className="text-lg font-bold text-slate-900">
                      ${stats.precioPromedio.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">Por producto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <TagIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <EyeIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.activos}</p>
                <p className="text-xs text-slate-600">Activos</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <EyeSlashIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.inactivos}</p>
                <p className="text-xs text-slate-600">Inactivos</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${stats.precioPromedio.toFixed(0)}
                </p>
                <p className="text-xs text-slate-600">Promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Agregar */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FunnelIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Filtros y Acciones</h2>
              </div>
              
              {esTienda && (
                <button
                  onClick={() => setMostrarAgregar(true)}
                  className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Agregar Producto</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar productos</label>
                <input
                  type="text"
                  value={filtros.busqueda || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  placeholder="Buscar por nombre o descripción..."
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                <select
                  value={filtros.activo === null ? '' : filtros.activo?.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFiltros(prev => ({ 
                      ...prev, 
                      activo: value === '' ? null : value === 'true' 
                    }));
                  }}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={aplicarFiltros}
                  className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    <span>Aplicar</span>
                  </div>
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="cursor-pointer px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all duration-300 font-medium"
                >
                  Limpiar
                </button>
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

        {/* Lista de Productos */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          {productos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBagIcon className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay productos</h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                {stats.total === 0 
                  ? 'Esta tienda aún no tiene productos agregados.'
                  : 'No se encontraron productos con los filtros aplicados.'
                }
              </p>
              {esTienda && stats.total === 0 && (
                <button
                  onClick={() => setMostrarAgregar(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Agregar Primer Producto
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {productos.map((producto) => (
                <div key={producto.id} className="p-6 hover:bg-white/50 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <TagIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{producto.nombre}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            producto.activo
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {producto.activo ? (
                              <>
                                <EyeIcon className="w-3 h-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-3 h-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </span>
                        </div>
                        
                        {producto.descripcion && (
                          <p className="text-sm text-slate-600 mb-3">{producto.descripcion}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>Creado: {formatDate(producto.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Precio y Acciones */}
                    {esTienda && (
                        <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                            setProductoSeleccionado(producto);
                            setMostrarModificar(true);
                            }}
                            className="cursor-pointer p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-300 hover:scale-105"
                            title="Editar producto"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                            setProductoAEliminar(producto);
                            setMostrarConfirmacion(true);
                            }}
                            className="cursor-pointer p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105"
                            title="Eliminar producto"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        </div>
                    )}

                    {/* Precio */}
                    <div className="ml-4 flex items-center space-x-4">
                        <div className="text-right">
                        <div className="flex items-center space-x-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-600 " />
                            <span className="text-2xl font-bold text-slate-900">
                            ${producto.precio.toLocaleString('es-CL')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Precio actual</p>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Producto */}
      {mostrarAgregar && tiendaId && (
        <AgregarProducto
          tiendaId={tiendaId}
          onClose={() => setMostrarAgregar(false)}
          onProductoAgregado={handleProductoAgregado}
        />
      )}

      {/* Modal Modificar Producto */}
      {mostrarModificar && productoSeleccionado && tiendaId && (
        <ModificarProducto
          producto={productoSeleccionado}
          tiendaId={tiendaId}
          onClose={() => {
            setMostrarModificar(false);
            setProductoSeleccionado(null);
          }}
          onProductoModificado={handleProductoModificado}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {mostrarConfirmacion && productoAEliminar && (
        <div className="fixed inset-0   bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Confirmar Eliminación
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  ¿Estás seguro de que deseas eliminar el producto <span className="font-semibold">"{productoAEliminar.nombre}"</span>? 
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-amber-800 text-sm font-medium">
                      El producto será eliminado permanentemente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setMostrarConfirmacion(false);
                      setProductoAEliminar(null);
                    }}
                    className="cursor-pointer px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-500 font-medium transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEliminarProducto}
                    disabled={loading}
                    className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4" />
                        <span>Eliminar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}