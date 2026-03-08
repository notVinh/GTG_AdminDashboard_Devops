import { http } from './client';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'paid' | 'unpaid';

export interface LeaveRequestItem {
  id: number;
  factoryId: number;
  employeeId: number;
  approverEmployeeId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays?: number | null;
  reason?: string | null;
  status: LeaveStatus;
  decisionNote?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: { id: number; user?: { id: number; fullName?: string | null } };
}

export const leaveApi = {
  listByFactory: async (factoryId: number): Promise<LeaveRequestItem[]> => {
    const res = await http<any>(`/leave-requests/factory/${factoryId}`, { method: 'GET' });
    if (res?.data && Array.isArray(res.data)) return res.data as LeaveRequestItem[];
    if (Array.isArray(res)) return res as LeaveRequestItem[];
    return [];
  },
  listByEmployee: async (employeeId: number): Promise<LeaveRequestItem[]> => {
    const res = await http<any>(`/leave-requests/employee/${employeeId}`, { method: 'GET' });
    if (res?.data && Array.isArray(res.data)) return res.data as LeaveRequestItem[];
    if (Array.isArray(res)) return res as LeaveRequestItem[];
    return [];
  },
  update: async (id: number, payload: Partial<Pick<LeaveRequestItem, 'status' | 'decisionNote'>>): Promise<LeaveRequestItem> => {
    const res = await http<any>(`/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return (res?.data ?? res) as LeaveRequestItem;
  },
};


