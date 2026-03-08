import { useEffect, useRef } from 'react';
import { isTokenExpiringSoon, getTimeUntilExpiration, hasRefreshToken, getRefreshToken, isRefreshTokenExpired } from '../lib/tokenUtils';

interface UseTokenExpirationOptions {
  onTokenExpired: () => void;
  onTokenExpiringSoon?: () => void;
  onTokenRefresh?: (refreshToken: string) => Promise<boolean>; // Return true if refresh successful
  checkInterval?: number; // milliseconds
  warningThreshold?: number; // minutes before expiration
  autoRefresh?: boolean; // Enable automatic token refresh
}

export function useTokenExpiration({
  onTokenExpired,
  onTokenExpiringSoon,
  onTokenRefresh,
  checkInterval = 30000, // Check every 30 seconds
  warningThreshold = 5, // Warn 5 minutes before expiration
  autoRefresh = true // Enable auto-refresh by default
}: UseTokenExpirationOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        onTokenExpired();
        return;
      }

      // Check if token is expired
      const timeUntilExpiration = getTimeUntilExpiration(token);
      
      if (timeUntilExpiration <= 0) {
        // Token expired - try to refresh if available
        const canRefresh = autoRefresh && hasRefreshToken() && !isRefreshTokenExpired() && onTokenRefresh && !isRefreshingRef.current;

        if (canRefresh) {
          isRefreshingRef.current = true;
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            try {
              const success = await onTokenRefresh(refreshToken);
              if (success) {
                isRefreshingRef.current = false;
                return; // Don't call onTokenExpired
              }
            } catch (error) {
              console.error('Failed to refresh token:', error);
            }
          }
          isRefreshingRef.current = false;
        }

        // If refresh failed or not available, logout
        onTokenExpired();
        return;
      }

      // Check if token is expiring soon
      if (isTokenExpiringSoon(token, warningThreshold)) {
        // Try to auto-refresh before showing warning
        const canRefresh = autoRefresh && hasRefreshToken() && !isRefreshTokenExpired() && onTokenRefresh && !isRefreshingRef.current;
        
        if (canRefresh) {
          isRefreshingRef.current = true;
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            try {
              const success = await onTokenRefresh(refreshToken);
              if (success) {
                isRefreshingRef.current = false;
                return; // Don't show warning
              }
            } catch (error) {
              console.error('Failed to refresh token proactively:', error);
            }
          }
          isRefreshingRef.current = false;
        }

        // If refresh failed or not enabled, show warning
        onTokenExpiringSoon?.();
      }
    };

    // Check immediately
    checkToken();

    // Set up interval
    intervalRef.current = setInterval(checkToken, checkInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTokenExpired, onTokenExpiringSoon, onTokenRefresh, checkInterval, warningThreshold, autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
