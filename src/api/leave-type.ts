import { http } from './client';
import type {
  LeaveTypeConfig,
  CreateLeaveTypeConfigDto,
  UpdateLeaveTypeConfigDto,
  QueryLeaveTypeConfigDto,
} from '../types';

export const leaveTypeApi = {
  // Get all leave types with optional filters
  getAll: async (query?: QueryLeaveTypeConfigDto): Promise<LeaveTypeConfig[]> => {
    const params = new URLSearchParams();
    if (query?.factoryId) params.append('factoryId', query.factoryId.toString());
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query?.isPaid !== undefined) params.append('isPaid', query.isPaid.toString());

    const queryString = params.toString();
    const url = queryString ? `/leave-type?${queryString}` : '/leave-type';

    const res = await http<any>(url, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as LeaveTypeConfig[];
    if (Array.isArray(res)) return res as LeaveTypeConfig[];
    return [];
  },

  // Get leave types by factory
  getByFactory: async (factoryId: number): Promise<LeaveTypeConfig[]> => {
    const res = await http<any>(`/leave-type/factory/${factoryId}`, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as LeaveTypeConfig[];
    if (Array.isArray(res)) return res as LeaveTypeConfig[];
    return [];
  },

  // Get single leave type by ID
  getById: async (id: number): Promise<LeaveTypeConfig> => {
    const res = await http<any>(`/leave-type/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as LeaveTypeConfig;
  },

  // Create new leave type
  create: async (payload: CreateLeaveTypeConfigDto): Promise<LeaveTypeConfig> => {
    const res = await http<any>(`/leave-type`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as LeaveTypeConfig;
  },

  // Update leave type
  update: async (
    id: number,
    payload: UpdateLeaveTypeConfigDto
  ): Promise<LeaveTypeConfig> => {
    const res = await http<any>(`/leave-type/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as LeaveTypeConfig;
  },

  // Delete leave type (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/leave-type/${id}`, {
      method: 'DELETE',
    });
  },
};
