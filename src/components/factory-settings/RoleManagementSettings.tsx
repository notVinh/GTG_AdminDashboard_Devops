import { useEffect, useState } from 'react';
import { employeeApi } from '../../api/employee';
import { usersApi } from '../../api/users';
import type { EmployeeWithDetails } from '../../types';
import Pagination from '../commons/Pagination';
import ConfirmModal from '../ConfirmModal';
import { Bell, Monitor, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE } from '../../types';
import { getMenuDefsForPermissions } from '../../constants/menuConfig';

// Tab types
type TabType = 'notifications' | 'screen-access' | 'hr';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'notifications',
    label: 'Quyền đơn hàng MISA',
    icon: Bell,
    superAdminOnly: true,
  },
  {
    id: 'hr',
    label: 'Quyền HR',
    icon: Users,
    superAdminOnly: false,
  },
  {
    id: 'screen-access',
    label: 'Quyền màn hình',
    icon: Monitor,
    superAdminOnly: false,
  },
];

// Lấy menu từ config chung (single source of truth)
const MENU_DEFS = getMenuDefsForPermissions();

// Quyền đơn hàng MISA (chỉ Super Admin)
const MISA_PERMISSIONS: Array<{ key: string; label: string }> = [
  {
    key: 'view_all_orders',
    label: 'Xem tất cả đơn đặt hàng',
  },
  {
    key: 'approve_orders',
    label: 'Duyệt đơn đặt hàng',
  },
  {
    key: 'approve_purchase_requisition',
    label: 'Duyệt đề xuất mua hàng',
  },
  {
    key: 'view_all_purchase_orders',
    label: 'Xem tất cả đơn mua hàng',
  },
  {
    key: 'approve_purchase_orders',
    label: 'Xác nhận đơn mua hàng',
  },
];

// Quyền HR (Factory Admin có thể quản lý)
const HR_PERMISSIONS: Array<{ key: string; label: string }> = [
  {
    key: 'receive_leave_approved_notification',
    label: 'Nhận TB đơn nghỉ phép được duyệt',
  },
  {
    key: 'receive_overtime_approved_notification',
    label: 'Nhận TB đơn tăng ca được duyệt',
  },
];

type ConfirmState = {
  open: boolean;
  employee?: EmployeeWithDetails;
  type?: 'admin' | 'misa';
  nextAdmin?: { canAccessAdmin?: boolean; adminMenuKeys?: string[] };
  nextMisa?: { permissions: string[] };
};

export default function RoleManagementSettings() {
  const { role } = useAuth();
  const isSuperAdmin = role === ROLE.SUPER_ADMIN;

  const [myFactory, setMyFactory] = useState<any>(null);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeWithDetails[]>([]); // Store all employees for filtering
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingList, setFetchingList] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [permissionFilter, setPermissionFilter] = useState<string>('');
  const [managerFilter, setManagerFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>(isSuperAdmin ? 'notifications' : 'hr');
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [selectedScreens, setSelectedScreens] = useState<string[]>(
    isSuperAdmin ? ['misa-order'] : ['my-factory-employees']
  ); // Default show based on role

  // Filter tabs based on role
  const availableTabs = tabs.filter(tab => {
    if (tab.superAdminOnly) {
      return isSuperAdmin; // Only super admin can see superAdminOnly tabs
    }
    return true; // All admins can see other tabs
  });

  // Get filtered menu items based on selected screens
  const filteredMenuDefs = MENU_DEFS.filter(menu => selectedScreens.includes(menu.key));

  // Group menu items by category for the dropdown
  const menuCategories = MENU_DEFS.reduce((acc, menu) => {
    if (!acc[menu.category]) {
      acc[menu.category] = [];
    }
    acc[menu.category].push(menu);
    return acc;
  }, {} as Record<string, typeof MENU_DEFS>);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted) setMyFactory(factory);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchList = async (factoryId: number) => {
    try {
      setFetchingList(true);
      // Fetch all employees without pagination for client-side filtering
      const resp = await employeeApi.listEmployeesWithDetails(1, 10000, factoryId, {});
      const empList = (resp.data as EmployeeWithDetails[]) || [];
      setAllEmployees(empList);

      // Extract unique departments and positions
      const uniqueDepts = Array.from(
        new Map(
          empList
            .filter((e) => (e as any).department?.id)
            .map((e) => [
              (e as any).department.id,
              { id: (e as any).department?.id, name: (e as any).department?.name || '-' },
            ])
        ).values()
      );
      setDepartments(uniqueDepts);

      const uniquePos = Array.from(
        new Map(
          empList
            .filter((e) => e.position?.id)
            .map((e) => [e.position?.id, { id: e.position?.id, name: e.position?.name || '-' }])
        ).values()
      );
      setPositions(uniquePos);
    } catch (error) {
      console.error('[RoleManagementSettings] Error fetching employees:', error);
    } finally {
      setFetchingList(false);
    }
  };

  // Get filtered positions based on department filter
  const filteredPositions = departmentFilter
    ? Array.from(
        new Map(
          allEmployees
            .filter((e) => String((e as any).department?.id) === departmentFilter && e.position?.id)
            .map((e) => [e.position?.id, { id: e.position?.id, name: e.position?.name || '-' }])
        ).values()
      )
    : positions;

  // Apply filters on client side
  useEffect(() => {
    let filtered = [...allEmployees];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.user?.fullName || '').toLowerCase().includes(search) ||
          ((e as any).department?.name || '').toLowerCase().includes(search) ||
          (e.position?.name || '').toLowerCase().includes(search)
      );
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter((e) => String((e as any).department?.id) === departmentFilter);
    }

    // Position filter
    if (positionFilter) {
      filtered = filtered.filter((e) => String(e.position?.id) === positionFilter);
    }

    // Permission filter (for notifications/hr tab)
    if (permissionFilter && (activeTab === 'notifications' || activeTab === 'hr')) {
      filtered = filtered.filter((e) => {
        const perms = (e as any).permissions || [];
        return perms.includes(permissionFilter);
      });
    }

    // Permission filter (for screen-access tab)
    if (permissionFilter && activeTab === 'screen-access') {
      filtered = filtered.filter((e) => {
        const keys = (e as any).adminMenuKeys || [];
        return keys.includes(permissionFilter);
      });
    }

    // Manager filter
    if (managerFilter) {
      filtered = filtered.filter((e) => {
        if (managerFilter === 'manager') return e.isManager === true;
        if (managerFilter === 'employee') return e.isManager !== true;
        return true;
      });
    }

    setTotal(filtered.length);
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    setEmployees(filtered.slice(start, end));
  }, [allEmployees, searchTerm, departmentFilter, positionFilter, permissionFilter, managerFilter, activeTab, page, limit]);

  useEffect(() => {
    if (!myFactory?.id) return;
    fetchList(myFactory.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFactory?.id]);

  // Admin permissions handlers
  const openConfirmAdmin = (
    employee: EmployeeWithDetails,
    nextAdmin: { canAccessAdmin?: boolean; adminMenuKeys?: string[] }
  ) => {
    setConfirm({ open: true, employee, type: 'admin', nextAdmin });
  };

  const toggleMenuKey = (employee: EmployeeWithDetails, key: string) => {
    const current = (employee as any).adminMenuKeys || [];
    const has = current.includes(key);
    const nextKeys = has ? current.filter((k: string) => k !== key) : [...current, key];
    // Tự động set canAccessAdmin dựa trên việc có quyền màn hình hay không
    const canAccessAdmin = nextKeys.length > 0;
    openConfirmAdmin(employee, { adminMenuKeys: nextKeys, canAccessAdmin });
  };

  // MISA permissions handlers
  const openConfirmMisa = (
    employee: EmployeeWithDetails,
    nextMisa: { permissions: string[] }
  ) => {
    setConfirm({ open: true, employee, type: 'misa', nextMisa });
  };

  const toggleMisaPermission = (employee: EmployeeWithDetails, permissionKey: string) => {
    const current = (employee as any).permissions || [];
    const has = current.includes(permissionKey);
    const nextPerms = has
      ? current.filter((k: string) => k !== permissionKey)
      : [...current, permissionKey];
    openConfirmMisa(employee, { permissions: nextPerms });
  };

  // Submit changes
  const submitChange = async () => {
    if (!confirm.employee) return;
    try {
      if (confirm.type === 'admin' && confirm.nextAdmin) {
        await employeeApi.updateEmployeeAdminPermissions(
          Number(confirm.employee.id),
          confirm.nextAdmin
        );
      } else if (confirm.type === 'misa' && confirm.nextMisa) {
        await employeeApi.updateEmployeePermissions(
          Number(confirm.employee.id),
          confirm.nextMisa
        );
      }
      if (myFactory?.id) await fetchList(myFactory.id);
    } catch (error) {
      console.error('[RoleManagementSettings] Error updating permissions:', error);
      alert('Có lỗi xảy ra khi cập nhật quyền');
    } finally {
      setConfirm({ open: false });
    }
  };

  if (loading) return <div className="py-6">Đang tải...</div>;
  if (!myFactory) return <div className="py-6">Không tìm thấy nhà máy</div>;

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Phân quyền nhân viên</h3>
            <p className="text-sm text-gray-500 mt-1">
              Trang {page}/{Math.ceil(total / limit) || 1} - Tổng {total} nhân viên
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Tên, phòng ban, vị trí..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPositionFilter(''); // Reset position filter when department changes
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Filter - Only show when department is selected */}
            {departmentFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vị trí
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => {
                    setPositionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tất cả vị trí</option>
                  {filteredPositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manager Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={managerFilter}
                onChange={(e) => {
                  setManagerFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả</option>
                <option value="manager">Quản lý</option>
                <option value="employee">Nhân viên</option>
              </select>
            </div>

            {/* Permission Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === 'notifications' ? 'Quyền đơn hàng' : activeTab === 'hr' ? 'Quyền HR' : 'Quyền màn hình'}
              </label>
              <select
                value={permissionFilter}
                onChange={(e) => {
                  setPermissionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả</option>
                {activeTab === 'notifications' ? (
                  MISA_PERMISSIONS.map((perm) => (
                    <option key={perm.key} value={perm.key}>
                      Có: {perm.label}
                    </option>
                  ))
                ) : activeTab === 'hr' ? (
                  HR_PERMISSIONS.map((perm) => (
                    <option key={perm.key} value={perm.key}>
                      Có: {perm.label}
                    </option>
                  ))
                ) : (
                  filteredMenuDefs.map((menu) => (
                    <option key={menu.key} value={menu.key}>
                      Có: {menu.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || departmentFilter || positionFilter || permissionFilter || managerFilter) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('');
                  setPositionFilter('');
                  setPermissionFilter('');
                  setManagerFilter('');
                  setPage(1);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg border border-gray-200 border-b-0">
        <nav className="flex space-x-8 px-6 border-b border-gray-200">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPermissionFilter(''); // Reset permission filter when switching tabs
                  setPage(1);
                }}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content: Quyền đơn hàng MISA - CHỈ SUPER ADMIN */}
      {activeTab === 'notifications' && isSuperAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto relative">
            {fetchingList && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nhân viên</th>
                <th className="px-4 py-3 text-left font-semibold">Phòng ban</th>
                <th className="px-4 py-3 text-left font-semibold">Vị trí</th>
                {MISA_PERMISSIONS.map((perm) => (
                  <th key={perm.key} className="px-4 py-3 text-center font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <span>{perm.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && !fetchingList ? (
                <tr>
                  <td colSpan={3 + MISA_PERMISSIONS.length} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empPermissions = (emp as any).permissions || [];
                  return (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{(emp as any).user?.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {(emp as any).user?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(emp as any).department?.name || '-'}
                      </td>
                      <td className="px-4 py-3">{(emp as any).position?.name || '-'}</td>
                      {MISA_PERMISSIONS.map((perm) => {
                        const hasPermission = empPermissions.includes(perm.key);
                        return (
                          <td key={perm.key} className="px-4 py-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => toggleMisaPermission(emp, perm.key)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Tab Content: Quyền HR - TẤT CẢ ADMIN */}
      {activeTab === 'hr' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto relative">
            {fetchingList && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nhân viên</th>
                <th className="px-4 py-3 text-left font-semibold">Phòng ban</th>
                <th className="px-4 py-3 text-left font-semibold">Vị trí</th>
                {HR_PERMISSIONS.map((perm) => (
                  <th key={perm.key} className="px-4 py-3 text-center font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <span>{perm.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && !fetchingList ? (
                <tr>
                  <td colSpan={3 + HR_PERMISSIONS.length} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empPermissions = (emp as any).permissions || [];
                  return (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{(emp as any).user?.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {(emp as any).user?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(emp as any).department?.name || '-'}
                      </td>
                      <td className="px-4 py-3">{(emp as any).position?.name || '-'}</td>
                      {HR_PERMISSIONS.map((perm) => {
                        const hasPermission = empPermissions.includes(perm.key);
                        return (
                          <td key={perm.key} className="px-4 py-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => toggleMisaPermission(emp, perm.key)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Tab Content: Quyền màn hình */}
      {activeTab === 'screen-access' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Screen Selection */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn màn hình để quản lý quyền
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(menuCategories).map(([category, menus]) => {
                // Filter menus based on role - only super admin can see superAdminOnly menus
                const filteredMenus = menus.filter(menu => {
                  if (menu.superAdminOnly) {
                    return isSuperAdmin;
                  }
                  return true;
                });

                if (filteredMenus.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {filteredMenus.map((menu) => (
                      <label key={menu.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScreens.includes(menu.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScreens([...selectedScreens, menu.key]);
                            } else {
                              setSelectedScreens(selectedScreens.filter(k => k !== menu.key));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{menu.label}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
            {selectedScreens.length === 0 && (
              <p className="text-sm text-amber-600 mt-3">
                Vui lòng chọn ít nhất một màn hình để hiển thị
              </p>
            )}
          </div>

          <div className="overflow-x-auto relative">
            {fetchingList && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nhân viên</th>
                <th className="px-4 py-3 text-left font-semibold">Phòng ban</th>
                <th className="px-4 py-3 text-left font-semibold">Vị trí</th>
                {filteredMenuDefs.map((m) => (
                  <th key={m.key} className="px-4 py-3 text-center font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <span>{m.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedScreens.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    Vui lòng chọn ít nhất một màn hình để hiển thị
                  </td>
                </tr>
              ) : employees.length === 0 && !fetchingList ? (
                <tr>
                  <td colSpan={3 + filteredMenuDefs.length} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                employees.map((e) => {
                  const keys: string[] = (e as any).adminMenuKeys || [];
                  return (
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{e.user?.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {e.user?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(e as any).department?.name || '-'}
                      </td>
                      <td className="px-4 py-3">{e.position?.name || '-'}</td>
                      {filteredMenuDefs.map((m) => {
                        const hasPermission = keys.includes(m.key);
                        // Only super admin can toggle superAdminOnly menu permissions
                        const isDisabled = m.superAdminOnly && !isSuperAdmin;
                        return (
                          <td key={m.key} className="px-4 py-3 text-center">
                            <label className={`relative inline-flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => !isDisabled && toggleMenuKey(e, m.key)}
                                disabled={isDisabled}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={submitChange}
        title="Xác nhận cập nhật quyền"
        description={`Bạn có chắc muốn thay đổi ${
          confirm.type === 'admin' ? 'quyền truy cập màn hình' : 'quyền đơn hàng MISA'
        } cho nhân viên "${(confirm.employee as any)?.user?.fullName}"?`}
      />
    </div>
  );
}
