import { http } from './client';
import type { Team } from '../types/team';

export const teamApi = {
  // Lấy tất cả tổ theo factory
  getAll: async (factoryId: number): Promise<Team[]> => {
    const response = await http<any>(`/teams?factoryId=${factoryId}`);
    return response.data || [];
  },

  // Alias for getAll - for consistency with other APIs
  getByFactory: async (factoryId: number): Promise<Team[]> => {
    return teamApi.getAll(factoryId);
  },

  // Lấy tổ theo department
  getByDepartment: async (departmentId: number): Promise<Team[]> => {
    const response = await http<any>(`/teams/by-department/${departmentId}`);
    return response.data || [];
  },

  // Lấy tổ theo ID
  getById: async (id: number): Promise<Team> => {
    const response = await http<any>(`/teams/${id}`);
    return response.data;
  },

  // Tạo tổ mới
  create: async (data: {
    name: string;
    departmentId: number;
    factoryId: number;
    description?: string;
    status?: string;
  }): Promise<Team> => {
    const response = await http<any>(`/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Cập nhật tổ
  update: async (id: number, data: {
    name?: string;
    description?: string;
    status?: string;
  }): Promise<Team> => {
    const response = await http<any>(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Xóa tổ (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/teams/${id}`, {
      method: 'DELETE',
    });
  },
};
