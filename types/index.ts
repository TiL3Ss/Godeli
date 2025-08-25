// types/index.ts

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'tienda' | 'repartidor' | 'admin';
  nombre?: string;
  telefono?: string;
  tienda_id?: number;
  tienda?: {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
  };
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo?: boolean;
  tienda_id?: number;
  created_at?: string;
}

export interface ProductoComanda {
  id: number;
  cantidad: number;
  precio_unitario: number;
  producto: Producto;
}

export interface Comanda {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  total: number;
  estado: 'activa' | 'en_proceso' | 'completada' | 'cancelada';
  comentario_problema?: string;
  created_at: string;
  updated_at: string;
  tienda_id: number;
  repartidor_id?: number;
  repartidor?: {
    id: number;
    nombre: string;
    telefono: string;
  };
  productos?: ProductoComanda[];
}

export interface ComandaFormData {
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  productos: Array<{
    producto_id: number;
    cantidad: number;
  }>;
}

export interface FiltrosHistorial {
  estado?: string;
  fecha?: string;
  productos?: number[];
}

export interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  activa?: boolean;
  created_at?: string;
}

export interface Repartidor {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  activo?: boolean;
}

// Tipos para las respuestas de las APIs
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

// Estados posibles de las comandas
export const ESTADOS_COMANDA = {
  ACTIVA: 'activa',
  EN_PROCESO: 'en_proceso', 
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
} as const;

export type EstadoComanda = typeof ESTADOS_COMANDA[keyof typeof ESTADOS_COMANDA];

// Roles de usuario
export const ROLES_USUARIO = {
  TIENDA: 'tienda',
  REPARTIDOR: 'repartidor',
  ADMIN: 'admin'
} as const;

export type RolUsuario = typeof ROLES_USUARIO[keyof typeof ROLES_USUARIO];