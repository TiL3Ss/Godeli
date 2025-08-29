// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingImage from '../components/LoadingImage';
import {
  MagnifyingGlassIcon as Search,
  UsersIcon as Users,
  Cog6ToothIcon as Settings,
  ShieldCheckIcon as Shield,
  CreditCardIcon as CreditCard,
  EllipsisVerticalIcon as MoreVertical,
  CheckIcon as Check,
  XMarkIcon as X,
  ExclamationTriangleIcon as AlertCircle,
  ArrowPathIcon as Loader2,
  ArrowRightOnRectangleIcon as LogOut,
  UserPlusIcon as UserPlus,
  ArrowsRightLeftIcon as SwitchHorizontal
} from '@heroicons/react/24/solid';

const AdminPanel = () => {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('todos');
  const [filtroAdmin, setFiltroAdmin] = useState('todos');
  const [filtroRepartidor, setFiltroRepartidor] = useState('todos');
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarModalAgregarUsuario, setMostrarModalAgregarUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: '',
    password: '',
    tipo: 'tienda',
    nombre: '',
    suscripcion: 0,
    AD: 0
  });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargandoInicial(true);
    try {
      const response = await fetch('/api/admin/usuarios');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al cargar los usuarios: ' + error.message 
      });
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

  // Agregar nuevo usuario
  const handleAgregarUsuario = async (e) => {
    e.preventDefault();
    
    if (!nuevoUsuario.username || !nuevoUsuario.password || !nuevoUsuario.nombre) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Por favor completa todos los campos requeridos' 
      });
      return;
    }

    setCargando(true);
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      // Agregar usuario a la lista local
      setUsuarios(prev => [...prev, data.data]);
      
      // Limpiar formulario
      setNuevoUsuario({
        username: '',
        password: '',
        tipo: 'tienda',
        nombre: '',
        suscripcion: 0,
        AD: 0
      });
      
      setMostrarModalAgregarUsuario(false);
      setMensaje({ 
        tipo: 'exito', 
        texto: 'Usuario creado exitosamente' 
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideTexto = usuario.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                         usuario.username.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideSuscripcion = filtroSuscripcion === 'todos' || 
                               (filtroSuscripcion === 'activa' && usuario.suscripcion === 1) ||
                               (filtroSuscripcion === 'inactiva' && usuario.suscripcion === 0);
    
    const coincideAdmin = filtroAdmin === 'todos' ||
                         (filtroAdmin === 'admin' && usuario.AD === 1) ||
                         (filtroAdmin === 'usuario' && usuario.AD === 0);

    const TypeRepartidor = filtroRepartidor === 'todos' ||
                          (filtroRepartidor === 'repartidor' && usuario.tipo === 'repartidor') ||
                          (filtroRepartidor === 'tienda' && usuario.tipo === 'tienda');                         
    
    return coincideTexto && coincideSuscripcion &&  TypeRepartidor && coincideAdmin;
  });

  // Función para cambiar estado de suscripción
  const cambiarSuscripcion = async (id, nuevoEstado) => {
    setCargando(true);
    try {
      const response = await fetch(`/api/admin/usuarios/${id}/suscripcion`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suscripcion: nuevoEstado ? 1 : 0 }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar suscripción');
      }
      
      setUsuarios(prev => prev.map(u => 
        u.id === id ? { ...u, suscripcion: nuevoEstado ? 1 : 0 } : u
      ));
      
      setMensaje({ 
        tipo: 'exito', 
        texto: `Suscripción ${nuevoEstado ? 'activada' : 'desactivada'} correctamente` 
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Función para cambiar permisos de administrador
  const cambiarAdmin = async (id, nuevoEstado) => {
    setCargando(true);
    try {
      const response = await fetch(`/api/admin/usuarios/${id}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ AD: nuevoEstado ? 1 : 0 }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar permisos de administrador');
      }
      
      setUsuarios(prev => prev.map(u => 
        u.id === id ? { ...u, AD: nuevoEstado ? 1 : 0 } : u
      ));
      
      setMensaje({ 
        tipo: 'exito', 
        texto: `Permisos de administrador ${nuevoEstado ? 'otorgados' : 'revocados'} correctamente` 
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  const estadisticas = {
    total: usuarios.length,
    suscritos: usuarios.filter(u => u.suscripcion === 1).length,
    administradores: usuarios.filter(u => u.AD === 1).length,
    tiendas: usuarios.filter(u => u.tipo === 'tienda').length,
    repartidores: usuarios.filter(u => u.tipo === 'repartidor').length
  };

  // Mostrar loading inicial
  if (cargandoInicial) {
    return (
      <LoadingImage 
        title="Cargando panel de administración" 
        subtitle="Obteniendo datos de usuarios..." 
        size="lg"
        color="#2563eb"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {/* Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona suscripciones y permisos de administrador</p>
            </div>
          </div>

          {/* Botones de acción */}
        <div className="flex items-center gap-3">
          {/* Botón Agregar Usuario */}
            <button
              onClick={() => setMostrarModalAgregarUsuario(true)}
              className="cursor-pointer w-12 h-12 flex items-center justify-center bg-green-600 active:bg-green-700 hover:bg-green-800 text-white rounded-full transition-colors shadow-md"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            {/* Botón Cambiar Rol */}
            <button
              onClick={handleCambiarRol}
              className="cursor-pointer w-12 h-12 flex items-center justify-center bg-purple-600 active:bg-purple-700 hover:bg-purple-700 text-white rounded-full transition-colors shadow-md"
            >
              <SwitchHorizontal className="w-5 h-5 " />
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleCerrarSesion}
              className="cursor-pointer w-12 h-12 flex items-center justify-center bg-red-600 active:bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors shadow-md"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>



        </div>
      </div>

      {/* Modal para agregar usuario */}
      {mostrarModalAgregarUsuario && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/40">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Agregar Nuevo Usuario</h3>
              <button
                onClick={() => setMostrarModalAgregarUsuario(false)}
                className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAgregarUsuario} className="space-y-5 text-gray-700">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.username}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario *
                </label>
                <select
                  value={nuevoUsuario.tipo}
                  onChange={(e) =>
                    setNuevoUsuario({ ...nuevoUsuario, tipo: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="tienda">Tienda</option>
                  <option value="repartidor">Repartidor</option>
                </select>
              </div>

              {/* Suscripción */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Suscripción
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoUsuario.suscripcion === 1}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        suscripcion: e.target.checked ? 1 : 0,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              {/* Admin */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Permisos de administrador
                </span>
                <label className="relative inline-flex items-center cursor-pointer ">
                  <input
                    type="checkbox"
                    checked={nuevoUsuario.AD === 1}
                    onChange={(e) =>
                      setNuevoUsuario({
                        ...nuevoUsuario,
                        AD: e.target.checked ? 1 : 0,
                      })
                    }
                    className="sr-only peer "
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>


              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgregarUsuario(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100/70 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          mensaje.tipo === 'exito' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {mensaje.tipo === 'exito' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suscripciones</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.suscritos}</p>
            </div>
            <CreditCard className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.administradores}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiendas</p>
              <p className="text-2xl font-bold text-purple-600">{estadisticas.tiendas}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-xs font-bold">T</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repartidores</p>
              <p className="text-2xl font-bold text-orange-600">{estadisticas.repartidores}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">R</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o username..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
          
          {/* Filtro Suscripción */}
          <select
            value={filtroSuscripcion}
            onChange={(e) => setFiltroSuscripcion(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="todos">Todas las suscripciones</option>
            <option value="activa">Suscripción activa</option>
            <option value="inactiva">Suscripción inactiva</option>
          </select>
          
          {/* Filtro Admin */}
          <select
            value={filtroAdmin}
            onChange={(e) => setFiltroAdmin(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Solo administradores</option>
            <option value="usuario">Solo usuarios</option>
          </select>
          {/* Filtro Tipo */}
          <select
            value={filtroRepartidor}
            onChange={(e) => setFiltroRepartidor(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="todos">Todos los tipos</option>
            <option value="tienda">Solo tiendas</option>
            <option value="repartidor">Solo repartidores</option>
          </select>

        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Usuarios ({usuariosFiltrados.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-500">Prueba ajustando los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {usuariosFiltrados.map((usuario) => (
                <div key={usuario.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Info del usuario */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{usuario.nombre}</h4>
                        <p className="text-gray-500 text-sm">@{usuario.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            usuario.tipo === 'tienda' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {usuario.tipo === 'tienda' ? 'Tienda' : 'Repartidor'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Toggle Suscripción */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-700">Suscripción</span>
                        </div>
                        <button
                          onClick={() => cambiarSuscripcion(usuario.id, usuario.suscripcion === 0)}
                          disabled={cargando}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            usuario.suscripcion === 1 ? 'bg-green-600' : 'bg-gray-300'
                          } ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            usuario.suscripcion === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      
                      {/* Toggle Admin */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-700">Admin</span>
                        </div>
                        <button
                          onClick={() => cambiarAdmin(usuario.id, usuario.AD === 0)}
                          disabled={cargando}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            usuario.AD === 1 ? 'bg-blue-600' : 'bg-gray-300'
                          } ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            usuario.AD === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
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
};

export default AdminPanel;