// Leave Type Configuration types

export interface LeaveTypeConfig {
  id: number;
  factoryId: number;
  code: string;
  name: string;
  isPaid: boolean;
  deductsFromAnnualLeave: boolean;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  factory?: {
    id: number;
    name: string;
  };
}

export interface CreateLeaveTypeConfigDto {
  factoryId: number;
  code: string;
  name: string;
  isPaid?: boolean;
  deductsFromAnnualLeave?: boolean;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateLeaveTypeConfigDto {
  code?: string;
  name?: string;
  isPaid?: boolean;
  deductsFromAnnualLeave?: boolean;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface QueryLeaveTypeConfigDto {
  factoryId?: number;
  isActive?: boolean;
  isPaid?: boolean;
}
