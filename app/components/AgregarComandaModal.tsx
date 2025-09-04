// components/AgregarComandaModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon as X,
  UserIcon as User,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  ShoppingCartIcon as Cart,
  ExclamationTriangleIcon as AlertTriangle,
  CheckCircleIcon as CheckCircle,
  PlusIcon as Plus,
  MinusIcon ,
} from '@heroicons/react/24/solid';

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

interface AgregarComandaModalProps {
  tiendaId: number;
  onClose: () => void;
  onComandaCreated: () => void;
}

interface ProductoSeleccionado {
  producto_id: number;
  cantidad: number;
  producto: Producto;
}

export default function AgregarComandaModal({
  tiendaId,
  onClose,
  onComandaCreated,
}: AgregarComandaModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    loadProductos();
  }, [tiendaId]);

  const loadProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await fetch(`/api/productos?tienda_id=${tiendaId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setProductos(data.data || []);
      } else {
        setProductos([]);
        setMensaje({ tipo: 'error', texto: data.error || 'No hay productos' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al cargar productos' });
    } finally {
      setLoadingProductos(false);
    }
  };

  const agregarProducto = (producto: Producto) => {
    const existe = productosSeleccionados.find(
      (p) => p.producto_id === producto.id
    );
    if (existe) {
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.producto_id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      );
    } else {
      setProductosSeleccionados((prev) => [
        ...prev,
        { producto_id: producto.id, cantidad: 1, producto },
      ]);
    }
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      setProductosSeleccionados((prev) =>
        prev.filter((p) => p.producto_id !== productoId)
      );
    } else {
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.producto_id === productoId ? { ...p, cantidad } : p
        )
      );
    }
  };

  const calcularTotal = () =>
    productosSeleccionados.reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cliente_nombre.trim() || !formData.cliente_direccion.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Nombre y dirección del cliente son requeridos',
      });
      return;
    }

    if (productosSeleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes agregar al menos un producto' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tienda_id: tiendaId,
          ...formData,
          productos: productosSeleccionados.map((p) => ({
            producto_id: p.producto_id,
            cantidad: p.cantidad,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);

      onComandaCreated();
      onClose();
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.message || 'Error al crear la comanda',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-gray-700">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl rounded-t-3xl p-6 border-b border-gray-200/50 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Cart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Nueva Comanda
                </h2>
                <p className="text-sm text-gray-600">
                  Registra los datos del cliente y selecciona productos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-200/60 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-gray-600 hover:text-red-700" />
            </button>
          </div>
        </div>

        {/* Mensaje */}
        {mensaje.texto && (
          <div
            className={`m-6 p-4 rounded-2xl flex items-center gap-3 ${
              mensaje.tipo === 'error'
                ? 'bg-red-50/80 border border-red-200/50 text-red-800'
                : 'bg-green-50/80 border border-green-200/50 text-green-800'
            }`}
          >
            {mensaje.tipo === 'error' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{mensaje.texto}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cliente */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4" />
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={formData.cliente_nombre}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cliente_nombre: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Phone className="w-4 h-4" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.cliente_telefono}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cliente_telefono: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4" />
                Dirección *
              </label>
              <textarea
                rows={3}
                value={formData.cliente_direccion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cliente_direccion: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200/60 bg-white/60 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                placeholder="Ej: Av. Siempre Viva 742"
              />
            </div>

            {/* Resumen */}
            {productosSeleccionados.length > 0 && (
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/60">
                <h4 className="text-sm font-semibold mb-3">Resumen del Pedido</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {productosSeleccionados.map((item) => (
                    <div
                      key={item.producto_id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700">
                        {item.cantidad}x {item.producto.nombre}
                      </span>
                      <span className="font-semibold">
                        ${(item.producto.precio * item.cantidad).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${calcularTotal().toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">
              Seleccionar Productos
            </h4>

            {loadingProductos ? (
              <p className="text-sm text-gray-500">Cargando productos...</p>
            ) : productos.length === 0 ? (
              <p className="text-sm text-gray-500">No hay productos disponibles</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {productos.map((producto) => {
                  const seleccionado = productosSeleccionados.find(
                    (p) => p.producto_id === producto.id
                  );
                  return (
                    <div
                      key={producto.id}
                      className="p-4 rounded-2xl border border-gray-200/60 bg-white/60"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold">{producto.nombre}</h5>
                          {producto.descripcion && (
                            <p className="text-sm text-gray-600">
                              {producto.descripcion}
                            </p>
                          )}
                        </div>
                        <span className="text-emerald-600 font-bold">
                          ${producto.precio.toFixed(0)}
                        </span>
                      </div>

                      <div className="mt-3">
                        {seleccionado ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                actualizarCantidad(
                                  producto.id,
                                  seleccionado.cantidad - 1
                                )
                              }
                              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {seleccionado.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                actualizarCantidad(
                                  producto.id,
                                  seleccionado.cantidad + 1
                                )
                              }
                              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => agregarProducto(producto)}
                            className="cursor-pointer mt-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-medium"
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="lg:col-span-2 flex gap-3 pt-6 border-t border-gray-200/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-gray-300/60 text-gray-700 rounded-2xl hover:bg-gray-100 hover:text-red-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || productosSeleccionados.length === 0}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Comanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
