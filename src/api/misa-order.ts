import { http } from './client';
import type {
  MisaOrder,
  CreateMisaOrderDto,
  ParsedMisaOrderDto,
} from '../types/misa-order';

export const misaOrderApi = {
  // Get my orders (permission-based) - For Mobile ONLY
  // Logic:
  // - Nếu có permission 'receive_order_creation_notification': Xem TẤT CẢ đơn trong factory
  // - Nếu không: Chỉ xem đơn mình tạo + đơn được assign
  getMyOrders: async (): Promise<MisaOrder[]> => {
    const res = await http<any>('/misa-orders/my-orders', {
      method: 'GET',
    });
    return (res?.data || []) as MisaOrder[];
  },

  // Parse Excel file
  parseExcel: async (file: File): Promise<{ success: boolean; data?: ParsedMisaOrderDto; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await http<any>('/misa-orders/parse-excel', {
        method: 'POST',
        body: formData,
        // Remove Content-Type header to let browser set it with boundary
        headers: {},
      });

      // Backend trả về BaseResponse format
      if (res?.data) {
        return { success: true, data: res.data };
      }
      return { success: false, error: 'Không thể phân tích file' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Có lỗi xảy ra' };
    }
  },

  // Create misa order
  create: async (data: CreateMisaOrderDto): Promise<MisaOrder> => {
    const res = await http<any>('/misa-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data as MisaOrder;
  },

  // Get all by factory
  getByFactory: async (factoryId: number, query?: any): Promise<any> => {
    let url = `/misa-orders/factory/${factoryId}`;

    if (query) {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.startDate) params.append('startDate', query.startDate);
      if (query.endDate) params.append('endDate', query.endDate);
      if (query.status) params.append('status', query.status);
      if (query.step) params.append('step', query.step);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    const res = await http<any>(url, {
      method: 'GET',
    });

    // Unwrap nested data structure from backend response
    // Backend returns: { statusCode, message, data: { data: [...], meta: {...} } }
    // We return: { data: [...], meta: {...} }
    return res?.data || { data: [], meta: { total: 0 } };
  },

  // Get pending approval
  getPendingApproval: async (factoryId: number): Promise<MisaOrder[]> => {
    const res = await http<any>(`/misa-orders/pending-approval?factoryId=${factoryId}`, {
      method: 'GET',
    });
    return (res?.data || []) as MisaOrder[];
  },

  // Get assigned to me
  getAssignedToMe: async (): Promise<MisaOrder[]> => {
    const res = await http<any>('/misa-orders/assigned-to-me', {
      method: 'GET',
    });
    return (res?.data || []) as MisaOrder[];
  },

  // Get by ID
  getById: async (id: number): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}`, {
      method: 'GET',
    });
    return res.data as MisaOrder;
  },

  // Approve order
  approve: async (id: number, notes?: string): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return res.data as MisaOrder;
  },

  // Assign order to single employee (old version - for backward compatibility)
  assign: async (id: number, assignedToEmployeeId: number, notes?: string): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToEmployeeId, notes }),
    });
    return res.data as MisaOrder;
  },

  // Assign order to multiple employees with workflow step (new version)
  assignToMultiple: async (
    id: number,
    data: {
      assignedToEmployeeIds: number[];
      step: string;
      notes?: string;
      shippingCompanyName?: string;
      shippingCompanyPhone?: string;
      shippingCompanyAddress?: string;
      trackingNumber?: string;
    }
  ): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data as MisaOrder;
  },

  // Update status
  updateStatus: async (id: number, status: string, notes?: string): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return res.data as MisaOrder;
  },

  // Complete order (finish installation step)
  complete: async (id: number, notes?: string): Promise<MisaOrder> => {
    const res = await http<any>(`/misa-orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return res.data as MisaOrder;
  },

  // Delete
  delete: async (id: number): Promise<void> => {
    await http<any>(`/misa-orders/${id}`, {
      method: 'DELETE',
    });
  },
};
