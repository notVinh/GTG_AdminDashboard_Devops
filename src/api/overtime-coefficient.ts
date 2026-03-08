import { http } from './client';
import type {
  OvertimeCoefficient,
  CreateOvertimeCoefficientDto,
  UpdateOvertimeCoefficientDto,
  QueryOvertimeCoefficientDto,
} from '../types';

export const overtimeCoefficientApi = {
  // Get all overtime coefficients with optional filters
  getAll: async (query?: QueryOvertimeCoefficientDto): Promise<OvertimeCoefficient[]> => {
    const params = new URLSearchParams();
    if (query?.factoryId) params.append('factoryId', query.factoryId.toString());
    if (query?.shiftType) params.append('shiftType', query.shiftType);
    if (query?.dayType) params.append('dayType', query.dayType);
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());

    const queryString = params.toString();
    const url = queryString ? `/overtime-coefficient?${queryString}` : '/overtime-coefficient';

    const res = await http<any>(url, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as OvertimeCoefficient[];
    if (Array.isArray(res)) return res as OvertimeCoefficient[];
    return [];
  },

  // Get overtime coefficients by factory
  getByFactory: async (factoryId: number): Promise<OvertimeCoefficient[]> => {
    const res = await http<any>(`/overtime-coefficient/factory/${factoryId}`, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as OvertimeCoefficient[];
    if (Array.isArray(res)) return res as OvertimeCoefficient[];
    return [];
  },

  // Get single overtime coefficient by ID
  getById: async (id: number): Promise<OvertimeCoefficient> => {
    const res = await http<any>(`/overtime-coefficient/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as OvertimeCoefficient;
  },

  // Create new overtime coefficient
  create: async (payload: CreateOvertimeCoefficientDto): Promise<OvertimeCoefficient> => {
    const res = await http<any>(`/overtime-coefficient`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as OvertimeCoefficient;
  },

  // Update overtime coefficient
  update: async (
    id: number,
    payload: UpdateOvertimeCoefficientDto
  ): Promise<OvertimeCoefficient> => {
    const res = await http<any>(`/overtime-coefficient/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as OvertimeCoefficient;
  },

  // Delete overtime coefficient (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/overtime-coefficient/${id}`, {
      method: 'DELETE',
    });
  },
};
