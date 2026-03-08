import { http } from './client';
import type { FactoryMeta, FactoryItem } from '../types';

export interface UpdateWorkDaysRequest {
  workDays: number[];
}

export const factoriesApi = {
  list: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: FactoryItem[]; meta: FactoryMeta }> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const res = await http<any>(`/factory?page=${page}&limit=${limit}${searchParam}`, { 
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });

    // Handle formats:
    // 1) BaseResponse<{ data: FactoryItem[]; meta: FactoryMeta }>
    if (res && res.data && Array.isArray(res.data.data)) {
      return { data: res.data.data as FactoryItem[], meta: res.data.meta as FactoryMeta };
    }
    // 2) { data: FactoryItem[], meta }
    if (res && Array.isArray(res.data) && res.meta) {
      return { data: res.data as FactoryItem[], meta: res.meta as FactoryMeta };
    }
    // 3) Flat array with no meta
    if (Array.isArray(res)) {
      return { data: res as FactoryItem[], meta: { page, limit, total: (res as any[]).length } };
    }

    return { data: [], meta: { page, limit, total: 0 } };
  },

  create: async (factoryData: any): Promise<any> => {
    const res = await http<any>('/factory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    });
    return res?.data ?? null;
  },

  update: async (factoryId: number, factoryData: any): Promise<any> => {
    const res = await http<any>(`/factory/${factoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    });
    return res?.data ?? null;
  },

  // Get factory by ID
  getFactory: async (id: number): Promise<FactoryItem> => {
    const response = await http<any>(`/factory/${id}`);
    return response?.data ?? response;
  },

  // Update work days for a factory
  updateWorkDays: async (id: number, workDays: number[]): Promise<FactoryItem> => {
    const response = await http<any>(`/factory/${id}/work-days`, {
      method: 'PATCH',
      body: JSON.stringify({ workDays }),
    });
    return response?.data ?? response;
  },
};


