import { http } from './client';
import type {
  ArrivalReport,
  CreateArrivalReportDto,
  QueryArrivalReportDto,
} from '../types/arrival-report';

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

export const arrivalReportApi = {
  // Get arrival reports by factory
  getByFactory: async (
    factoryId: number,
    query?: QueryArrivalReportDto,
  ): Promise<PaginationResult<ArrivalReport>> => {
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
      `/arrival-report/factory/${factoryId}${params.toString() ? `?${params.toString()}` : ''}`,
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

  // Get single arrival report by ID
  getById: async (id: number): Promise<ArrivalReport> => {
    const res = await http<any>(`/arrival-report/${id}`, {
      method: 'GET',
    });
    return (res?.data ?? res) as ArrivalReport;
  },

  // Create new arrival report (for testing purposes)
  create: async (
    payload: CreateArrivalReportDto,
  ): Promise<ArrivalReport> => {
    const res = await http<any>(`/arrival-report/check-in`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res?.data ?? res) as ArrivalReport;
  },
};
