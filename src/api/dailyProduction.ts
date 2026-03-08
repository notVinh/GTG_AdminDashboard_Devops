import { http } from './client';
import type { EmployeeWithDetails } from '../types';

export interface DailyProductionItem {
  id: number;
  factoryId: number;
  employeeId: number;
  employee?: EmployeeWithDetails;
  date: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyProductionPayload {
  factoryId: number;
  employeeId: number;
  date: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
}

export interface UpdateDailyProductionPayload {
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
}

export interface EmployeeProductionSummary {
  employeeId: number;
  id: number;
  fullName: string;
  salaryType: 'daily' | 'production';
  totalRecords: number;
  totalQuantity: number;
  totalValue: number;
}

export const dailyProductionApi = {
  listByFactory: async (factoryId: number): Promise<DailyProductionItem[]> => {
    const res = await http<any>(`/daily-production/factory/${factoryId}`, { method: 'GET' });
    return (res?.data ?? res) as DailyProductionItem[];
  },

  listByEmployee: async (employeeId: number): Promise<DailyProductionItem[]> => {
    const res = await http<any>(`/daily-production/employee/${employeeId}`, { method: 'GET' });
    return (res?.data ?? res) as DailyProductionItem[];
  },

  getEmployeesWithProduction: async (factoryId: number): Promise<EmployeeProductionSummary[]> => {
    const res = await http<any>(`/daily-production/factory/${factoryId}/employees`, { method: 'GET' });
    return (res?.data ?? res) as EmployeeProductionSummary[];
  },

  create: async (payload: CreateDailyProductionPayload): Promise<DailyProductionItem> => {
    const res = await http<any>(`/daily-production`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as DailyProductionItem;
  },

  update: async (id: number, payload: UpdateDailyProductionPayload): Promise<DailyProductionItem> => {
    const res = await http<any>(`/daily-production/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as DailyProductionItem;
  },

  delete: async (id: number): Promise<void> => {
    await http<any>(`/daily-production/${id}`, {
      method: 'DELETE',
    });
  },
};
