import { http } from './client';
import type {
  BulkOvertimeRequest,
  CreateBulkOvertimeRequestDto,
  UpdateBulkOvertimeRequestDto,
  ConfirmBulkOvertimeRequestDto
} from '../types/bulk-overtime-request';

export const bulkOvertimeRequestApi = {
  // Get all bulk overtime requests by factory
  getByFactory: async (factoryId: number): Promise<BulkOvertimeRequest[]> => {
    const res = await http<any>(`/bulk-overtime-request/factory/${factoryId}`, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as BulkOvertimeRequest[];
    if (Array.isArray(res)) return res as BulkOvertimeRequest[];
    return [];
  },

  // Get bulk overtime request by ID
  getById: async (id: number): Promise<BulkOvertimeRequest> => {
    const res = await http<any>(`/bulk-overtime-request/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as BulkOvertimeRequest;
  },

  // Create new bulk overtime request (draft)
  create: async (payload: CreateBulkOvertimeRequestDto): Promise<BulkOvertimeRequest> => {
    const res = await http<any>(`/bulk-overtime-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as BulkOvertimeRequest;
  },

  // Update bulk overtime request (only draft)
  update: async (
    id: number,
    payload: UpdateBulkOvertimeRequestDto
  ): Promise<BulkOvertimeRequest> => {
    const res = await http<any>(`/bulk-overtime-request/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as BulkOvertimeRequest;
  },

  // Confirm bulk overtime request and create overtime records
  confirm: async (id: number, autoApprove: boolean = false): Promise<BulkOvertimeRequest> => {
    const res = await http<any>(`/bulk-overtime-request/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ autoApprove }),
    });
    return (res?.data ?? res) as BulkOvertimeRequest;
  },

  // Cancel bulk overtime request (only draft)
  cancel: async (id: number): Promise<BulkOvertimeRequest> => {
    const res = await http<any>(`/bulk-overtime-request/${id}/cancel`, {
      method: 'POST',
    });
    return (res?.data ?? res) as BulkOvertimeRequest;
  },

  // Delete bulk overtime request (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/bulk-overtime-request/${id}`, {
      method: 'DELETE',
    });
  },
};
