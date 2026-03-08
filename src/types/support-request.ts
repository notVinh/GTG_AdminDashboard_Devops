export const SupportRequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type SupportRequestStatus = typeof SupportRequestStatus[keyof typeof SupportRequestStatus];

export interface SupportType {
  id: number;
  factoryId: number;
  code: string;
  name: string;
  unit: string | null;
  requirePhoto: boolean;
  requireQuantity: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRequestItem {
  id: number;
  supportRequestId: number;
  supportTypeId: number;
  quantity: number;
  photoUrls: string[] | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  supportType: SupportType;
}

export interface SupportRequest {
  id: number;
  factoryId: number;
  employeeId: number;
  requestDate: string;
  status: SupportRequestStatus;
  approverEmployeeIds: number[] | null;
  decidedByEmployeeId: number | null;
  decisionNote: string | null;
  decidedAt: string | null;
  note: string | null;
  parentSupportRequestId?: number | null; // ID đơn gốc (nếu đây là đơn bổ sung)
  createdAt: string;
  updatedAt: string;
  items: SupportRequestItem[];
  employee?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      email: string | null;
      phone: string | null;
    };
    position?: {
      id: number;
      name: string;
    };
    department?: {
      id: number;
      name: string;
    };
  };
  factory?: {
    id: number;
    factoryName: string;
    factoryCode: string;
  };
  decidedBy?: {
    id: number;
    user: {
      id: number;
      fullName: string;
    };
  };
  approvers?: Array<{
    id: number;
    user: {
      id: number;
      fullName: string;
    };
    position?: {
      id: number;
      name: string;
    };
    department?: {
      id: number;
      name: string;
    };
  }>;
}

export interface SupportRequestItemDto {
  supportTypeId: number;
  quantity?: number;
  photoUrls?: string[];
  note?: string;
}

export interface CreateSupportRequestDto {
  factoryId: number;
  requestDate: string;
  approverEmployeeIds: number[];
  items: SupportRequestItemDto[];
  note?: string;
  parentSupportRequestId?: number; // ID đơn gốc (nếu đây là đơn bổ sung)
}

export interface UpdateSupportRequestDto {
  status?: 'cancelled' | 'approved' | 'rejected';
  approverEmployeeIds?: number[];
  items?: SupportRequestItemDto[];
  note?: string;
  decisionNote?: string;
}

export interface QuerySupportRequestDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  status?: SupportRequestStatus;
  search?: string;
}

// Support Type DTOs
export interface CreateSupportTypeDto {
  factoryId: number;
  code: string;
  name: string;
  unit?: string;
  requirePhoto?: boolean;
  requireQuantity?: boolean;
}

export interface UpdateSupportTypeDto {
  code?: string;
  name?: string;
  unit?: string;
  requirePhoto?: boolean;
  requireQuantity?: boolean;
  isActive?: boolean;
}
