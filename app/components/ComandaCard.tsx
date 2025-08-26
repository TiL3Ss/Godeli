// components/ComandaCard.tsx
'use client';

import { useState } from 'react';
import {
  CheckCircleIcon, XCircleIcon, CubeIcon, UserIcon, ClockIcon, 
  MapPinIcon, PhoneIcon, BoltIcon, CheckBadgeIcon, NoSymbolIcon, 
  QuestionMarkCircleIcon, ChevronDownIcon, TruckIcon
} from '@heroicons/react/24/solid';

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
  disponible?: boolean; // Nueva propiedad para repartidores
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
  onTomarComanda?: (comandaId: number) => void; // Nueva prop para tomar comandas
}

export default function ComandaCard({ comanda, esRepartidor, onEstadoChange, onTomarComanda }: ComandaCardProps) {
  const [showComentario, setShowComentario] = useState(false);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'activa':
        return {
          color: 'bg-gradient-to-r from-emerald-500 to-green-500',
          text: 'text-white',
          border: 'border-emerald-200/50',
          bg: 'bg-emerald-50/50',
          icon: (
            <BoltIcon className="w-4 h-4 text-white p-0.5" />
          ),
          label: 'Activa'
        };
      case 'en_proceso':
        return {
          color: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          border: 'border-amber-200/50',
          bg: 'bg-amber-50/50',
          icon: (
            <ClockIcon className="w-4 h-4 text-white p-0.5" />
          ),
          label: 'En Proceso'
        };
      case 'completada':
        return {
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          text: 'text-white',
          border: 'border-blue-200/50',
          bg: 'bg-blue-50/50',
          icon: (
            <CheckBadgeIcon className="w-4 h-4 text-white p-0.5" />
          ),
          label: 'Completada'
        };
      case 'cancelada':
        return {
          color: 'bg-gradient-to-r from-red-500 to-pink-500',
          text: 'text-white',
          border: 'border-red-200/50',
          bg: 'bg-red-50/50',
          icon: (
            <NoSymbolIcon className="w-4 h-4 text-white p-0.5" />
          ),
          label: 'Cancelada'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-slate-500 to-gray-500',
          text: 'text-white',
          border: 'border-gray-200/50',
          bg: 'bg-gray-50/50',
          icon: (
            <QuestionMarkCircleIcon className="w-4 h-4 text-white p-0.5" />
          ),
          label: estado
        };
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

  const handleTomarComanda = async () => {
    if (!onTomarComanda) return;
    
    setLoading(true);
    try {
      await onTomarComanda(comanda.id);
    } catch (error) {
      console.error('Error al tomar comanda:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccionesDisponibles = () => {
    if (esRepartidor) {
      // Si es repartidor y la comanda está disponible (sin asignar)
      if (comanda.disponible) {
        return [
          { 
            estado: 'tomar', 
            texto: 'Tomar Comanda', 
            color: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
            icon: <TruckIcon className="w-4 h-4 text-white" />,
            action: handleTomarComanda
          }
        ];
      }
      
      // Si es repartidor y la comanda ya está asignada
      switch (comanda.estado) {
        case 'activa':
          return [
            { 
              estado: 'en_proceso', 
              texto: 'Iniciar Entrega', 
              color: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
              icon: <BoltIcon className="w-4 h-4 text-white p-0.5" />,
              action: () => handleEstadoChange('en_proceso')
            }
          ];
        case 'en_proceso':
          return [
            { 
              estado: 'completada', 
              texto: 'Completar', 
              color: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
              icon: <CheckCircleIcon className="w-5 h-5 text-white" />,
              action: () => handleEstadoChange('completada')
            },
            { 
              estado: 'cancelada', 
              texto: 'Cancelar', 
              color: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
              icon: <XCircleIcon className="w-5 h-5 text-white" />,
              action: () => handleEstadoChange('cancelada')
            }
          ];
        default:
          return [];
      }
    } else {
      // Acciones para tienda
      switch (comanda.estado) {
        case 'activa':
          return [
            { 
              estado: 'cancelada', 
              texto: 'Cancelar', 
              color: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
              icon: <XCircleIcon className="w-4 h-4 text-white" />,
              action: () => handleEstadoChange('cancelada')
            }
          ];
        case 'en_proceso':
          return [
            { 
              estado: 'completada', 
              texto: 'Completar', 
              color: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
              icon: <CheckCircleIcon className="w-7 h-7 text-white" />,
              action: () => handleEstadoChange('completada')
            },
            { 
              estado: 'cancelada', 
              texto: 'Cancelar', 
              color: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
              icon: <NoSymbolIcon className="w-4 h-4 text-white" />,
              action: () => handleEstadoChange('cancelada')
            }
          ];
        default:
          return [];
      }
    }
  };

  const acciones = getAccionesDisponibles();
  const estadoConfig = getEstadoConfig(comanda.estado);

  // Badge para comandas disponibles
  const DisponibleBadge = () => (
    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 ">
      Disponible
    </div>
  );

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/90">
      {/* Borde de estado */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${estadoConfig.color} rounded-t-2xl`}></div>
      
      {/* Badge de disponibilidad para repartidores */}
      {esRepartidor && comanda.disponible && <DisponibleBadge />}
      
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* ID Badge */}
            <div className="relative">
              <div className={`w-14 h-14 ${estadoConfig.color} rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/50`}>
                <span className="text-lg font-bold text-white">#{comanda.id}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className={`w-4 h-4 ${estadoConfig.color} rounded-full flex items-center justify-center`}>
                  {estadoConfig.icon}
                </div>
              </div>
            </div>

            {/* Cliente Info */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {comanda.cliente_nombre}
              </h3>
              <div className="flex items-center text-sm text-slate-500 space-x-4">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1 text-slate-400" />
                  {formatDate(comanda.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Estado Badge */}
          <div className={`flex items-center space-x-2 px-4 py-2 ${estadoConfig.color} rounded-xl shadow-lg`}>
            {estadoConfig.icon}
            <span className="text-sm font-semibold text-white">
              {estadoConfig.label}
            </span>
          </div>
        </div>

        {/* Total prominente */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-slate-900">
            ${comanda.total.toFixed(2)}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 bg-slate-100/60 hover:bg-slate-200/60 rounded-lg transition-all duration-200"
          >
            <span>{expanded ? 'Menos detalles' : 'Ver detalles'}</span>
            <ChevronDownIcon className={`w-4 h-4 transform transition-transform duration-300 ${expanded ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>
      </div>

      {/* Información básica visible */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 gap-3">
          {comanda.cliente_telefono && (
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <PhoneIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">{comanda.cliente_telefono}</span>
            </div>
          )}
          
          <div className="flex items-start space-x-3 text-sm text-slate-600">
            <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mt-0.5">
              <MapPinIcon className="w-4 h-4 text-green-600" />
            </div>
            <span className="font-medium leading-relaxed">{comanda.cliente_direccion}</span>
          </div>

          {comanda.repartidor && (
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <UserIcon  className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium">Repartidor: {comanda.repartidor.nombre}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detalles expandibles */}
      <div className={`overflow-hidden transition-all duration-500 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Productos */}
        {comanda.productos && comanda.productos.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/50">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                <CubeIcon className="w-5 h-5 text-slate-700 mr-2" />
                Productos
              </h4>
              <div className="space-y-2">
                {comanda.productos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {item.cantidad}
                      </div>
                      <span className="font-medium text-slate-700">{item.producto.nombre}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      ${(item.precio_unitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comentario problema */}
      {comanda.comentario_problema && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Comentario:</p>
                <p className="text-sm text-amber-700 leading-relaxed">{comanda.comentario_problema}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campo de comentario para cancelación */}
      {showComentario && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200/60">
            <label className="block text-sm font-bold text-red-800 mb-3">
              Motivo de cancelación:
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full text-gray-700 px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white/80 backdrop-blur-sm resize-none"
              placeholder="Explica el motivo de la cancelación..."
            />
          </div>
        </div>
      )}

      {/* Acciones */}
      {acciones.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-3">
            {showComentario ? (
              <>
                <button
                  onClick={() => {
                    setShowComentario(false);
                    setComentario('');
                  }}
                  className="flex-1 min-w-0 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  <XCircleIcon className="w-4 h-4 text-slate-500" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={() => handleEstadoChange('cancelada')}
                  disabled={loading || !comentario.trim()}
                  className="flex-1 min-w-0 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <XCircleIcon className="w-4 h-4 text-white" />
                  <span>{loading ? 'Procesando...' : 'Confirmar'}</span>
                </button>
              </>
            ) : (
              acciones.map((accion) => (
                <button
                  key={accion.estado}
                  onClick={accion.action}
                  disabled={loading}
                  className={`flex-1 min-w-0 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold rounded-xl text-white ${accion.color} shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]`}
                >
                  {accion.icon}
                  <span>{loading ? 'Procesando...' : accion.texto}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}