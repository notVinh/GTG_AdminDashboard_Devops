// Overtime Coefficient types

export const ShiftType = {
  DAY: 'DAY',
  NIGHT: 'NIGHT',
} as const;

export type ShiftType = typeof ShiftType[keyof typeof ShiftType];

export const DayType = {
  WEEKDAY: 'WEEKDAY',
  WEEKEND: 'WEEKEND',
  HOLIDAY: 'HOLIDAY',
} as const;

export type DayType = typeof DayType[keyof typeof DayType];

export interface OvertimeCoefficient {
  id: number;
  factoryId: number;
  shiftName: string;
  coefficient: number; // 130, 150, 180, 210, 200, 270, 300, 390
  shiftType: ShiftType;
  dayType: DayType;
  hasWorkedDayShift: boolean;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  factory?: {
    id: number;
    name: string;
  };
}

export interface CreateOvertimeCoefficientDto {
  factoryId: number;
  shiftName: string;
  coefficient: number;
  shiftType: ShiftType;
  dayType: DayType;
  hasWorkedDayShift?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface UpdateOvertimeCoefficientDto {
  shiftName?: string;
  coefficient?: number;
  shiftType?: ShiftType;
  dayType?: DayType;
  hasWorkedDayShift?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface QueryOvertimeCoefficientDto {
  factoryId?: number;
  shiftType?: ShiftType;
  dayType?: DayType;
  isActive?: boolean;
}
