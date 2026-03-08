import { http } from './client';
import type {
  PurchaseRequisition,
  CreatePurchaseRequisitionDto,
  ApprovePurchaseRequisitionDto,
  RejectPurchaseRequisitionDto,
} from '../types/purchase-requisition';

export const purchaseRequisitionApi = {
  // Get all purchase requisitions with pagination
  getAll: async (query?: any): Promise<any> => {
    let url = `/purchase-requisitions`;

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
  getById: async (id: number): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}`, {
      method: 'GET',
    });
    return res.data as PurchaseRequisition;
  },

  // Create purchase requisition
  create: async (data: CreatePurchaseRequisitionDto): Promise<PurchaseRequisition> => {
    const res = await http<any>('/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseRequisition;
  },

  // Approve purchase requisition
  approve: async (id: number, data: ApprovePurchaseRequisitionDto): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseRequisition;
  },

  // Reject purchase requisition
  reject: async (id: number, data: RejectPurchaseRequisitionDto): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseRequisition;
  },

  // Request revision for purchase requisition
  requestRevision: async (id: number, data: { reason: string }): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}/request-revision`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data as PurchaseRequisition;
  },

  // Resubmit purchase requisition after revision
  resubmit: async (id: number, data?: { notes?: string }): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}/resubmit`, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    });
    return res.data as PurchaseRequisition;
  },

  // Confirm purchase for purchase requisition
  confirmPurchase: async (id: number, data?: { notes?: string }): Promise<PurchaseRequisition> => {
    const res = await http<any>(`/purchase-requisitions/${id}/confirm-purchase`, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    });
    return res.data as PurchaseRequisition;
  },

  // Delete
  delete: async (id: number): Promise<void> => {
    await http<any>(`/purchase-requisitions/${id}`, {
      method: 'DELETE',
    });
  },
};
