import { http } from './client';
import type {
  MaintenanceReport,
  CreateMaintenanceReportDto,
  UpdateMaintenanceReportDto,
  QueryMaintenanceReportDto,
} from '../types/maintenance-report';

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

export const maintenanceReportApi = {
  // Get maintenance reports by factory
  getByFactory: async (
    factoryId: number,
    query?: QueryMaintenanceReportDto,
  ): Promise<PaginationResult<MaintenanceReport>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.employeeId) params.append('employeeId', query.employeeId.toString());
    if (query?.assignedEmployeeId) params.append('assignedEmployeeId', query.assignedEmployeeId.toString());
    if (query?.departmentId) params.append('departmentId', query.departmentId.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);

    const res = await http<any>(
      `/maintenance-report/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      },
    );

    // Backend trả về trực tiếp { data: [...], meta: {...} }
    return {
      data: res?.data ?? [],
      meta: res?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get my reports
  getMyReports: async (
    query?: QueryMaintenanceReportDto,
  ): Promise<PaginationResult<MaintenanceReport>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);

    const res = await http<any>(
      `/maintenance-report/my-reports${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      },
    );

    return {
      data: res?.data ?? [],
      meta: res?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get reports assigned to me
  getAssignedToMe: async (
    query?: QueryMaintenanceReportDto,
  ): Promise<PaginationResult<MaintenanceReport>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);

    const res = await http<any>(
      `/maintenance-report/assigned-to-me${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
      },
    );

    return {
      data: res?.data ?? [],
      meta: res?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Get single maintenance report by ID
  getById: async (id: number): Promise<MaintenanceReport> => {
    const res = await http<any>(`/maintenance-report/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as MaintenanceReport;
  },

  // Create new maintenance report
  create: async (
    payload: CreateMaintenanceReportDto,
  ): Promise<MaintenanceReport> => {
    const res = await http<any>(`/maintenance-report/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as MaintenanceReport;
  },

  // Update maintenance report
  update: async (
    id: number,
    payload: UpdateMaintenanceReportDto,
  ): Promise<MaintenanceReport> => {
    const res = await http<any>(`/maintenance-report/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as MaintenanceReport;
  },

  // Delete maintenance report
  delete: async (id: number): Promise<void> => {
    await http<any>(`/maintenance-report/${id}`, {
      method: 'DELETE',
    });
  },
};
