import { http } from "./client";

export type MisaTokenStatus = {
  hasToken: boolean;
  isValid: boolean;
  isRefreshing: boolean;
  currentRecordId: number | null;
  expiresAt: string | null;
  expiresIn: number | null; // minutes remaining
  lastRefreshed: string | null;
};

export type MisaTokenRefreshResult = {
  success: boolean;
  message: string;
  recordId?: number;
};

export type MisaLogEntry = {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  recordId?: number;
};

export type MisaTokenRecord = {
  id: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  source: 'manual' | 'scheduled';
  logs: MisaLogEntry[];
  createdAt: string;
};

export type MisaTokenHistory = {
  data: MisaTokenRecord[];
  total: number;
};

export const misaTokenApi = {
  getStatus: async (): Promise<MisaTokenStatus> => {
    const response = await http<any>("/misa-token/status");
    return response.data;
  },

  getHistory: async (page = 1, limit = 20): Promise<MisaTokenHistory> => {
    const response = await http<any>(`/misa-token/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  getRecord: async (id: number): Promise<MisaTokenRecord> => {
    const response = await http<any>(`/misa-token/history/${id}`);
    return response.data;
  },

  refreshToken: async (): Promise<MisaTokenRefreshResult> => {
    const response = await http<any>("/misa-token/refresh", {
      method: "POST",
    });
    return response.data;
  },

  // SSE stream URL
  getLogsStreamUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('auth_token');
    return `${baseUrl}/misa-token/logs/stream?token=${token}`;
  },
};
