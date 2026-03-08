import { http } from './client';
import type { LoginPayload, LoginResponse } from '../types';

type BaseResponse<T> = {
  statusCode: number;
  message?: string | Record<string, string>;
  data?: T;
};

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await http<BaseResponse<LoginResponse>>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // unwrap backend base response
    return (res?.data ?? (res as unknown)) as LoginResponse;
  },

  forgotPassword: async (phone: string, channel: 'email' | 'zalo' | 'sms' = 'sms') => {
    const res = await http<BaseResponse<{ success: boolean, email?: string }>>(`/auth/forgot/password`, {
      method: 'POST',
      body: JSON.stringify({ phone, channel }),
    });
    return res;
  },

  verifyOtp: async (phone: string, otp: string) => {
    const res = await http<BaseResponse<{ resetToken: string }>>(`/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    return res;
  },

  resetPassword: async (resetToken: string, newPassword: string, confirmPassword: string) => {
    const res = await http<BaseResponse<{ success: boolean }>>(`/auth/reset/password`, {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
    });
    return res;
  },

  // DEPRECATED: API cũ - không dùng nữa
  /* resetPasswordOld: async (phone: string, otp: string, channel: 'email' | 'zalo' | 'sms' = 'sms') => {
    const res = await http<BaseResponse<{ success: boolean }>>(`/auth/reset/password-old`, {
      method: 'POST',
      body: JSON.stringify({ phone, otp, channel }),
    });
    return res;
  }, */

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const res = await http<BaseResponse<{ success: boolean }>>(`/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    return res;
  },

  refreshToken: async (refreshToken: string) => {
    // Backend expects refresh token in Authorization header via jwt-refresh guard
    // Guard will verify token and extract sessionId automatically
    const res = await http<BaseResponse<Omit<LoginResponse, 'user'>>>(`/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
      skipAutoLogout: true, // Don't auto-logout if refresh fails
    });
    // unwrap backend base response
    // Note: Response doesn't include user object, only tokens
    return (res?.data ?? (res as unknown)) as Omit<LoginResponse, 'user'>;
  },
};


