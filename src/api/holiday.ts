import { http } from './client';

export interface Holiday {
  id: number;
  factoryId: number;
  name: string;
  date: string;
  year: number;
  description?: string;
  isActive: boolean;
  overtimeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  factoryId: number;
  name: string;
  date: string;
  year: number;
  description?: string;
  isActive?: boolean;
  overtimeRate?: number;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string;
  year?: number;
  description?: string;
  isActive?: boolean;
  overtimeRate?: number;
}

export const holidayApi = {
  // Get all holidays
  getAll: async (factoryId?: number, year?: number): Promise<Holiday[]> => {
    const params = new URLSearchParams();
    if (factoryId) params.append('factoryId', String(factoryId));
    if (year) params.append('year', String(year));

    const res = await http<any>(`/holiday?${params.toString()}`, {
      method: 'GET',
    });

    return res?.data || [];
  },

  // Get holiday by id
  getById: async (id: number): Promise<Holiday> => {
    const res = await http<any>(`/holiday/${id}`, {
      method: 'GET',
    });

    return res?.data;
  },

  // Create holiday
  create: async (data: CreateHolidayDto): Promise<Holiday> => {
    const res = await http<any>('/holiday', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return res?.data;
  },

  // Update holiday
  update: async (id: number, data: UpdateHolidayDto): Promise<Holiday> => {
    const res = await http<any>(`/holiday/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    return res?.data;
  },

  // Delete holiday
  delete: async (id: number): Promise<void> => {
    await http<any>(`/holiday/${id}`, {
      method: 'DELETE',
    });
  },
};
