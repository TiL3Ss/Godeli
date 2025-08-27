// comanda/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ArrowRightEndOnRectangleIcon,
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  DocumentTextIcon,
  PrinterIcon,
  ShareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CalendarIcon,
  IdentificationIcon,
  HomeIcon
} from '@heroicons/react/24/solid';

interface ComandaDetalle {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  total: number;
  estado: string;
  comentario_problema?: string;
  created_at: string;
  updated_at: string;
  tienda: {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
  };
  repartidor?: {
    id: number;
    nombre: string;
    username: string;
  };
  productos: Array<{
    id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto: {
      id: number;
      nombre: string;
      descripcion?: string;
    };
  }>;
}

export default function ComandaDetailPage() {
  const { data: session, status } = useSession();
  const [comanda, setComanda] = useState<ComandaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [printing, setPrinting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const comandaId = params.id;

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && comandaId) {
      loadComandaDetails();
    }
  }, [status, comandaId, router]);

  const loadComandaDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/comandas/${comandaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener la comanda');
      }

      if (data.success) {
        setComanda(data.data);
      } else {
        throw new Error(data.error || 'Error al obtener la comanda');
      }
    } catch (error) {
      console.error('Error loading comanda:', error);
      setError('Error al cargar los detalles de la comanda');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('selected_tienda_id');
      }
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/');
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Crear una nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintHTML());
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comanda #${comanda?.id} - ${comanda?.cliente_nombre}`,
          text: `Detalles de la comanda #${comanda?.id}`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      alert('Enlace copiado al portapapeles');
    });
  };

  const generatePrintHTML = () => {
    if (!comanda) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda #${comanda.id} - ${comanda.cliente_nombre}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .ticket { 
            max-width: 300px; 
            margin: 0 auto; 
            border: 1px dashed #000;
            padding: 20px;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .separator { border-top: 1px dashed #000; margin: 15px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .products { margin: 15px 0; }
          .product-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>${comanda.tienda.nombre}</h1>
            ${comanda.tienda.direccion ? `<p>${comanda.tienda.direccion}</p>` : ''}
            ${comanda.tienda.telefono ? `<p>Tel: ${comanda.tienda.telefono}</p>` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="row">
            <span>Comanda #:</span>
            <span>${comanda.id}</span>
          </div>
          <div class="row">
            <span>Fecha:</span>
            <span>${formatDate(comanda.created_at)}</span>
          </div>
          <div class="row">
            <span>Cliente:</span>
            <span>${comanda.cliente_nombre}</span>
          </div>
          ${comanda.cliente_telefono ? `
          <div class="row">
            <span>Teléfono:</span>
            <span>${comanda.cliente_telefono}</span>
          </div>` : ''}
          <div class="row">
            <span>Dirección:</span>
            <span>${comanda.cliente_direccion}</span>
          </div>
          ${comanda.repartidor ? `
          <div class="row">
            <span>Repartidor:</span>
            <span>${comanda.repartidor.nombre}</span>
          </div>` : ''}
          
          <div class="separator"></div>
          
          <div class="products">
            <div style="text-align: center; margin-bottom: 10px;"><strong>PRODUCTOS</strong></div>
            ${comanda.productos.map(item => `
              <div class="product-row">
                <span>${item.cantidad}x ${item.producto.nombre}</span>
                <span>$${item.subtotal.toFixed(2)}</span>
              </div>
              ${item.precio_unitario !== (item.subtotal / item.cantidad) ? `
                <div style="font-size: 10px; margin-left: 10px; color: #666;">
                  ($${item.precio_unitario.toFixed(2)} c/u)
                </div>
              ` : ''}
            `).join('')}
          </div>
          
          <div class="separator"></div>
          
          <div class="row total">
            <span>TOTAL:</span>
            <span>$${comanda.total.toFixed(2)}</span>
          </div>
          
          <div class="separator"></div>
          
          <div class="footer">
            <p>Estado: ${getEstadoText(comanda.estado)}</p>
            <p>¡Gracias por su compra!</p>
            <p>${new Date().toLocaleString('es-CL')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'en_proceso':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'completada':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'cancelada':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-lg font-medium text-slate-700">Cargando comanda</p>
            <p className="text-sm text-slate-500">Obteniendo detalles...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-300"
              >
                Volver
              </button>
              <button
                onClick={loadComandaDetails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No comanda found
  if (!comanda) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Comanda no encontrada</h2>
            <p className="text-slate-600 mb-6">La comanda solicitada no existe o no tienes permisos para verla.</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-700">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Botón volver y usuario */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-blue-50/80 hover:text-blue-700 border border-white/30 hover:border-blue-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user.name || user.username}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.tipo}</p>
                </div>
              </div>
            </div>

            {/* Título centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <EyeIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
                Comanda #{comanda.id}
              </h1>
            </div>

            {/* Botón logout */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/60 hover:bg-red-50/80 hover:text-red-700 border border-white/30 hover:border-red-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ArrowRightEndOnRectangleIcon className="w-4 h-4 group-hover:animate-pulse" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getEstadoIcon(comanda.estado)}
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(comanda.estado)}`}>
              {getEstadoText(comanda.estado)}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 text-slate-700 bg-white/60 hover:bg-slate-50/80 border border-white/30 hover:border-slate-200/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
            >
              <ShareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center space-x-2 px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>{printing ? 'Imprimiendo...' : 'Imprimir'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 text-center">
                <div className="mb-3">
                  <h2 className="text-2xl font-bold">{comanda.tienda.nombre}</h2>
                  {comanda.tienda.direccion && (
                    <p className="text-slate-300 text-sm">{comanda.tienda.direccion}</p>
                  )}
                  {comanda.tienda.telefono && (
                    <p className="text-slate-300 text-sm">Tel: {comanda.tienda.telefono}</p>
                  )}
                </div>
                <div className="border-t border-slate-600 pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>COMANDA</span>
                    <span className="font-mono text-xl">#{comanda.id}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6 font-mono text-sm">
                {/* Información básica */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fecha:</span>
                    <span className="font-medium">{formatDate(comanda.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-medium">{comanda.cliente_nombre}</span>
                  </div>
                  {comanda.cliente_telefono && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Teléfono:</span>
                      <span className="font-medium">{comanda.cliente_telefono}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dirección:</span>
                    <span className="font-medium text-right ml-4">{comanda.cliente_direccion}</span>
                  </div>
                  {comanda.repartidor && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Repartidor:</span>
                      <span className="font-medium">{comanda.repartidor.nombre}</span>
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div className="border-t border-dashed border-slate-300 my-6"></div>

                {/* Productos */}
                <div className="mb-6">
                  <h3 className="font-bold text-center mb-4 text-slate-900">PRODUCTOS</h3>
                  <div className="space-y-3">
                    {comanda.productos.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium">{item.cantidad}x {item.producto.nombre}</span>
                          </div>
                          <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-xs ml-4">
                          <span>${item.precio_unitario.toFixed(2)} c/u</span>
                        </div>
                        {item.producto.descripcion && (
                          <div className="text-slate-500 text-xs ml-4 italic">
                            {item.producto.descripcion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-dashed border-slate-300 my-6"></div>

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>${comanda.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-dashed border-slate-300 my-6"></div>

                {/* Footer */}
                <div className="text-center space-y-2 text-slate-600">
                  <p>Estado: <span className="font-semibold">{getEstadoText(comanda.estado)}</span></p>
                  <p className="text-xs">¡Gracias por su compra!</p>
                  <p className="text-xs">{new Date().toLocaleString('es-CL')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel lateral de información */}
          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <IdentificationIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Cliente</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                  <UserIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">{comanda.cliente_nombre}</p>
                    <p className="text-xs text-slate-500">Nombre completo</p>
                  </div>
                </div>
                
                {comanda.cliente_telefono && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                    <PhoneIcon className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">{comanda.cliente_telefono}</p>
                      <p className="text-xs text-slate-500">Teléfono de contacto</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                  <HomeIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">{comanda.cliente_direccion}</p>
                    <p className="text-xs text-slate-500">Dirección de entrega</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de entrega */}
            {comanda.repartidor && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <TruckIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Entrega</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">{comanda.repartidor.nombre}</p>
                      <p className="text-xs text-slate-500">Repartidor asignado</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                    <IdentificationIcon className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">@{comanda.repartidor.username}</p>
                      <p className="text-xs text-slate-500">Usuario del sistema</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información temporal */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Fechas</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">{formatDate(comanda.created_at)}</p>
                    <p className="text-xs text-slate-500">Fecha de creación</p>
                  </div>
                </div>
                
                {comanda.updated_at !== comanda.created_at && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">{formatDate(comanda.updated_at)}</p>
                      <p className="text-xs text-slate-500">Última actualización</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ShoppingBagIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-700">Productos</span>
                  </div>
                  <span className="font-bold text-slate-900">{comanda.productos.length}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-50/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-700">Total items</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {comanda.productos.reduce((sum, item) => sum + item.cantidad, 0)}
                  </span>
                </div>
                
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Total</span>
                    </div>
                    <span className="text-xl font-bold text-green-900">${comanda.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comentarios/Problemas */}
            {comanda.comentario_problema && (
              <div className="bg-red-50/70 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200/60 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900">Comentarios</h3>
                </div>
                
                <div className="bg-white/50 rounded-lg p-4 border border-red-200/50">
                  <p className="text-red-800">{comanda.comentario_problema}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}