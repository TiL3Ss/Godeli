// hooks/useAuth.ts
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getTursoClient } from '../../lib/turso';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role?: 'tienda' | 'repartidor' | 'admin';
  tienda_id?: number;
  nombre?: string;
  telefono?: string;
  tienda?: {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
  };
}

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para obtener el perfil completo del usuario desde la base de datos
  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [session, status]);

  // Función para verificar roles
  const hasRole = (role: string): boolean => {
    return userProfile?.role === role;
  };

  // Función para verificar si es admin
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // Función para verificar si es tienda
  const isTienda = (): boolean => {
    return hasRole('tienda');
  };

  // Función para verificar si es repartidor
  const isRepartidor = (): boolean => {
    return hasRole('repartidor');
  };

  return {
    // Datos de sesión básicos de NextAuth
    session,
    status,
    update,
    
    // Perfil completo del usuario
    userProfile,
    loading,
    
    // Funciones de utilidad
    hasRole,
    isAdmin,
    isTienda,
    isRepartidor,
    refreshProfile: fetchUserProfile,
    
    // Estados calculados
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || loading,
  };
};