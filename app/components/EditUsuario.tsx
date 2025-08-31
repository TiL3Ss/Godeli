// app/components/EditUsuario.tsx
'use client';

import React, { useState } from 'react';
import {
  XMarkIcon as X,
  ArrowPathIcon as Loader2,
  UserIcon as User,
  KeyIcon as Key,
  TagIcon as Tag,
  ShieldCheckIcon as Shield,
  CreditCardIcon as CreditCard,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/solid';

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  tipo: string;
  suscripcion: number;
  AD: number;
}

interface EditUsuarioProps {
  usuario: Usuario;
  onClose: () => void;
  onUsuarioActualizado: (usuario: Usuario) => void;
}

const EditUsuario: React.FC<EditUsuarioProps> = ({ 
  usuario, 
  onClose, 
  onUsuarioActualizado 
}) => {
  const [formData, setFormData] = useState({
    username: usuario.username,
    nombre: usuario.nombre,
    tipo: usuario.tipo,
    suscripcion: usuario.suscripcion,
    AD: usuario.AD,
    password: '', // Nueva contraseña opcional
    confirmarPassword: ''
  });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarCampoPassword, setMostrarCampoPassword] = useState(false);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.username || formData.username.length < 3) {
      setMensaje({ tipo: 'error', texto: 'El username debe tener al menos 3 caracteres' });
      return false;
    }

    if (!formData.nombre || formData.nombre.trim() === '') {
      setMensaje({ tipo: 'error', texto: 'El nombre es requerido' });
      return false;
    }

    if (mostrarCampoPassword) {
      if (formData.password && formData.password.length < 6) {
        setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' });
        return false;
      }

      if (formData.password !== formData.confirmarPassword) {
        setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
        return false;
      }
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Preparar datos para enviar
      const dataToSend: any = {
        username: formData.username,
        nombre: formData.nombre,
        tipo: formData.tipo,
        suscripcion: formData.suscripcion,
        AD: formData.AD
      };

      // Solo incluir password si se está cambiando
      if (mostrarCampoPassword && formData.password) {
        dataToSend.password = formData.password;
      }

      const response = await fetch(`/api/admin/editar_usuario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: usuario.id,
          ...dataToSend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      // Usuario actualizado exitosamente
      const usuarioActualizado = {
        ...usuario,
        username: formData.username,
        nombre: formData.nombre,
        tipo: formData.tipo,
        suscripcion: formData.suscripcion,
        AD: formData.AD
      };

      onUsuarioActualizado(usuarioActualizado);
      onClose();

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error al actualizar usuario' 
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header estilo Windows 11 */}
        <div className="sticky top-0 bg-white backdrop-blur-xl rounded-t-3xl p-6 border-b border-gray-200/50 z-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Editar Usuario</h2>
                <p className="text-sm text-gray-600">@{usuario.username}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="cursor-pointer p-2.5 hover:bg-gray-200/60 rounded-xl transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          {/* Mensaje de estado */}
          {mensaje.texto && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
              mensaje.tipo === 'exito' 
                ? 'bg-green-50/80 border border-green-200/50 text-green-800' 
                : 'bg-red-50/80 border border-red-200/50 text-red-800'
            }`}>
              {mensaje.tipo === 'exito' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Ingresa el username"
                required
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4" />
                Nombre completo
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Ingresa el nombre completo"
                required
              />
            </div>

            {/* Tipo de usuario */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4" />
                Tipo de usuario
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900"
              >
                <option value="tienda">Tienda</option>
                <option value="repartidor">Repartidor</option>
              </select>
            </div>

            {/* Controles de switches */}
            <div className="space-y-4">
              {/* Suscripción */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-200/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Suscripción</p>
                    <p className="text-sm text-gray-600">Activar suscripción premium</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="suscripcion"
                    checked={formData.suscripcion === 1}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/40 rounded-full peer peer-checked:bg-green-500 transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Administrador */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-200/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Administrador</p>
                    <p className="text-sm text-gray-600">Otorgar permisos de administrador</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="AD"
                    checked={formData.AD === 1}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/40 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 peer-checked:translate-x-6"></div>
                </label>
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Key className="w-4 h-4" />
                  Cambiar contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCampoPassword(!mostrarCampoPassword);
                    if (mostrarCampoPassword) {
                      setFormData(prev => ({ ...prev, password: '', confirmarPassword: '' }));
                    }
                  }}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mostrarCampoPassword
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {mostrarCampoPassword ? 'Cancelar' : 'Cambiar'}
                </button>
              </div>

              {mostrarCampoPassword && (
                <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-200/40">
                  <div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Nueva contraseña"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Confirmar nueva contraseña"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 px-6 py-3.5 border border-gray-300/60 text-gray-700 rounded-2xl hover:bg-gray-100/60 font-semibold transition-all duration-200 backdrop-blur-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="cursor-pointer flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUsuario;