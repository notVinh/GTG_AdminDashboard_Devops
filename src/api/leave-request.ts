import { http } from './client';
import type {
  LeaveRequest,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto
} from '../types';

export const leaveRequestApi = {
  // Get all leave requests by employee
  getByEmployee: async (employeeId: number): Promise<LeaveRequest[]> => {
    const res = await http<any>(`/leave-requests/employee/${employeeId}`, {
      method: 'GET',
    });
    if (res && Array.isArray(res.data)) return res.data as LeaveRequest[];
    if (Array.isArray(res)) return res as LeaveRequest[];
    return [];
  },

  // Get all leave requests by factory
  getByFactory: async (factoryId: number, params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string; search?: string }): Promise<{ data: LeaveRequest[], meta: { total: number, page: number, limit: number } }> => {
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

    const res = await http<any>(`/leave-requests/factory/${factoryId}?${queryParams.toString()}`, {
      method: 'GET',
    });

    // Handle paginated response structure
    if (res?.data?.data && res?.data?.meta) {
      return {
        data: res.data.data as LeaveRequest[],
        meta: res.data.meta
      };
    }
    if (res && Array.isArray(res.data)) {
      return {
        data: res.data as LeaveRequest[],
        meta: { total: res.data.length, page: 1, limit: 20 }
      };
    }
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20 }
    };
  },

  // Create new leave request
  create: async (payload: CreateLeaveRequestDto): Promise<LeaveRequest> => {
    const res = await http<any>(`/leave-requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as LeaveRequest;
  },

  // Get single leave request by ID
  getById: async (id: number): Promise<LeaveRequest> => {
    const res = await http<any>(`/leave-requests/detail/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as LeaveRequest;
  },

  // Update leave request (approve/reject/update)
  update: async (
    id: number,
    payload: UpdateLeaveRequestDto
  ): Promise<LeaveRequest> => {
    const res = await http<any>(`/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as LeaveRequest;
  },

  // Export leave requests to XLSX
  exportXLSX: async (
    factoryId: number,
    year: number,
    month: number,
  ): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/leave-requests/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ factoryId, year, month }),
    });

    if (!response.ok) {
      throw new Error('Failed to export leave requests');
    }

    const blob = await response.blob();
    return new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
