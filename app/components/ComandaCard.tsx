// components/ComandaCard.tsx
'use client';

import { useState } from 'react';
import { Comanda } from '../../types';

interface ComandaCardProps {
  comanda: Comanda;
  esRepartidor: boolean;
  onEstadoChange: (comandaId: number, estado: string, comentario?: string) => void;
}

export default function ComandaCard({ comanda, esRepartidor, onEstadoChange }: ComandaCardProps) {
  const [showProblemaModal, setShowProblemaModal] = useState(false);
  const [comentario, setComentario] = useState('');

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
        return 'bg-green-100 text-green-800';
      case 'en_proceso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleEntregada = () => {
    onEstadoChange(comanda.id, 'completada');
  };

  const handleProblema = () => {
    if (comentario.trim()) {
      onEstadoChange(comanda.id, 'cancelada', comentario);
      setShowProblemaModal(false);
      setComentario('');
    }
  };

  const handleEnProceso = () => {
    onEstadoChange(comanda.id, 'en_proceso');
  };

  return (
    <>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Comanda #{comanda.id}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(comanda.estado)}`}>
              {getEstadoText(comanda.estado)}
            </span>
          </div>

          {/* Info del cliente */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{comanda.cliente_nombre}</span>
            </div>
            
            {comanda.cliente_telefono && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {comanda.cliente_telefono}
              </div>
            )}
            
            <div className="flex items-start text-sm text-gray-600">
              <svg className="mr-2 h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{comanda.cliente_direccion}</span>
            </div>
          </div>

          {/* Mostrar tienda si es repartidor */}
          {esRepartidor && comanda.tienda && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                </svg>
                <span className="font-medium">{comanda.tienda.nombre}</span>
              </div>
            </div>
          )}

          {/* Lista de productos */}
          {comanda.productos && comanda.productos.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Productos:</h4>
              <div className="space-y-1">
                {comanda.productos.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.cantidad}x {item.producto?.nombre}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-900">Total:</span>
            <span className="text-lg font-bold text-gray-900">${comanda.total.toFixed(2)}</span>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-gray-500 mb-4">
            <p>Creada: {formatDate(comanda.created_at)}</p>
            {comanda.repartidor && (
              <p>Repartidor: {comanda.repartidor.nombre}</p>
            )}
            {comanda.comentario_problema && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-xs">
                  <span className="font-semibold">Problema:</span> {comanda.comentario_problema}
                </p>
              </div>
            )}
          </div>

          {/* Botones para repartidor */}
          {esRepartidor && comanda.estado === 'activa' && (
            <div className="flex space-x-2">
              <button
                onClick={handleEnProceso}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                En Proceso
              </button>
              <button
                onClick={handleEntregada}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Entregada
              </button>
              <button
                onClick={() => setShowProblemaModal(true)}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Problema
              </button>
            </div>
          )}

          {esRepartidor && comanda.estado === 'en_proceso' && (
            <div className="flex space-x-2">
              <button
                onClick={handleEntregada}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Entregada
              </button>
              <button
                onClick={() => setShowProblemaModal(true)}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Problema
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de problema */}
      {showProblemaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Reportar Problema
                </h3>
                <button
                  onClick={() => setShowProblemaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe el problema:
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Cliente no estaba en la dirección, dirección incorrecta, etc."
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowProblemaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProblema}
                  disabled={!comentario.trim()}
                  className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}