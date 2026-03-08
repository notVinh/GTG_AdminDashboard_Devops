// Authentication-related interfaces

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  tokenExpires: number;
  refreshTokenExpires: number;
  user: unknown;
}

export interface TokenPayload {
  exp: number;
  iat: number;
  [key: string]: any;
}
