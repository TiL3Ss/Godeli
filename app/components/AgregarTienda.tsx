// app/components/AgregarTienda.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon as X,
  ArrowPathIcon as Loader2,
  BuildingStorefrontIcon as Store,
  UserIcon as User,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle,
  PlusIcon as Plus
} from '@heroicons/react/24/solid';

interface NuevaTienda {
  usuario_id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface Usuario {
  id: number;
  username: string;
}

interface AgregarTiendaProps {
  onClose: () => void;
  onTiendaCreada: (tienda: any) => void;
}

const AgregarTienda: React.FC<AgregarTiendaProps> = ({
  onClose,
  onTiendaCreada,
}) => {
  const [formData, setFormData] = useState<NuevaTienda>({
    usuario_id: 0,
    nombre: '',
    direccion: '',
    telefono: '',
  });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar lista de usuarios
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
      setUsuarios(data); // ← ahora espera que la API devuelva el array directamente
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al cargar los usuarios: ' + error.message,
      });
    } finally {
      setCargandoInicial(false);
    }
  };

  // Manejar cambios en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'usuario_id' ? parseInt(value) : value,
    }));
  };

  // Validar
  const validarFormulario = () => {
    if (!formData.usuario_id) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un usuario' });
      return false;
    }
    if (!formData.nombre || formData.nombre.trim() === '') {
      setMensaje({ tipo: 'error', texto: 'El nombre de la tienda es obligatorio' });
      return false;
    }
    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await fetch('/api/tiendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear tienda');

      onTiendaCreada(data);
      onClose();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'Error al crear tienda',
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white backdrop-blur-xl rounded-t-3xl p-6 border-b border-gray-200/50 z-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agregar Nueva Tienda</h2>
                <p className="text-sm text-gray-600">Registrar una tienda asociada a un usuario</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-200/60 rounded-xl transition-all duration-200 group"
            >
              <X className="cursor-pointer w-5 h-5 text-gray-600 group-hover:text-red-800" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Mensaje */}
          {mensaje.texto && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                mensaje.tipo === 'exito'
                  ? 'bg-green-50/80 border border-green-200/50 text-green-800'
                  : 'bg-red-50/80 border border-red-200/50 text-red-800'
              }`}
            >
              {mensaje.tipo === 'exito' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{mensaje.texto}</span>
            </div>
          )}

          {cargandoInicial ? (
            <p className="text-sm text-gray-500">Cargando usuarios...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Usuario */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4" />
                  Usuario *
                </label>
                <select
                  name="usuario_id"
                  value={formData.usuario_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Store className="w-4 h-4" />
                  Nombre de la tienda *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Ej: Supermercado La Estrella"
                  required
                />
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Ej: Av. Siempre Viva 742"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer flex-1 px-6 py-3.5 border border-gray-300/60 text-gray-700 rounded-2xl hover:bg-gray-100/60 hover:text-red-700 font-semibold transition-all duration-200 backdrop-blur-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Crear Tienda
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgregarTienda;
