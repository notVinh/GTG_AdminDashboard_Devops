import { http } from './client';
import type {
  SupportRequest,
  SupportType,
  CreateSupportRequestDto,
  UpdateSupportRequestDto,
  QuerySupportRequestDto,
  CreateSupportTypeDto,
  UpdateSupportTypeDto,
} from '../types/support-request';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginationResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// Support Type API
export const supportTypeApi = {
  // Get support types by factory
  getByFactory: async (
    factoryId: number,
    includeInactive = false,
  ): Promise<SupportType[]> => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');

    const res = await http<any>(
      `/support-types/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
      { method: 'GET' },
    );

    return (res?.data ?? res) as SupportType[];
  },

  // Create support type
  create: async (payload: CreateSupportTypeDto): Promise<SupportType> => {
    const res = await http<any>(`/support-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as SupportType;
  },

  // Update support type
  update: async (id: number, payload: UpdateSupportTypeDto): Promise<SupportType> => {
    const res = await http<any>(`/support-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as SupportType;
  },

  // Delete support type
  delete: async (id: number): Promise<void> => {
    await http<any>(`/support-types/${id}`, {
      method: 'DELETE',
    });
  },

  // Seed default support types for factory
  seedDefaultTypes: async (factoryId: number): Promise<SupportType[]> => {
    const res = await http<any>(`/support-types/seed/${factoryId}`, {
      method: 'POST',
    });
    return (res?.data ?? res) as SupportType[];
  },
};

// Support Request API
export const supportRequestApi = {
  // Get support requests by factory
  getByFactory: async (
    factoryId: number,
    query?: QuerySupportRequestDto,
  ): Promise<PaginationResult<SupportRequest>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.employeeId) params.append('employeeId', query.employeeId.toString());
    if (query?.departmentId) params.append('departmentId', query.departmentId.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);

    const res = await http<any>(
      `/support-requests/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
      { method: 'GET' },
    );

    const result = res?.data ?? res;
    return {
      data: result?.data ?? [],
      meta: result?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get my requests
  getMyRequests: async (
    query?: QuerySupportRequestDto,
  ): Promise<PaginationResult<SupportRequest>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.status) params.append('status', query.status);

    const res = await http<any>(
      `/support-requests/my-requests${params.toString() ? `?${params.toString()}` : ''}`,
      { method: 'GET' },
    );

    const result = res?.data ?? res;
    return {
      data: result?.data ?? [],
      meta: result?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get requests assigned to me for approval
  getAssignedToMe: async (
    query?: QuerySupportRequestDto,
  ): Promise<PaginationResult<SupportRequest>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.status) params.append('status', query.status);

    const res = await http<any>(
      `/support-requests/assigned-to-me${params.toString() ? `?${params.toString()}` : ''}`,
      { method: 'GET' },
    );

    const result = res?.data ?? res;
    return {
      data: result?.data ?? [],
      meta: result?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get single support request by ID
  getById: async (id: number): Promise<SupportRequest> => {
    const res = await http<any>(`/support-requests/detail/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as SupportRequest;
  },

  // Create new support request
  create: async (payload: CreateSupportRequestDto): Promise<SupportRequest> => {
    const res = await http<any>(`/support-requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as SupportRequest;
  },

  // Update support request (có thể cập nhật thông tin, hủy, hoặc duyệt/từ chối)
  update: async (
    id: number,
    payload: UpdateSupportRequestDto,
  ): Promise<SupportRequest> => {
    const res = await http<any>(`/support-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as SupportRequest;
  },

  // Export support requests to XLSX (chi tiết hỗ trợ)
  exportXLSX: async (
    factoryId: number,
    year: number,
    month: number,
  ): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/support-requests/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ factoryId, year, month }),
    });

    if (!response.ok) {
      throw new Error('Failed to export support requests');
    }

    const blob = await response.blob();
    return new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  // Export support requests with overtime (hỗ trợ kèm tăng ca)
  exportXLSXWithOvertime: async (
    factoryId: number,
    year: number,
    month: number,
  ): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/export/overtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ factoryId, year, month }),
    });

    if (!response.ok) {
      throw new Error('Failed to export support requests with overtime');
    }

    const blob = await response.blob();
    return new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
