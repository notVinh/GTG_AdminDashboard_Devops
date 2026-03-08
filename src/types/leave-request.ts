// Leave Request types

export type LeaveType = 'paid' | 'unpaid';
export type LeaveSession = 'full_day' | 'morning' | 'afternoon';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'hr_confirmed';

interface EmployeeUser {
  id: number;
  user: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
}

export interface LeaveRequest {
  id: number;
  factoryId: number;
  employeeId: number;
  approverEmployeeId: number;
  approverEmployeeIds?: number[] | null;
  decidedByEmployeeId?: number | null;
  leaveType: LeaveType;
  leaveTypeId?: number | null;
  leaveSession: LeaveSession;
  startDate: string;
  endDate: string;
  totalDays?: number | null;
  reason?: string | null;
  status: LeaveRequestStatus;
  decisionNote?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: EmployeeUser;
  approver?: EmployeeUser;
  approvers?: EmployeeUser[];
  decidedBy?: EmployeeUser;
  // Reference đến bảng LeaveType
  leaveTypeRef?: {
    id: number;
    code: string;
    name: string;
    isPaid: boolean;
    deductsFromAnnualLeave: boolean;
  } | null;
}

export interface CreateLeaveRequestDto {
  factoryId: number;
  employeeId: number;
  approverEmployeeId?: number; // Legacy
  approverEmployeeIds?: number[]; // Mới - danh sách người duyệt
  leaveType?: LeaveType;
  leaveTypeId?: number;
  leaveSession?: LeaveSession;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequestDto {
  status?: LeaveRequestStatus;
  decisionNote?: string;
  decidedByEmployeeId?: number; // Người thực sự duyệt
  leaveType?: LeaveType;
  leaveTypeId?: number;
  leaveSession?: LeaveSession;
  startDate?: string;
  endDate?: string;
  reason?: string;
  approverEmployeeIds?: number[];
}
