export interface ApiResponseError extends Error {
  status?: number;
  data?: unknown;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Global logout function - sẽ được set từ App component
let globalLogout: (() => void) | null = null;

export function setGlobalLogout(logoutFn: () => void) {
  globalLogout = logoutFn;
}

/**
 * Check if token exists (validity check is handled by useTokenExpiration hook)
 */
function hasAuthToken(): boolean {
  const token = localStorage.getItem('auth_token');
  return !!token;
}

export interface HttpOptions extends RequestInit {
  skipAutoLogout?: boolean; // Skip auto-logout on 401 errors (for refresh token requests)
}

export async function http<T>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  // Only check token existence for authenticated requests (not auth endpoints)
  // Token expiration is handled by useTokenExpiration hook with auto-refresh
  const isAuthRequest = path.startsWith('/auth/');
  if (!isAuthRequest && !hasAuthToken()) {
    const err: ApiResponseError = new Error('Vui lòng đăng nhập để tiếp tục.');
    err.status = 401;
    throw err;
  }

  const { skipAutoLogout, ...fetchOptions } = options;

  const url = `${BASE_URL}${path}`;
  const headers = new Headers(fetchOptions.headers);
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }
  
  // Thêm Authorization header nếu có token
  const token = localStorage.getItem('auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...fetchOptions, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    // Xử lý 401 Unauthorized - tự động logout (except for refresh token requests)
    if (response.status === 401 && !skipAutoLogout) {
      // Clear token từ localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');

      // Gọi global logout function nếu có
      if (globalLogout) {
        globalLogout();
      }

      // Redirect về login page bằng cách reload trang để đảm bảo state được reset
      window.location.href = '/login';

      const err: ApiResponseError = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      err.status = response.status;
      err.data = payload;
      throw err;
    }

    const err: ApiResponseError = new Error(
      (payload && (payload.message || payload.error)) || 
      (payload?.errors && (payload.errors.message || payload.errors.info)) ||
      'Có lỗi xảy ra'
    );
    err.status = response.status;
    err.data = payload;
    throw err;
  }

  return payload as T;
}


