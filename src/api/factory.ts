import { http } from './client';

type BaseResponse<T> = {
  message?: string | Record<string, string>;
  data?: T;
};

export interface BranchLocation {
  name?: string;
  latitude: number;
  longitude: number;
}

export interface Factory {
  id: number;
  name: string;
  phone: string;
  address: string;
  location: { latitude: number; longitude: number } | null;
  hourStartWork: string; // HH:mm:ss
  hourEndWork: string; // HH:mm:ss
  maxEmployees: number;
  workDays: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  radiusMeters: number;
  branchLocations?: BranchLocation[];
  isGTG: boolean;
}

export interface UpdateFactoryDto {
  name?: string;
  phone?: string;
  address?: string;
  location?: { latitude: number; longitude: number };
  hourStartWork?: string; // HH:mm:ss
  hourEndWork?: string; // HH:mm:ss
  maxEmployees?: number;
  workDays?: number[];
  radiusMeters?: number;
  branchLocations?: BranchLocation[];
}

export interface UpdateWorkScheduleDto {
  workDays?: number[];
  hourStartWork?: string; // HH:mm:ss
  hourEndWork?: string; // HH:mm:ss
}

export const factoryApi = {
  // Update factory
  update: async (id: number, payload: UpdateFactoryDto): Promise<Factory> => {
    const res = await http<BaseResponse<Factory>>(`/factory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res?.data as Factory;
  },

  // Update work schedule (work days and hours)
  updateWorkSchedule: async (id: number, payload: UpdateWorkScheduleDto): Promise<Factory> => {
    const res = await http<BaseResponse<Factory>>(`/factory/${id}/work-schedule`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res?.data as Factory;
  },

  // Get factory by ID
  getById: async (id: number): Promise<Factory> => {
    const res = await http<BaseResponse<Factory>>(`/factory/${id}`, {
      method: 'GET',
    });
    return res?.data as Factory;
  },
};
