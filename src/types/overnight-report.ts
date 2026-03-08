export const OvernightReportStatus = {
  REPORTED: 'reported',
  CONFIRMED: 'confirmed',
} as const;

export type OvernightReportStatus = typeof OvernightReportStatus[keyof typeof OvernightReportStatus];

export interface OvernightReport {
  id: number;
  factoryId: number;
  employeeId: number;
  reportDate: string;
  reportTime: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  address: string | null;
  status: OvernightReportStatus;
  note: string | null;
  photoUrls: string[] | null;
  receiverEmployeeIds: number[] | null;
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
  // Populated by backend when fetching detail
  receivers?: Array<{
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

export interface CreateOvernightReportDto {
  factoryId: number;
  receiverEmployeeIds: number[];
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  note?: string;
  photoUrls?: string[];
}

export interface QueryOvernightReportDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  status?: OvernightReportStatus;
}
