// lib/auth.ts
import { AuthUser } from '../types';

const AUTH_KEY = 'pedidos_auth_user';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function requireAuth(): AuthUser {
  const user = getAuthUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return user;
}