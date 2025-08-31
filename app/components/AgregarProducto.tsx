// app/components/AgregarProducto.tsx
'use client';

import React, { useState } from 'react';
import {
  XMarkIcon as X,
  ArrowPathIcon as Loader2,
  TagIcon as Tag,
  CurrencyDollarIcon as DollarSign,
  DocumentTextIcon as FileText,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle,
  PlusCircleIcon as PlusCircle,
  BuildingStorefrontIcon as Store
} from '@heroicons/react/24/solid';

interface NuevoProducto {
  nombre: string;
  descripcion: string;
  precio: string;
  tienda_id: number;
}

interface AgregarProductoProps {
  onClose: () => void;
  onProductoAgregado: (producto: any) => void; // Cambiado de onProductoCreado a onProductoAgregado
  tiendaId: number;
  nombreTienda?: string;
}

const AgregarProducto: React.FC<AgregarProductoProps> = ({ 
  onClose, 
  onProductoAgregado, // Cambiado de onProductoCreado a onProductoAgregado
  tiendaId,
  nombreTienda 
}) => {
  const [formData, setFormData] = useState<NuevoProducto>({
    nombre: '',
    descripcion: '',
    precio: '',
    tienda_id: tiendaId
  });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.nombre || formData.nombre.trim() === '') {
      setMensaje({ tipo: 'error', texto: 'El nombre del producto es requerido' });
      return false;
    }

    if (!formData.precio || formData.precio.trim() === '') {
      setMensaje({ tipo: 'error', texto: 'El precio es requerido' });
      return false;
    }

    const precioNum = Number(formData.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setMensaje({ tipo: 'error', texto: 'El precio debe ser un número mayor a 0' });
      return false;
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
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precio: Number(formData.precio)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear producto');
      }

      // Producto creado exitosamente - usar el callback correcto
      onProductoAgregado(data.data);
      
      // Mostrar mensaje de éxito brevemente antes de cerrar
      setMensaje({ tipo: 'exito', texto: data.message || 'Producto creado exitosamente' });
      
      // Cerrar modal después de un pequeño delay
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error al crear producto' 
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agregar Nuevo Producto</h2>
                {nombreTienda && (
                  <p className="text-sm text-gray-600">Para {nombreTienda}</p>
                )}
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
            {/* Tienda (solo informativo) */}
            {nombreTienda && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Tienda</p>
                    <p className="text-sm text-blue-700">{nombreTienda}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nombre del producto */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4" />
                Nombre del producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Ingresa el nombre del producto"
                required
                disabled={cargando}
              />
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="w-4 h-4" />
                Precio *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="$$$"
                required
                disabled={cargando}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4" />
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Descripción opcional del producto"
                disabled={cargando}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={cargando}
                className="cursor-pointer flex-1 px-6 py-3.5 border border-gray-300/60 text-gray-700 rounded-2xl hover:bg-gray-100/60 hover:text-red-700 font-semibold transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="cursor-pointer flex-1 px-6 py-3.5 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Producto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgregarProducto;