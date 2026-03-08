import { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type Role, ROLE } from '../types';
import { mergeEmployeePermissions } from '../utils/employeePermissions';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { role } = useAuth();

  // Nếu không có role hoặc role không được phép, hiển thị fallback
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Component tiện ích cho các role cụ thể
export function SuperAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[ROLE.SUPER_ADMIN, ROLE.EMPLOYEE_GTG]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function EmployeeOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[ROLE.EMPLOYEE, ROLE.EMPLOYEE_GTG]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminOrEmployee({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[ROLE.FACTORY_ADMIN, ROLE.EMPLOYEE, ROLE.EMPLOYEE_GTG]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function FactoryAdminOnly({ children, fallback = null, menuKey }: { children: ReactNode; fallback?: ReactNode; menuKey?: string }) {
  const { role } = useAuth();
  // Allow factory/super admin by role
  if (role === ROLE.FACTORY_ADMIN || role === ROLE.SUPER_ADMIN) {
    return <>{children}</>;
  }
  // Allow employee (including EMPLOYEE_GTG) with explicit permissions
  if (role === ROLE.EMPLOYEE || role === ROLE.EMPLOYEE_GTG) {
    try {
      const raw = localStorage.getItem('employee_permissions');
      if (raw) {
        const perms = JSON.parse(raw);
        const can = !!perms?.canAccessAdmin;
        const keys: string[] = Array.isArray(perms?.adminMenuKeys) ? perms.adminMenuKeys : [];
        if (can && (!menuKey || keys.includes(menuKey))) {
          return <>{children}</>;
        }
      }
    } catch {}
  }
  return <>{fallback}</>;
}

export function FactoryAdminStrictOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[ROLE.FACTORY_ADMIN, ROLE.SUPER_ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
