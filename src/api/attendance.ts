import { http } from './client';

export interface ExportAttendancePayload {
  factoryId: number;
  year: number;
  month: number;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  factoryId: number;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: any;
  checkOutLocation?: any;
  checkInAddress?: string;
  checkOutAddress?: string;
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
  checkInDeviceInfo?: string;
  checkOutDeviceInfo?: string;
  checkInMethod?: string;
  checkOutMethod?: string;
  lateMinutes?: number;
  overtimeMinutes?: number;
  overtimeHours?: number;
  createdAt: string;
  updatedAt: string;
}

export const attendanceApi = {
  // Get attendance by employee
  getEmployeeAttendance: async (
    employeeId: number,
    year: number,
    month: number,
    page: number = 1,
    limit: number = 31
  ): Promise<{ data: AttendanceRecord[]; meta: any }> => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const res = await http<any>(`/attendance/employee/${employeeId}?page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
    });

    return {
      data: res?.data?.data || res?.data || [],
      meta: res?.data?.meta || { page, limit, total: 0 }
    };
  },

  // Get attendance by employee with date range
  getEmployeeAttendanceByDateRange: async (
    employeeId: number,
    startDateStr: string, // YYYY-MM-DD
    endDateStr: string,   // YYYY-MM-DD
    page: number = 1,
    limit: number = 100
  ): Promise<{ data: AttendanceRecord[]; meta: any }> => {
    const res = await http<any>(`/attendance/employee/${employeeId}?page=${page}&limit=${limit}&startDate=${startDateStr}&endDate=${endDateStr}`, {
      method: 'GET',
    });

    return {
      data: res?.data?.data || res?.data || [],
      meta: res?.data?.meta || { page, limit, total: 0 }
    };
  },

  // Get attendance by factory with date range
  getFactoryAttendanceByDateRange: async (
    factoryId: number,
    startDateStr: string, // YYYY-MM-DD
    endDateStr: string,   // YYYY-MM-DD
    page: number = 1,
    limit: number = 1000
  ): Promise<{ data: AttendanceRecord[]; meta: any }> => {
    const res = await http<any>(`/attendance/factory/${factoryId}?page=${page}&limit=${limit}&startDate=${startDateStr}&endDate=${endDateStr}`, {
      method: 'GET',
    });

    return {
      data: res?.data?.data || res?.data || [],
      meta: res?.data?.meta || { page, limit, total: 0 }
    };
  },

  // Export XLSX chấm công
  exportAttendance: async (payload: ExportAttendancePayload): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/export/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    // Ensure correct MIME if server returns octet-stream
    return new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  // Export XLSX tăng ca
  exportOvertime: async (payload: ExportAttendancePayload): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/export/overtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    return new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  // Update attendance record
  updateAttendance: async (
    attendanceId: number,
    payload: {
      checkInTime?: string;
      checkOutTime?: string;
      overtimeHours?: number;
    }
  ): Promise<AttendanceRecord> => {
    const res = await http<{ data: AttendanceRecord }>(`/attendance/${attendanceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return (res?.data as any)?.data || res?.data;
  },
};