// app/select-tienda/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, clearAuthUser } from '../../lib/auth';
import { getTiendasRepartidor } from '../../lib/db';
import { AuthUser, Tienda } from '../../types';

export default function SelectTiendaPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) {
      router.push('/login');
      return;
    }

    setUser(authUser);
    
    if (authUser.tipo === 'tienda' && authUser.tienda) {
      // Para tiendas, seleccionar automáticamente su tienda
      setSelectedTienda(authUser.tienda.id);
      setLoading(false);
    } else if (authUser.tipo === 'repartidor') {
      // Para repartidores, cargar las tiendas disponibles
      loadTiendas(authUser.id);
    }
  }, [router]);

  const loadTiendas = async (repartidorId: number) => {
    try {
      const tiendasData = await getTiendasRepartidor(repartidorId);
      setTiendas(tiendasData);
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTiendaSelect = (tiendaId: number) => {
    setSelectedTienda(tiendaId);
  };

  const handleContinue = () => {
    if (selectedTienda) {
      localStorage.setItem('selected_tienda_id', selectedTienda.toString());
      router.push('/comandas');
    }
  };

  const handleLogout = () => {
    clearAuthUser();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bienvenido, {user.nombre}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {user.tipo === 'tienda' ? 'Administrar tu tienda' : 'Selecciona una tienda para trabajar'}
                </p>
              </div>
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

            {user.tipo === 'tienda' && user.tienda ? (
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{user.tienda.nombre}</h3>
                      {user.tienda.direccion && (
                        <p className="mt-1 text-sm text-gray-600">{user.tienda.direccion}</p>
                      )}
                      {user.tienda.telefono && (
                        <p className="mt-1 text-sm text-gray-600">Tel: {user.tienda.telefono}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Selecciona una tienda</h2>
                
                {tiendas.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes tiendas asignadas</h3>
                    <p className="mt-1 text-sm text-gray-500">Contacta al administrador para que te asigne tiendas.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tiendas.map((tienda) => (
                      <div
                        key={tienda.id}
                        onClick={() => handleTiendaSelect(tienda.id)}
                        className={`relative rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                          selectedTienda === tienda.id
                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{tienda.nombre}</h3>
                            {tienda.direccion && (
                              <p className="mt-1 text-xs text-gray-500">{tienda.direccion}</p>
                            )}
                          </div>
                          {selectedTienda === tienda.id && (
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleContinue}
                disabled={!selectedTienda}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
                <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}