// Bulk Overtime Request types

import type { Overtime } from './overtime';

export type BulkOvertimeRequestStatus = 'draft' | 'confirmed' | 'cancelled';

export interface BulkOvertimeRequestEmployee {
  id: number;
  bulkOvertimeRequestId: number;
  employeeId: number;
  overtimeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: {
    id: number;
    departmentId: number;
    positionId: number;
    user: {
      id: number;
      fullName: string;
      phone: string;
      email: string;
    };
    department?: {
      id: number;
      name: string;
    };
    position?: {
      id: number;
      name: string;
    };
  };
  overtime?: Overtime;
}

export interface BulkOvertimeRequest {
  id: number;
  factoryId: number;
  creatorEmployeeId: number;
  approverEmployeeId: number;
  title: string;
  overtimeDate: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalHours?: number | null;
  overtimeCoefficientId: number;
  coefficientName?: string | null;
  overtimeRate: number; // 1.5, 2.0, 3.0
  reason?: string | null;
  status: BulkOvertimeRequestStatus;
  confirmedAt?: string | null;
  confirmedByEmployeeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      phone: string;
      email: string;
    };
  };
  approver?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      phone: string;
      email: string;
    };
  };
  confirmedBy?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      phone: string;
      email: string;
    };
  };
  overtimeCoefficient?: {
    id: number;
    shiftName: string;
    coefficient: number;
    shiftType: string;
    dayType: string;
  };
  employees?: BulkOvertimeRequestEmployee[];
}

export interface CreateBulkOvertimeRequestDto {
  factoryId: number;
  title: string;
  approverEmployeeId: number;
  overtimeCoefficientId: number;
  employeeIds: number[];
  overtimeDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface UpdateBulkOvertimeRequestDto {
  title?: string;
  approverEmployeeId?: number;
  overtimeCoefficientId?: number;
  employeeIds?: number[];
  overtimeDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status?: BulkOvertimeRequestStatus;
}

export interface ConfirmBulkOvertimeRequestDto {
  confirmedByEmployeeId: number;
  autoApprove?: boolean;
}
