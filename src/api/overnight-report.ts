import { http } from './client';
import type {
  OvernightReport,
  CreateOvernightReportDto,
  QueryOvernightReportDto,
} from '../types/overnight-report';

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

export const overnightReportApi = {
  // Get overnight reports by factory
  getByFactory: async (
    factoryId: number,
    query?: QueryOvernightReportDto,
  ): Promise<PaginationResult<OvernightReport>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.employeeId) params.append('employeeId', query.employeeId.toString());
    if (query?.departmentId) params.append('departmentId', query.departmentId.toString());
    if (query?.status) params.append('status', query.status);

    const res = await http<any>(
      `/overnight-report/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      },
    );

    // API trả về: { statusCode, message, data: { data, meta } }
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

  // Get reports assigned to me (I am receiver)
  getAssignedToMe: async (
    query?: QueryOvernightReportDto,
  ): Promise<PaginationResult<OvernightReport>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const res = await http<any>(
      `/overnight-report/assigned-to-me${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      },
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

  // Get single overnight report by ID
  getById: async (id: number): Promise<OvernightReport> => {
    const res = await http<any>(`/overnight-report/detail/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as OvernightReport;
  },

  // Create new overnight report
  create: async (
    payload: CreateOvernightReportDto,
  ): Promise<OvernightReport> => {
    const res = await http<any>(`/overnight-report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as OvernightReport;
  },

  // Export overnight reports to XLSX
  exportXLSX: async (
    factoryId: number,
    year: number,
    month: number,
  ): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = `${baseUrl}/overnight-report/export/${factoryId}?year=${year}&month=${month}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export overnight report');
    }

    const blob = await response.blob();
    return new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};
