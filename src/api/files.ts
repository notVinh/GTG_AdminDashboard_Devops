import { http } from './client';
import type { UploadResult } from '../types';

type BaseResponse<T> = {
  message?: string | Record<string, string>;
  data?: T;
};

export const filesApi = {
  upload: async (file: File): Promise<UploadResult | null> => {
    const token = localStorage.getItem('auth_token');
    const form = new FormData();
    form.append('file', file, file.name);
    const res = await http<BaseResponse<UploadResult>>(`/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    return res?.data ?? null;
  },
  uploadMultiple: async (files: File[]): Promise<UploadResult[]> => {
    if (!files || files.length === 0) {
      return [];
    }
    const token = localStorage.getItem('auth_token');
    const form = new FormData();
    files.forEach((file) => {
      form.append('files', file, file.name);
    });
    const res = await http<BaseResponse<UploadResult[]>>(`/files/upload-multiple`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    return res?.data ?? [];
  },
};


