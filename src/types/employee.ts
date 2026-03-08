// Employee-related interfaces

import type { Department } from "./department";

export interface PositionItem {
  id: number;
  name: string;
  description?: string | null;
  factoryId: number;
  departmentId: number | string; // Can be either number or string from API
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeItem {
  id: number;
  factoryId: number;
  userId: number;
  positionId: number;
  salary?: number | null;
  status?: string | null;
  salaryType: 'daily' | 'production';
  startDateJob?: string | null;
  endDateJob?: string | null;
  isManager?: boolean;
  totalLeaveDays?: number;
  usedLeaveDays?: number;
  availableLeaveDays?: number;
  expiringLeaveDays?: number;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: number;
    fullName: string;
    phone: string;
    email: string;
    zaloUserId?: string;
  };
  position: PositionItem
  department: Department
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  workingCount?: number;
  otherCount?: number;
}

export type AttendanceMethod = 'location' | 'remote' | 'photo' | 'fingerprint';

export interface AttendanceConfig {
  allowedAttendanceMethods?: AttendanceMethod[];
  requireLocationCheck?: boolean;
  requirePhotoVerification?: boolean;
  requireFingerprintVerification?: boolean;
  allowRemoteAttendance?: boolean;
}

export interface EmployeeWithDetails {
  id: number;
  factoryId: number;
  userId: number;
  positionId: number;
  salary?: number | null;
  status?: string | null;
  salaryType: 'daily' | 'production';
  startDateJob?: string | null;
  endDateJob?: string | null;
  isManager?: boolean;
  totalLeaveDays?: number;
  usedLeaveDays?: number;
  availableLeaveDays?: number;
  expiringLeaveDays?: number;
  createdAt?: string;
  updatedAt?: string;
  // Attendance configuration
  allowedAttendanceMethods?: AttendanceMethod[] | null;
  requireLocationCheck?: boolean;
  requirePhotoVerification?: boolean;
  requireFingerprintVerification?: boolean;
  allowRemoteAttendance?: boolean;
  user: {
    id: number;
    fullName: string;
    phone: string;
    email: string;
    zaloUserId?: string;
  };
  position: PositionItem;
  department: Department;
}
