import { http } from './client';
import type { Department } from '../types/department';

export const departmentApi = {
  // Lấy tất cả phòng ban theo factory
  getAll: async (factoryId: number): Promise<Department[]> => {
    const response = await http<any>(`/departments?factoryId=${factoryId}`);
    return response.data || [];
  },

  // Alias for getAll - for consistency with other APIs
  getByFactory: async (factoryId: number): Promise<Department[]> => {
    return departmentApi.getAll(factoryId);
  },

  // Lấy phòng ban theo ID
  getById: async (id: number): Promise<Department> => {
    const response = await http<any>(`/departments/${id}`);
    return response.data;
  },

  // Tạo phòng ban mới
  create: async (data: {
    name: string;
    description?: string;
    status?: string;
    factoryId: number;
  }): Promise<Department> => {
    const response = await http<any>(`/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Cập nhật phòng ban
  update: async (id: number, data: {
    name?: string;
    description?: string;
    status?: string;
  }): Promise<Department> => {
    const response = await http<any>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Xóa phòng ban (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};
