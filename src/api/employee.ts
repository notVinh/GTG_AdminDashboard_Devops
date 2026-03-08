import { http } from './client';
import type {
  PositionItem,
  EmployeeItem,
  PaginationMeta,
  EmployeeWithDetails,
  AttendanceConfig
} from '../types';

export const employeeApi = {
  listPositions: async (factoryId: number): Promise<PositionItem[]> => {
    const res = await http<any>(`/position?factoryId=${factoryId}`, { method: 'GET' });
    if (res && Array.isArray(res.data)) return res.data as PositionItem[];
    if (Array.isArray(res)) return res as PositionItem[];
    return [];
  },

  createPosition: async (payload: { factoryId: number; name: string; description?: string | null }): Promise<PositionItem> => {
    const res = await http<any>(`/position`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as PositionItem;
  },

  updatePosition: async (id: number, payload: { name?: string; description?: string | null }): Promise<PositionItem> => {
    const res = await http<any>(`/position/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as PositionItem;
  },

  deletePosition: async (id: number): Promise<void> => {
    await http<any>(`/position/${id}`, { method: 'DELETE' });
  },

  listEmployees: async (
    page: number,
    limit: number,
    factoryId: number
  ): Promise<{ data: EmployeeItem[]; meta: PaginationMeta }> => {
    const res = await http<any>(`/employee?page=${page}&limit=${limit}&factoryId=${factoryId}`, { method: 'GET' });
    if (res && res.data && Array.isArray(res.data.data)) {
      return { data: res.data.data as EmployeeItem[], meta: res.data.meta as PaginationMeta };
    }
    if (res && Array.isArray(res.data) && res.meta) {
      return { data: res.data as EmployeeItem[], meta: res.meta as PaginationMeta };
    }
    if (Array.isArray(res)) {
      return { data: res as EmployeeItem[], meta: { page, limit, total: (res as any[]).length } };
    }
    return { data: [], meta: { page, limit, total: 0 } };
  },

  listEmployeesWithDetails: async (
    page: number,
    limit: number,
    _factoryId: number,
    options?: {
      search?: string;
      positionId?: number | string;
      status?: string;
      departmentId?: number | string;
      teamId?: number | string;
      isManager?: string;
    }
  ): Promise<{ data: EmployeeWithDetails[]; meta: PaginationMeta }> => {
    const params: string[] = [
      `page=${page}`,
      `limit=${limit}`,
      'include=user,position',
    ];
    if (options?.search) params.push(`search=${encodeURIComponent(options.search)}`);
    if (options?.positionId) params.push(`positionId=${options.positionId}`);
    if (options?.status) params.push(`status=${encodeURIComponent(options.status)}`);
    if (options?.departmentId) params.push(`departmentId=${options.departmentId}`);
    if (options?.teamId) params.push(`teamId=${options.teamId}`);
    if (options?.isManager) params.push(`isManager=${options.isManager}`);
    const res = await http<any>(`/employee?${params.join('&')}`, { method: 'GET' });
    if (res && res.data && Array.isArray(res.data.data)) {
      return { data: res.data.data as EmployeeWithDetails[], meta: res.data.meta as PaginationMeta };
    }
    if (res && Array.isArray(res.data) && res.meta) {
      return { data: res.data as EmployeeWithDetails[], meta: res.meta as PaginationMeta };
    }
    if (Array.isArray(res)) {
      return { data: res as EmployeeWithDetails[], meta: { page, limit, total: (res as any[]).length } };
    }
    return { data: [], meta: { page, limit, total: 0 } };
  },

  getMyEmployee: async (): Promise<EmployeeWithDetails | null> => {
    const res = await http<any>(`/employee/me`, { method: 'GET' });
    return (res?.data ?? null) as EmployeeWithDetails | null;
  },

  getEmployeeById: async (id: number): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/${id}?include=user,position,department`, { method: 'GET' });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  updateEmployee: async (
    id: number,
    payload: {
      email?: string;
      phone?: string;
      positionId?: number;
      departmentId?: number;
      salary?: number | null;
      status?: string | null;
      salaryType?: 'daily' | 'production';
      startDateJob?: string | null;
      endDateJob?: string | null;
      isManager?: boolean;
      canAccessAdmin?: boolean;
      adminMenuKeys?: string[] | null;
    }
  ): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  updateEmployeeAdminPermissions: async (
    id: number,
    payload: { canAccessAdmin?: boolean; adminMenuKeys?: string[] }
  ): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/${id}/admin-permissions`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  updateEmployeePermissions: async (
    id: number,
    payload: { permissions: string[] }
  ): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  updateAttendanceConfig: async (
    id: number,
    payload: AttendanceConfig
  ): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/${id}/attendance-config`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  createEmployee: async (payload: {
    factoryId: number;
    userId: number;
    positionId: number;
    salary?: number | null;
    status?: string | null;
    startDateJob?: string | null;
    endDateJob?: string | null;
  }): Promise<EmployeeItem> => {
    const res = await http<any>(`/employee`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeItem;
  },

  createEmployeeWithUser: async (payload: {
    factoryId: number;
    fullName: string;
    phone: string;
    email?: string;
    positionId: number;
    departmentId: number;
    salary?: number | null;
    status?: string | null;
    salaryType?: 'daily' | 'production';
    startDateJob?: string | null;
    endDateJob?: string | null;
    isManager?: boolean;
    allowedAttendanceMethods?: ('location' | 'remote' | 'photo' | 'fingerprint')[] | null;
    requireLocationCheck?: boolean;
    requirePhotoVerification?: boolean;
    requireFingerprintVerification?: boolean;
    allowRemoteAttendance?: boolean;
  }): Promise<EmployeeWithDetails> => {
    const res = await http<any>(`/employee/create-with-user`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeWithDetails;
  },

  getEmployeesBySalaryType: async (factoryId: number, salaryType: 'daily' | 'production'): Promise<EmployeeItem[]> => {
    const res = await http<any>(`/employee/factory/${factoryId}/salary-type/${salaryType}`, { method: 'GET' });
    if (res && Array.isArray(res.data)) return res.data as EmployeeItem[];
    if (Array.isArray(res)) return res as EmployeeItem[];
    return [];
  },

  getByFactory: async (factoryId: number): Promise<EmployeeWithDetails[]> => {
    const res = await http<any>(`/employee?factoryId=${factoryId}&limit=1000&include=user,position,department`, { method: 'GET' });
    if (res && res.data && Array.isArray(res.data.data)) {
      return res.data.data as EmployeeWithDetails[];
    }
    if (res && Array.isArray(res.data)) {
      return res.data as EmployeeWithDetails[];
    }
    if (Array.isArray(res)) {
      return res as EmployeeWithDetails[];
    }
    return [];
  },

  importFromExcel: async (file: File): Promise<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{ row: number; fullName: string; phone: string; error: string }>;
    created: Array<{ fullName: string; phone: string }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await http<any>(`/employee/import-excel`, {
      method: 'POST',
      body: formData,
      // Don't set headers - let browser handle FormData headers automatically
    });

    return res?.data ?? res;
  },

  resetPassword: async (id: number, newPassword: string): Promise<{ message: string }> => {
    const res = await http<any>(`/employee/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    return (res?.data ?? res) as { message: string };
  },

  uploadAvatar: async (id: number, file: File): Promise<EmployeeWithDetails> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await http<any>(`/files/upload-employee-avatar/${id}`, {
      method: 'POST',
      body: formData,
    });

    return (res?.data ?? res) as EmployeeWithDetails;
  },

  // Xóa nhân viên (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/employee/${id}`, {
      method: 'DELETE',
    });
  },

  // Lấy thống kê nhân viên cho Super Admin Dashboard (1 API call duy nhất)
  getDashboardStats: async (): Promise<{
    totalEmployees: number;
    totalFactories: number;
    employeesByFactory: { factoryId: number; factoryName: string; count: number }[];
  }> => {
    const res = await http<any>(`/employee/dashboard-stats`, { method: 'GET' });
    return res?.data ?? { totalEmployees: 0, totalFactories: 0, employeesByFactory: [] };
  },
};


