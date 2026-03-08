export const ArrivalReportStatus = {
  ARRIVED: 'arrived',
  NOT_ARRIVED: 'not_arrived',
  DEPARTED: 'departed',
} as const;

export type ArrivalReportStatus = typeof ArrivalReportStatus[keyof typeof ArrivalReportStatus];

export interface ArrivalReport {
  id: number;
  factoryId: number;
  employeeId: number;
  checkEmployeeId: number | null;
  arrivalDate: string;
  arrivalTime: string;
  departureTime: string | null;
  arrivalLocation: {
    latitude: number;
    longitude: number;
  } | null;
  departureLocation: {
    latitude: number;
    longitude: number;
  } | null;
  companyName: string;
  status: ArrivalReportStatus;
  note: string | null;
  photoUrls: string[] | null;
  departurePhotoUrls: string[] | null;
  stayDurationMinutes: number | null;
  distanceMeters: number | null;
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
  checker?: {
    id: number;
    user: {
      id: number;
      fullName: string;
    };
  };
}

export interface CreateArrivalReportDto {
  factoryId: number;
  companyName: string;
  arrivalLocation?: {
    latitude: number;
    longitude: number;
  };
  note?: string;
}

export interface QueryArrivalReportDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  status?: ArrivalReportStatus;
  search?: string;
}
