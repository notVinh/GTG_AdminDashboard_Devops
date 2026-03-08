import { http } from './client';
import type {
  Overtime,
  CreateOvertimeDto,
  UpdateOvertimeDto
} from '../types';

export const overtimeApi = {
  // Get all overtime by employee
  getByEmployee: async (employeeId: number): Promise<Overtime[]> => {
    const res = await http<any>(`/overtime/employee/${employeeId}`, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as Overtime[];
    if (Array.isArray(res)) return res as Overtime[];
    return [];
  },

  // Get all overtime by factory with pagination
  getByFactory: async (factoryId: number, params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string; search?: string }): Promise<{ data: Overtime[], meta: { total: number, page: number, limit: number } }> => {
    const queryParams = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const res = await http<any>(`/overtime/factory/${factoryId}?${queryParams.toString()}`, {
      method: 'GET',
    });

    // Handle paginated response structure
    if (res?.data?.data && res?.data?.meta) {
      return {
        data: res.data.data as Overtime[],
        meta: res.data.meta
      };
    }
    if (res && Array.isArray(res.data)) {
      return {
        data: res.data as Overtime[],
        meta: { total: res.data.length, page: 1, limit: 20 }
      };
    }
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20 }
    };
  },

  // Create new overtime
  create: async (payload: CreateOvertimeDto): Promise<Overtime> => {
    const res = await http<any>(`/overtime`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as Overtime;
  },

  // Update overtime (approve/reject/update)
  update: async (
    id: number,
    payload: UpdateOvertimeDto
  ): Promise<Overtime> => {
    const res = await http<any>(`/overtime/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as Overtime;
  },

  // Get single overtime by ID
  getById: async (id: number): Promise<Overtime> => {
    const res = await http<any>(`/overtime/detail/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as Overtime;
  },

  // Create supplement overtime (bổ sung giờ cho đơn đã được duyệt)
  createSupplement: async (
    parentOvertimeId: number,
    payload: CreateOvertimeDto
  ): Promise<Overtime> => {
    const res = await http<any>(`/overtime/${parentOvertimeId}/supplement`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as Overtime;
  },
};
