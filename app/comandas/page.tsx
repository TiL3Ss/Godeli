// app/comandas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'next-auth/react';
import ComandaCard from '../components/ComandaCard';
import AgregarComandaModal from '../components/AgregarComandaModal';
import ProtectedRoute from '../components/ProtectedRoute';

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

export default function ComandasPage() {
  const { userProfile, isAuthenticated, isLoading } = useAuth();
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      // Para tiendas, usar su tienda_id. Para repartidores, obtener de localStorage o redirigir
      if (userProfile.role === 'tienda' && userProfile.tienda_id) {
        setTiendaId(userProfile.tienda_id);
        loadComandas(userProfile.tienda_id, false);
      } else {
        const selectedTiendaId = localStorage.getItem('selected_tienda_id');
        if (selectedTiendaId) {
          setTiendaId(Number(selectedTiendaId));
          loadComandas(Number(selectedTiendaId), userProfile.role === 'repartidor');
        } else {
          router.push('/select-tienda');
        }
      }
    }
  }, [userProfile, isAuthenticated, router]);

  const loadComandas = async (tiendaId: number, esRepartidor: boolean) => {
    try {
      const params = new URLSearchParams({
        tienda_id: tiendaId.toString(),
        activas: 'true',
        repartidor: esRepartidor.toString()
      });

      const response = await fetch(`/api/comandas?${params}`);
      if (response.ok) {
        const comandasData = await response.json();
        setComandas(comandasData);
      } else {
        console.error('Error al cargar comandas:', response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (comandaId: number, estado: string, comentario?: string) => {
    try {
      const response = await fetch(`/api/comandas/${comandaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado, comentario }),
      });

      if (response.ok && tiendaId) {
        loadComandas(tiendaId, userProfile?.role === 'repartidor');
      } else {
        console.error('Error al actualizar estado:', response.statusText);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('selected_tienda_id');
    await signOut({ callbackUrl: '/' });
  };

  const handleComandaCreated = () => {
    setShowModal(false);
    if (tiendaId) {
      loadComandas(tiendaId, userProfile?.role === 'repartidor');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">Comandas Activas</h1>
                <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {userProfile?.role === 'tienda' ? 'Tienda' : 'Repartidor'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/historial')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Historial
                </button>
                {userProfile?.role === 'tienda' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Comanda
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {loading || isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : comandas.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay comandas activas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userProfile?.role === 'tienda' ? 'Comienza creando una nueva comanda.' : 'No hay comandas pendientes para entregar.'}
                </p>
                {userProfile?.role === 'tienda' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar Primera Comanda
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {comandas.map((comanda) => (
                  <ComandaCard
                    key={comanda.id}
                    comanda={comanda}
                    esRepartidor={userProfile?.role === 'repartidor'}
                    onEstadoChange={handleEstadoChange}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Modal para agregar comanda */}
        {showModal && userProfile?.role === 'tienda' && tiendaId && (
          <AgregarComandaModal
            tiendaId={tiendaId}
            onClose={() => setShowModal(false)}
            onComandaCreated={handleComandaCreated}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}