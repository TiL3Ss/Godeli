'use client';

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingImage from '../components/LoadingImage';
import {
  MagnifyingGlassIcon as Search,
  UsersIcon as Users,
  TruckIcon as Truck,
  BuildingStorefrontIcon as Store,
  PlusCircleIcon as PlusCircle,
  XCircleIcon as XCircle,
  CheckIcon as Check,
  ExclamationTriangleIcon as AlertCircle,
  ArrowRightOnRectangleIcon as LogOut,
  ArrowsRightLeftIcon as SwitchHorizontal,
  PhoneIcon as Phone,
  MapPinIcon as MapPin,
  CalendarIcon as Calendar,
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  Squares2X2Icon,
  TagIcon,
  FunnelIcon,
  TruckIcon
} from '@heroicons/react/24/solid';

interface Repartidor {
  id: number;
  username: string;
  nombre: string;
  suscripcion: number;
  created_at: string;
}

interface RepartidorAsignado {
  id: number;
  username: string;
  nombre: string;
  suscripcion: number;
  created_at: string;
  asignado_desde: string;
}

interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  propietario_nombre?: string;
  usuario_id?: number;
  created_at?: string;
}

const RepartidorPanel = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [repartidoresDisponibles, setRepartidoresDisponibles] = useState<Repartidor[]>([]);
  const [repartidoresAsignados, setRepartidoresAsignados] = useState<RepartidorAsignado[]>([]);
  const [repartidoresDisponiblesOriginal, setRepartidoresDisponiblesOriginal] = useState<Repartidor[]>([]);
  const [repartidoresAsignadosOriginal, setRepartidoresAsignadosOriginal] = useState<RepartidorAsignado[]>([]);
  const [tiendaInfo, setTiendaInfo] = useState<Tienda | null>(null);
  const [filtroTextoDisponibles, setFiltroTextoDisponibles] = useState('');
  const [filtroTextoAsignados, setFiltroTextoAsignados] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('todos');
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Verificar que el usuario es de tipo tienda
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.tipo !== 'tienda') {
      router.push('/');
      return;
    }
    
    cargarDatos();
  }, [session, status]);

  const cargarDatos = async () => {
    setCargandoInicial(true);
    try {
      // Cargar información de la tienda del usuario actual
      const tiendaResponse = await fetch(`/api/tiendas`);
      if (!tiendaResponse.ok) {
        throw new Error('Error al cargar información de la tienda');
      }
      const tiendaData = await tiendaResponse.json();
      
      if (!tiendaData.success || !tiendaData.data || tiendaData.data.length === 0) {
        throw new Error('No se encontró información de la tienda');
      }
      
      // Para usuarios de tipo 'tienda', la API devuelve solo su tienda
      const miTienda = tiendaData.data[0];
      setTiendaInfo(miTienda);

      // Cargar información detallada de la tienda si es necesario
      const tiendaDetalleResponse = await fetch(`/api/tiendas/${miTienda.id}`);
      if (tiendaDetalleResponse.ok) {
        const tiendaDetalle = await tiendaDetalleResponse.json();
        if (tiendaDetalle.success) {
          setTiendaInfo(tiendaDetalle.data);
        }
      }

      // Cargar repartidores disponibles (todos los repartidores)
      const repartidoresResponse = await fetch('/api/repartidores');
      if (!repartidoresResponse.ok) {
        throw new Error('Error al cargar repartidores');
      }
      const repartidoresData = await repartidoresResponse.json();
      const todosRepartidores = repartidoresData.success ? repartidoresData.data || [] : [];

      // Cargar repartidores asignados a esta tienda
      const asignadosResponse = await fetch(`/api/tiendas/${miTienda.id}/repartidores`);
      let repartidoresAsignadosData: RepartidorAsignado[] = [];
      
      if (asignadosResponse.ok) {
        const asignadosData = await asignadosResponse.json();
        if (asignadosData.success) {
          repartidoresAsignadosData = asignadosData.data || [];
        }
      }

      // Filtrar disponibles (excluir los ya asignados)
      const idsAsignados = new Set(repartidoresAsignadosData.map(r => r.id));
      const repartidoresDisponiblesData = todosRepartidores.filter(
        (repartidor: Repartidor) => !idsAsignados.has(repartidor.id)
      );

      setRepartidoresDisponibles(repartidoresDisponiblesData);
      setRepartidoresDisponiblesOriginal(repartidoresDisponiblesData);
      setRepartidoresAsignados(repartidoresAsignadosData);
      setRepartidoresAsignadosOriginal(repartidoresAsignadosData);

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al cargar los datos: ' + (error as Error).message 
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    } finally {
      setCargandoInicial(false);
    }
  };

  // Cerrar sesión
  const handleCerrarSesion = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Ir al panel de cambio de rol
  const handleCambiarRol = () => {
    router.push('/rol');
  };

  // Asignar repartidor a la tienda
  const asignarRepartidor = async (repartidorId: number) => {
    if (!tiendaInfo) return;
    
    setCargando(true);
    try {
      const response = await fetch(`/api/tiendas/${tiendaInfo.id}/repartidores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repartidor_id: repartidorId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar repartidor');
      }

      // Mover el repartidor de disponibles a asignados
      const repartidor = repartidoresDisponibles.find(r => r.id === repartidorId);
      if (repartidor) {
        const repartidorAsignado = {
          ...repartidor,
          asignado_desde: new Date().toISOString()
        };
        const nuevosAsignados = [...repartidoresAsignados, repartidorAsignado];
        const nuevosDisponibles = repartidoresDisponibles.filter(r => r.id !== repartidorId);
        
        setRepartidoresAsignados(nuevosAsignados);
        setRepartidoresAsignadosOriginal(nuevosAsignados);
        setRepartidoresDisponibles(nuevosDisponibles);
        setRepartidoresDisponiblesOriginal(nuevosDisponibles);
      }

      setMensaje({ 
        tipo: 'exito', 
        texto: 'Repartidor asignado exitosamente' 
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: (error as Error).message });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Quitar repartidor de la tienda
  const quitarRepartidor = async (repartidorId: number) => {
    if (!tiendaInfo) return;
    
    setCargando(true);
    try {
      const response = await fetch(`/api/tiendas/${tiendaInfo.id}/repartidores/${repartidorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al quitar repartidor');
      }

      // Mover el repartidor de asignados a disponibles
      const repartidor = repartidoresAsignados.find(r => r.id === repartidorId);
      if (repartidor) {
        const { asignado_desde, ...repartidorDisponible } = repartidor;
        const nuevosDisponibles = [...repartidoresDisponibles, repartidorDisponible];
        const nuevosAsignados = repartidoresAsignados.filter(r => r.id !== repartidorId);
        
        setRepartidoresDisponibles(nuevosDisponibles);
        setRepartidoresDisponiblesOriginal(nuevosDisponibles);
        setRepartidoresAsignados(nuevosAsignados);
        setRepartidoresAsignadosOriginal(nuevosAsignados);
      }

      setMensaje({ 
        tipo: 'exito', 
        texto: 'Repartidor removido exitosamente' 
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: (error as Error).message });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    // Filtrar disponibles
    let disponiblesFiltrados = [...repartidoresDisponiblesOriginal];
    if (filtroTextoDisponibles.trim()) {
      const busqueda = filtroTextoDisponibles.toLowerCase();
      disponiblesFiltrados = disponiblesFiltrados.filter(repartidor => 
        repartidor.nombre.toLowerCase().includes(busqueda) || 
        repartidor.username.toLowerCase().includes(busqueda)
      );
    }
    if (filtroSuscripcion !== 'todos') {
      const suscrito = filtroSuscripcion === 'activa';
      disponiblesFiltrados = disponiblesFiltrados.filter(r => (r.suscripcion === 1) === suscrito);
    }
    setRepartidoresDisponibles(disponiblesFiltrados);

    // Filtrar asignados
    let asignadosFiltrados = [...repartidoresAsignadosOriginal];
    if (filtroTextoAsignados.trim()) {
      const busqueda = filtroTextoAsignados.toLowerCase();
      asignadosFiltrados = asignadosFiltrados.filter(repartidor => 
        repartidor.nombre.toLowerCase().includes(busqueda) || 
        repartidor.username.toLowerCase().includes(busqueda)
      );
    }
    setRepartidoresAsignados(asignadosFiltrados);
  };

  const limpiarFiltros = () => {
    setFiltroTextoDisponibles('');
    setFiltroTextoAsignados('');
    setFiltroSuscripcion('todos');
    setRepartidoresDisponibles(repartidoresDisponiblesOriginal);
    setRepartidoresAsignados(repartidoresAsignadosOriginal);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEstadisticas = () => {
    return {
      totalAsignados: repartidoresAsignadosOriginal.length,
      totalDisponibles: repartidoresDisponiblesOriginal.length,
      total: repartidoresDisponiblesOriginal.length + repartidoresAsignadosOriginal.length,
      suscritos: [...repartidoresDisponiblesOriginal, ...repartidoresAsignadosOriginal].filter(r => r.suscripcion === 1).length,
      mostrandoAsignados: repartidoresAsignados.length,
      mostrandoDisponibles: repartidoresDisponibles.length
    };
  };

  // Mostrar loading inicial
  if (cargandoInicial || status === 'loading') {
    return (
      <LoadingImage 
        title="Cargando gestión de repartidores" 
        subtitle="Preparando datos de tu tienda..."
        size="lg"
        color="#471396"
        speed="1.2"
      />
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  const user = session.user;
  const stats = getEstadisticas();

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
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                Gestión de Repartidores
              </h1>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCerrarSesion}
                className="group flex cursor-pointer items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-red-50/80 hover:text-red-700 border border-white/30 hover:border-red-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <LogOut className="w-4 h-4 group-hover:animate-pulse" />
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
              {/* Información de la tienda */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Repartidores de {tiendaInfo?.nombre}
                    </h2>
                    
                    
                    {tiendaInfo && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{tiendaInfo.direccion}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          <span>{tiendaInfo.telefono}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-500">
                          {stats.mostrandoAsignados + stats.mostrandoDisponibles} de {stats.total} repartidores mostrados
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reloj */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50 lg:col-start-4">
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
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {mensaje.texto && (
          <div className="mb-8">
            <div className={`backdrop-blur-sm border rounded-2xl p-6 shadow-lg ${
              mensaje.tipo === 'exito' 
                ? 'bg-green-50/80 border-green-200/60' 
                : 'bg-red-50/80 border-red-200/60'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    mensaje.tipo === 'exito' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {mensaje.tipo === 'exito' ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    mensaje.tipo === 'exito' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {mensaje.tipo === 'exito' ? 'Éxito' : 'Error'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    mensaje.tipo === 'exito' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {mensaje.texto}
                  </p>
                </div>
                <button
                  onClick={() => setMensaje({ tipo: '', texto: '' })}
                  className={`transition-colors duration-300 ${
                    mensaje.tipo === 'exito' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas detalladas */}
        <div className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Asignados */}
          <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalAsignados}</p>
              <p className="text-xs text-slate-600">Asignados</p>
            </div>
          </div>

          {/* Disponibles */}
          <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalDisponibles}</p>
              <p className="text-xs text-slate-600">Disponibles</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <TagIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-600">Total</p>
            </div>
          </div>
        </div>
      </div>

        {/* Filtros */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FunnelIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Filtros y Búsqueda</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Búsqueda Disponibles */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Disponibles</label>
                <input
                  type="text"
                  value={filtroTextoDisponibles}
                  onChange={(e) => setFiltroTextoDisponibles(e.target.value)}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                  placeholder="Nombre o username..."
                />
              </div>

              {/* Búsqueda Asignados */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Asignados</label>
                <input
                  type="text"
                  value={filtroTextoAsignados}
                  onChange={(e) => setFiltroTextoAsignados(e.target.value)}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Nombre o username..."
                />
              </div>

              {/* Filtro Suscripción */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Suscripción</label>
                <select
                  value={filtroSuscripcion}
                  onChange={(e) => setFiltroSuscripcion(e.target.value)}
                  className="w-full px-4 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="todos">Todos</option>
                  <option value="activa">Con suscripción</option>
                  <option value="inactiva">Sin suscripción</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={aplicarFiltros}
                  className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Search className="w-4 h-4" />
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

        {/* Lista de Repartidores - Layout de dos columnas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Repartidores Asignados */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  Repartidores Asignados ({stats.mostrandoAsignados})
                </h3>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {repartidoresAsignados.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Truck className="w-10 h-10 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">No hay repartidores asignados</h4>
                  <p className="text-slate-600 max-w-sm mx-auto">
                    Asigna repartidores desde la lista de disponibles para optimizar tus entregas
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50">
                  {repartidoresAsignados.map((repartidor) => (
                    <div key={repartidor.id} className="p-6 hover:bg-white/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold">
                              {repartidor.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-slate-900 truncate">{repartidor.nombre}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                                repartidor.suscripcion === 1
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {repartidor.suscripcion === 1 ? 'Suscrito' : 'Sin suscripción'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-sm mb-2">@{repartidor.username}</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                Asignado: {formatearFecha(repartidor.asignado_desde)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => quitarRepartidor(repartidor.id)}
                          disabled={cargando}
                          className="cursor-pointer p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg"
                          title="Quitar repartidor"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Repartidores Disponibles */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Repartidores Disponibles ({stats.mostrandoDisponibles})
                </h3>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {repartidoresDisponibles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">No hay repartidores disponibles</h4>
                  <p className="text-slate-600 max-w-sm mx-auto">
                    {repartidoresDisponiblesOriginal.length === 0 
                      ? 'No hay repartidores registrados en el sistema'
                      : 'No se encontraron repartidores con los filtros aplicados'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50">
                  {repartidoresDisponibles.map((repartidor) => (
                    <div key={repartidor.id} className="p-6 hover:bg-white/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold">
                              {repartidor.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-slate-900 truncate">{repartidor.nombre}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                                repartidor.suscripcion === 1 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {repartidor.suscripcion === 1 ? 'Suscrito' : 'Sin suscripción'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-sm mb-2">@{repartidor.username}</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                Registrado: {formatearFecha(repartidor.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => asignarRepartidor(repartidor.id)}
                          disabled={cargando}
                          className="cursor-pointer p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg"
                          title="Asignar repartidor"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepartidorPanel;