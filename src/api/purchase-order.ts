import { http } from './client';
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  ConfirmExpectedDateDto,
  ConfirmReceivedDto,
  UpdatePurchaseOrderStatusDto,
} from '../types/purchase-order';

export const purchaseOrderApi = {
  // Get all purchase orders with pagination
  getAll: async (query?: any): Promise<any> => {
    let url = `/purchase-orders`;

    if (query) {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.status) params.append('status', query.status);
      if (query.startDate) params.append('startDate', query.startDate);
      if (query.endDate) params.append('endDate', query.endDate);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    const res = await http<any>(url, {
      method: 'GET',
    });

    return res?.data || { data: [], meta: { total: 0 } };
  },

  // Get by ID
  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await http<any>(`/purchase-orders/${id}`, {
      method: 'GET',
    });
    return res.data as PurchaseOrder;
  },

  // Create purchase order
  create: async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const res = await http<any>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseOrder;
  },

  // Nhập ngày dự kiến hàng về (thay cho approve)
  confirmExpectedDate: async (id: number, data: ConfirmExpectedDateDto): Promise<PurchaseOrder> => {
    const res = await http<any>(`/purchase-orders/${id}/confirm-expected-date`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseOrder;
  },

  // Confirm received
  confirmReceived: async (id: number, data: ConfirmReceivedDto): Promise<PurchaseOrder> => {
    const res = await http<any>(`/purchase-orders/${id}/confirm-received`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseOrder;
  },

  // Update status (completed, cancelled)
  updateStatus: async (id: number, data: UpdatePurchaseOrderStatusDto): Promise<PurchaseOrder> => {
    const res = await http<any>(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseOrder;
  },

  // Delete
  delete: async (id: number): Promise<void> => {
    await http<any>(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  },
};
