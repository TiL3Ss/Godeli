// types/index.ts
export interface Usuario {
  id: number;
  username: string;
  tipo: 'tienda' | 'repartidor';
  nombre: string;
  created_at: string;
}

export interface Tienda {
  id: number;
  usuario_id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  created_at: string;
}

export interface Producto {
  id: number;
  tienda_id: number;
  nombre: string;
  precio: number;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

export interface Comanda {
  id: number;
  tienda_id: number;
  repartidor_id?: number;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_direccion: string;
  estado: 'activa' | 'en_proceso' | 'completada' | 'cancelada';
  total: number;
  comentario_problema?: string;
  created_at: string;
  updated_at: string;
  tienda?: Tienda;
  repartidor?: Usuario;
  productos?: ComandaProducto[];
}

export interface ComandaProducto {
  id: number;
  comanda_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: Producto;
}

export interface RepartidorTienda {
  id: number;
  repartidor_id: number;
  tienda_id: number;
  tienda?: Tienda;
}

export interface AuthUser {
  id: number;
  username: string;
  tipo: 'tienda' | 'repartidor';
  nombre: string;
  tienda?: Tienda;
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