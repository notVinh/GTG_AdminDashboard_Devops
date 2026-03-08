export interface Department {
  id: number;
  name: string;
  description?: string;
  status: string;
  factoryId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  positions?: PositionEmployee[];
}

export interface PositionEmployee {
  id: number;
  name: string;
  description: string;
  status: string;
  factoryId: number;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  department?: Department;
  employees?: Employee[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  status: string;
  departmentId: number;
  factoryId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  department?: Department;
  employees?: Employee[];
}

export interface Employee {
  id: number;
  factoryId: number;
  userId: number;
  positionId: number;
  departmentId: number;
  teamId?: number;
  salary: number;
  status: string;
  startDateJob: string;
  endDateJob?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: User;
  position?: PositionEmployee;
  department?: Department;
  team?: Team;
}

export interface User {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  roleId: number;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  role?: Role;
  status?: Status;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Status {
  id: number;
  name: string;
  description?: string;
}
