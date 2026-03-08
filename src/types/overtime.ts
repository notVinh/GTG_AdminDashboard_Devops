// Overtime types

export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface EmployeeUser {
  id: number;
  user: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
}

export interface Overtime {
  id: number;
  factoryId: number;
  employeeId: number;
  approverEmployeeId: number;
  approverEmployeeIds?: number[] | null;
  decidedByEmployeeId?: number | null;
  coefficientName?: string | null;
  overtimeDate: string;
  startTime: string; // HH:mm - Legacy
  endTime: string; // HH:mm - Legacy
  timeSlots?: Array<{ startTime: string; endTime: string }> | null; // Mới - nhiều khung giờ
  totalHours?: number | null;
  overtimeRate: number; // 1.5, 2.0, 3.0
  reason?: string | null;
  requestLocation?: { latitude: number; longitude: number } | null;
  status: OvertimeStatus;
  decisionNote?: string | null;
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  parentOvertimeId?: number | null; // ID đơn gốc (nếu đây là đơn bổ sung)
  employee?: EmployeeUser;
  approver?: EmployeeUser;
  approvers?: EmployeeUser[];
  decidedBy?: EmployeeUser;
  parentOvertime?: Overtime | null; // Đơn gốc (nếu đây là đơn bổ sung)
  supplements?: Overtime[]; // Danh sách đơn bổ sung (nếu đây là đơn gốc)
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface CreateOvertimeDto {
  factoryId: number;
  employeeId: number;
  approverEmployeeId?: number; // Legacy
  approverEmployeeIds?: number[]; // Mới - danh sách người duyệt
  overtimeCoefficientId: number;
  overtimeDate: string;
  timeSlots?: TimeSlot[]; // Mới - nhiều khung giờ (ưu tiên)
  startTime?: string; // Legacy - dùng nếu không có timeSlots
  endTime?: string; // Legacy - dùng nếu không có timeSlots
  reason?: string;
  requestLocation?: { latitude: number; longitude: number };
  parentOvertimeId?: number; // ID đơn gốc (nếu đây là đơn bổ sung)
}

export interface UpdateOvertimeDto {
  status?: OvertimeStatus;
  decisionNote?: string;
  decidedByEmployeeId?: number; // Người thực sự duyệt
  overtimeCoefficientId?: number;
  approverEmployeeId?: number; // Legacy
  approverEmployeeIds?: number[]; // Mới - danh sách người duyệt
  overtimeDate?: string;
  timeSlots?: TimeSlot[]; // Mới - nhiều khung giờ (ưu tiên)
  startTime?: string; // Legacy - dùng nếu không có timeSlots
  endTime?: string; // Legacy - dùng nếu không có timeSlots
  overtimeRate?: number;
  reason?: string;
  employeeIds?: number[]; // cho bulk update danh sách nhân viên
}
