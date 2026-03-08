import { http } from "./client";
import type { EmployeeWithDetails } from "../types";

export interface RoleGroup {
  id: number;
  name: string;
  description?: string | null;
  factoryId: number;
  canAccessAdmin: boolean;
  adminMenuKeys: string[] | null;
  permissions: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  employees?: EmployeeWithDetails[];
}

export interface CreateRoleGroupPayload {
  name: string;
  description?: string;
  factoryId: number;
  canAccessAdmin?: boolean;
  adminMenuKeys?: string[];
  permissions?: string[];
  status?: string;
}

export interface UpdateRoleGroupPayload {
  name?: string;
  description?: string;
  canAccessAdmin?: boolean;
  adminMenuKeys?: string[];
  permissions?: string[];
  status?: string;
}

export interface EmployeePermissions {
  permissions: string[];
  adminMenuKeys: string[];
  canAccessAdmin: boolean;
}

export const roleGroupApi = {
  // Lấy tất cả nhóm theo factory
  getAll: async (factoryId: number): Promise<RoleGroup[]> => {
    const response = await http<any>(`/role-group?factoryId=${factoryId}`);
    return response.data || [];
  },

  // Lấy nhóm theo ID
  getById: async (id: number): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}`);
    return response.data;
  },

  // Tạo nhóm mới
  create: async (data: CreateRoleGroupPayload): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Cập nhật nhóm
  update: async (
    id: number,
    data: UpdateRoleGroupPayload,
  ): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Xóa nhóm (soft delete)
  delete: async (id: number): Promise<void> => {
    await http<any>(`/role-group/${id}`, {
      method: "DELETE",
    });
  },

  // Cập nhật permissions của nhóm
  updatePermissions: async (
    id: number,
    permissions: string[],
  ): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissions }),
    });
    return response.data;
  },

  // Cập nhật admin menu keys của nhóm
  updateAdminMenuKeys: async (
    id: number,
    adminMenuKeys: string[],
  ): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}/admin-menu-keys`, {
      method: "PATCH",
      body: JSON.stringify({ adminMenuKeys }),
    });
    return response.data;
  },

  // Cập nhật cả permissions và admin menu keys cùng lúc (tránh race condition)
  updatePermissionsAndMenuKeys: async (
    id: number,
    permissions: string[],
    adminMenuKeys: string[],
  ): Promise<RoleGroup> => {
    const response = await http<any>(
      `/role-group/${id}/permissions-and-menu-keys`,
      {
        method: "PATCH",
        body: JSON.stringify({ permissions, adminMenuKeys }),
      },
    );
    return response.data;
  },

  // Thêm employees vào nhóm
  addEmployees: async (
    id: number,
    employeeIds: number[],
  ): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}/employees`, {
      method: "POST",
      body: JSON.stringify({ employeeIds }),
    });
    return response.data;
  },

  // Xóa employees khỏi nhóm
  removeEmployees: async (
    id: number,
    employeeIds: number[],
  ): Promise<RoleGroup> => {
    const response = await http<any>(`/role-group/${id}/employees`, {
      method: "DELETE",
      body: JSON.stringify({ employeeIds }),
    });
    return response.data;
  },

  // Lấy danh sách employees trong nhóm
  getEmployees: async (id: number): Promise<EmployeeWithDetails[]> => {
    const response = await http<any>(`/role-group/${id}/employees`);
    return response.data || [];
  },

  // Lấy permissions thực tế của employee (từ tất cả groups)
  getEmployeePermissions: async (
    employeeId: number,
  ): Promise<EmployeePermissions> => {
    const response = await http<any>(
      `/role-group/employee/${employeeId}/permissions`,
    );
    return response.data;
  },
};
