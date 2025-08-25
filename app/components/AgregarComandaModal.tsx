// components/AgregarComandaModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Producto, ComandaFormData } from '../../types';

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

export default function AgregarComandaModal({ tiendaId, onClose, onComandaCreated }: AgregarComandaModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_direccion: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    loadProductos();
  }, [tiendaId]);

  const loadProductos = async () => {
    try {
      const productosData = await getProductosTienda(tiendaId);
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const agregarProducto = (producto: Producto) => {
    const existe = productosSeleccionados.find(p => p.producto_id === producto.id);
    if (existe) {
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.producto_id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      );
    } else {
      setProductosSeleccionados(prev => [
        ...prev,
        { producto_id: producto.id, cantidad: 1, producto }
      ]);
    }
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      setProductosSeleccionados(prev =>
        prev.filter(p => p.producto_id !== productoId)
      );
    } else {
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.producto_id === productoId
            ? { ...p, cantidad }
            : p
        )
      );
    }
  };

  const eliminarProducto = (productoId: number) => {
    setProductosSeleccionados(prev =>
      prev.filter(p => p.producto_id !== productoId)
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => {
      return total + (item.producto.precio * item.cantidad);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productosSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const comandaData: ComandaFormData = {
        ...formData,
        productos: productosSeleccionados.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad
        }))
      };

      await crearComanda(tiendaId, comandaData);
      onComandaCreated();
    } catch (error) {
      console.error('Error al crear comanda:', error);
      alert('Error al crear la comanda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Nueva Comanda</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Información del Cliente</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente_nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.cliente_telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefono: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.cliente_direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_direccion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Resumen del pedido */}
              {productosSeleccionados.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Resumen del Pedido</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {productosSeleccionados.map((item) => (
                        <div key={item.producto_id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {item.cantidad}x {item.producto.nombre}
                            </span>
                            <button
                              type="button"
                              onClick={() => eliminarProducto(item.producto_id)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <span className="text-sm font-medium">
                            ${(item.producto.precio * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="text-lg font-bold">${calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selección de productos */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Seleccionar Productos</h4>
              
              {loadingProductos ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : productos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos disponibles</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {productos.map((producto) => {
                    const productoSeleccionado = productosSeleccionados.find(p => p.producto_id === producto.id);
                    return (
                      <div key={producto.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{producto.nombre}</h5>
                            {producto.descripcion && (
                              <p className="text-sm text-gray-600">{producto.descripcion}</p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-indigo-600">
                            ${producto.precio.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {productoSeleccionado ? (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => actualizarCantidad(producto.id, productoSeleccionado.cantidad - 1)}
                                className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{productoSeleccionado.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => actualizarCantidad(producto.id, productoSeleccionado.cantidad + 1)}
                                className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => agregarProducto(producto)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
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
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || productosSeleccionados.length === 0}
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Comanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}