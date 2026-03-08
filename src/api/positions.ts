import { http } from './client';
import type { PositionEmployee } from '../types/department';

export const positionApi = {
  // Lấy tất cả vị trí theo factory và department
  getAll: async (factoryId: number, departmentId?: number): Promise<PositionEmployee[]> => {
    let url = `/position?factoryId=${factoryId}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    const response = await http<any>(url);
    return response.data || [];
  },

  // Lấy vị trí theo ID
  getById: async (id: number): Promise<PositionEmployee> => {
    const response = await http<any>(`/position/${id}`);
    return response.data;
  },

  // Tạo vị trí mới
  create: async (data: {
    name: string;
    description: string;
    status?: string;
    factoryId: number;
    departmentId: number;
  }): Promise<PositionEmployee> => {
    const response = await http<any>(`/position`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Cập nhật vị trí
  update: async (id: number, data: {
    name?: string;
    description?: string;
    status?: string;
    departmentId?: number;
  }): Promise<PositionEmployee> => {
    const response = await http<any>(`/position/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Xóa vị trí (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/position/${id}`, {
      method: 'DELETE',
    });
  },
};
