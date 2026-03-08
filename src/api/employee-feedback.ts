import { http } from './client';
import type {
  EmployeeFeedback,
  CreateEmployeeFeedbackDto,
  UpdateEmployeeFeedbackDto,
  QueryEmployeeFeedbackDto,
} from '../types/employee-feedback';

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

export const employeeFeedbackApi = {
  // Get feedback by factory
  getByFactory: async (
    factoryId: number,
    query?: QueryEmployeeFeedbackDto,
  ): Promise<PaginationResult<EmployeeFeedback>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.unviewedOnly) params.append('unviewedOnly', 'true');

    const res = await http<any>(
      `/employee-feedback/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
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

  // Get feedback by employee
  getByEmployee: async (
    employeeId: number,
    query?: QueryEmployeeFeedbackDto,
  ): Promise<PaginationResult<EmployeeFeedback>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.status) params.append('status', query.status);

    const res = await http<any>(
      `/employee-feedback/employee/${employeeId}${params.toString() ? `?${params.toString()}` : ''}`,
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

  // Get single feedback by ID
  getById: async (id: number): Promise<EmployeeFeedback> => {
    const res = await http<any>(`/employee-feedback/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as EmployeeFeedback;
  },

  // Create new feedback
  create: async (
    payload: CreateEmployeeFeedbackDto,
  ): Promise<EmployeeFeedback> => {
    const res = await http<any>(`/employee-feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeFeedback;
  },

  // Update feedback or reply to feedback
  update: async (
    id: number,
    payload: UpdateEmployeeFeedbackDto,
  ): Promise<EmployeeFeedback> => {
    const res = await http<any>(`/employee-feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as EmployeeFeedback;
  },

  // Mark feedback as viewed
  markAsViewed: async (id: number): Promise<EmployeeFeedback> => {
    const res = await http<any>(`/employee-feedback/${id}/mark-viewed`, {
      method: 'POST',
    });
    return (res?.data ?? res) as EmployeeFeedback;
  },

  // Delete feedback (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/employee-feedback/${id}`, {
      method: 'DELETE',
    });
  },
};
