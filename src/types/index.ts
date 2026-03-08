// Re-export all types from individual files
export * from './auth';
export * from './employee';
export * from './factory';
export * from './files';
export * from './zalo';
export * from './leave-request';
export * from './leave-type';
export * from './overtime';
export * from './overtime-coefficient';
export * from './department';
export * from './employee-feedback';
export * from './arrival-report';
export * from './overnight-report';
export * from './maintenance-report';
export * from './misa-order';
export * from './purchase-order';
export * from './purchase-requisition';

// Backend may return a Role object { id, name },
// but the frontend normalizes it to the Role enum above.

export const ROLE = {
  SUPER_ADMIN: 'SuperAdmin',
  FACTORY_ADMIN: 'FactoryAdmin',
  EMPLOYEE: 'Employee',
  EMPLOYEE_GTG: 'Employee GTG',
  USER: 'User',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

export interface Machine {
  id: number;
  model: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  image?: string;
  manualUrl?: Array<{name: string, url: string}> | null;
}

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: Role; // normalized to enum in frontend
  departmentId?: string;
  isActive: boolean;
  photo?: {
    id: string;
    path: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: Role;
  departmentId?: number;
  phone?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  departmentId?: number;
  isActive?: boolean;
}