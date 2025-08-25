// components/ComandaCard.tsx
'use client';

import { useState } from 'react';

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
      precio: number;
    };
  }>;
}

interface ComandaCardProps {
  comanda: Comanda;
  esRepartidor?: boolean;
  onEstadoChange: (comandaId: number, estado: string, comentario?: string) => void;
}

export default function ComandaCard({ comanda, esRepartidor, onEstadoChange }: ComandaCardProps) {
  const [showComentario, setShowComentario] = useState(false);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (nuevoEstado === 'cancelada' && !showComentario) {
      setShowComentario(true);
      return;
    }

    setLoading(true);
    try {
      await onEstadoChange(comanda.id, nuevoEstado, comentario || undefined);
      setShowComentario(false);
      setComentario('');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccionesDisponibles = () => {
    if (esRepartidor) {
      switch (comanda.estado) {
        case 'activa':
          return [
            { estado: 'en_proceso', texto: 'Tomar Pedido', color: 'bg-blue-600 hover:bg-blue-700' }
          ];
        case 'en_proceso':
          return [
            { estado: 'completada', texto: 'Marcar Completada', color: 'bg-green-600 hover:bg-green-700' },
            { estado: 'cancelada', texto: 'Cancelar', color: 'bg-red-600 hover:bg-red-700' }
          ];
        default:
          return [];
      }
    } else {
      // Para tiendas
      switch (comanda.estado) {
        case 'activa':
          return [
            { estado: 'cancelada', texto: 'Cancelar', color: 'bg-red-600 hover:bg-red-700' }
          ];
        case 'en_proceso':
          return [
            { estado: 'completada', texto: 'Marcar Completada', color: 'bg-green-600 hover:bg-green-700' },
            { estado: 'cancelada', texto: 'Cancelar', color: 'bg-red-600 hover:bg-red-700' }
          ];
        default:
          return [];
      }
    }
  };

  const acciones = getAccionesDisponibles();

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">#{comanda.id}</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {comanda.cliente_nombre}
              </h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(comanda.created_at)}
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(comanda.estado)}`}>
            {getEstadoText(comanda.estado)}
          </span>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-600 space-y-1">
            {comanda.cliente_telefono && (
              <div className="flex items-center">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {comanda.cliente_telefono}
              </div>
            )}
            <div className="flex items-start">
              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{comanda.cliente_direccion}</span>
            </div>
            {comanda.repartidor && (
              <div className="flex items-center">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Repartidor: {comanda.repartidor.nombre}
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        {comanda.productos && comanda.productos.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Productos:</h4>
            <div className="space-y-1">
              {comanda.productos.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.cantidad}x {item.producto.nombre}</span>
                  <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total:</span>
            <span className="text-xl font-bold text-indigo-600">${comanda.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Comentario problema */}
        {comanda.comentario_problema && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Comentario: </span>
                  {comanda.comentario_problema}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campo de comentario para cancelación */}
        {showComentario && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de cancelación:
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Explica el motivo de la cancelación..."
            />
          </div>
        )}

        {/* Acciones */}
        {acciones.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {showComentario ? (
              <>
                <button
                  onClick={() => {
                    setShowComentario(false);
                    setComentario('');
                  }}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEstadoChange('cancelada')}
                  disabled={loading || !comentario.trim()}
                  className="flex-1 min-w-0 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : 'Confirmar Cancelación'}
                </button>
              </>
            ) : (
              acciones.map((accion) => (
                <button
                  key={accion.estado}
                  onClick={() => handleEstadoChange(accion.estado)}
                  disabled={loading}
                  className={`flex-1 min-w-0 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${accion.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Procesando...' : accion.texto}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}