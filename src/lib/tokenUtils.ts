// Utility functions for token management
import type { TokenPayload } from '../types';

/**
 * Decode JWT token without verification (for client-side use only)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string, minutesThreshold: number = 5): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const thresholdTime = currentTime + (minutesThreshold * 60);
  return payload.exp < thresholdTime;
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Get time until token expires in seconds
 */
export function getTimeUntilExpiration(token: string): number {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
}

/**
 * Check if refresh token is available in localStorage
 */
export function hasRefreshToken(): boolean {
  const refreshToken = localStorage.getItem('refresh_token');
  return !!refreshToken;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * Check if refresh token is expired
 */
export function isRefreshTokenExpired(): boolean {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return true;
  }
  return isTokenExpired(refreshToken);
}
