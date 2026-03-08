export const MaintenanceReportPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type MaintenanceReportPriority = typeof MaintenanceReportPriority[keyof typeof MaintenanceReportPriority];

export const MaintenanceReportStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export type MaintenanceReportStatus = typeof MaintenanceReportStatus[keyof typeof MaintenanceReportStatus];

export interface MaintenanceReport {
  id: number;
  factoryId: number;
  employeeId: number;
  assignedEmployeeId: number | null;
  reportDate: string;
  machineCode: string | null;
  machineName: string;
  issueDescription: string;
  priority: MaintenanceReportPriority;
  status: MaintenanceReportStatus;
  note: string | null;
  resolvedAt: string | null;
  resolvedNote: string | null;
  createdAt: string;
  updatedAt: string;
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
  assignedEmployee?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      email: string | null;
      phone: string | null;
    };
  };
}

export interface CreateMaintenanceReportDto {
  factoryId: number;
  assignedEmployeeId?: number;
  machineCode?: string;
  machineName: string;
  issueDescription: string;
  priority?: MaintenanceReportPriority;
  note?: string;
}

export interface UpdateMaintenanceReportDto {
  assignedEmployeeId?: number;
  machineCode?: string;
  machineName?: string;
  issueDescription?: string;
  priority?: MaintenanceReportPriority;
  note?: string;
  status?: MaintenanceReportStatus;
  resolvedNote?: string;
}

export interface QueryMaintenanceReportDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  assignedEmployeeId?: number;
  departmentId?: number;
  status?: MaintenanceReportStatus;
  priority?: MaintenanceReportPriority;
}
