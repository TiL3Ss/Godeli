// app/components/ModificarProducto.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon as X,
  ArrowPathIcon as Loader2,
  TagIcon as Tag,
  CurrencyDollarIcon as DollarSign,
  DocumentTextIcon as FileText,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle,
  PencilSquareIcon as Edit,
  BuildingStorefrontIcon as Store,
  EyeIcon as Eye,
  EyeSlashIcon as EyeOff
} from '@heroicons/react/24/solid';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  tienda_id?: number;
}

interface ProductoModificar {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  activo: boolean;
}

interface ModificarProductoProps {
  onClose: () => void;
  onProductoModificado: (producto: any) => void;
  producto: Producto;
  nombreTienda?: string;
}

const ModificarProducto: React.FC<ModificarProductoProps> = ({ 
  onClose, 
  onProductoModificado,
  producto,
  nombreTienda 
}) => {
  const [formData, setFormData] = useState<ProductoModificar>({
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    precio: producto.precio.toString(),
    activo: producto.activo
  });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
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
        method: 'PUT',
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
        throw new Error(data.error || 'Error al modificar producto');
      }

      // Producto modificado exitosamente
      const productoActualizado = {
        ...producto,
        ...formData,
        precio: Number(formData.precio)
      };
      onProductoModificado(productoActualizado);
      onClose();

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error al modificar producto' 
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Modificar Producto</h2>
                {nombreTienda && (
                  <p className="text-sm text-gray-600">En {nombreTienda}</p>
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
                placeholder="0.00"
                required
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
              />
            </div>

            {/* Estado del producto */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-200/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    {formData.activo ? (
                      <Eye className="w-5 h-5 text-green-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Producto activo</p>
                    <p className="text-sm text-gray-600">
                      {formData.activo ? 'Visible para los clientes' : 'Oculto para los clientes'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/40 rounded-full peer peer-checked:bg-green-500 transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 peer-checked:translate-x-6"></div>
                </label>
              </div>
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
                className="cursor-pointer flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModificarProducto;