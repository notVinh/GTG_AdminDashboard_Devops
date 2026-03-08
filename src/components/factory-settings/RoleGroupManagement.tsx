import { useEffect, useState } from 'react';
import { roleGroupApi, type RoleGroup } from '../../api/role-group';
import { employeeApi } from '../../api/employee';
import { usersApi } from '../../api/users';
import type { EmployeeWithDetails } from '../../types';
import { Users, Settings, Plus, Edit, Key, UserPlus, Power, Trash, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE } from '../../types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../contexts/ToastContext';
import { getMenuDefsForPermissions } from '../../constants/menuConfig';
import ConfirmModal from '../ConfirmModal';

// Quyền đơn hàng MISA (chỉ Super Admin)
const MISA_PERMISSIONS: Array<{ key: string; label: string; description?: string }> = [
  // Quyền xem
  { key: 'view_all_orders', label: 'Xem tất cả đơn đặt hàng', description: 'Xem danh sách và chi tiết tất cả đơn hàng MISA' },

  // Quyền workflow đơn hàng
  { key: 'sale_admin', label: 'Sale Admin - Nhập thông tin đơn hàng', description: 'Nhập thông tin bổ sung cho đơn hàng mới từ MISA và gửi duyệt' },
  { key: 'approve_orders', label: 'BGĐ - Duyệt đơn đặt hàng', description: 'Duyệt hoặc từ chối đơn hàng, chuyển cho kế toán kho' },
  { key: 'warehouse_manager', label: 'Kế toán kho - Xác nhận xuất kho', description: 'Xác nhận xuất kho, cập nhật ngày xuất thực tế' },
  { key: 'technical_leader', label: 'Trưởng kỹ thuật - Quản lý giao & lắp đặt', description: 'Quản lý quá trình giao hàng và lắp đặt' },
  { key: 'complete_orders', label: 'Hoàn tất đơn hàng', description: 'Quyền đánh dấu đơn hàng đã hoàn thành' },

  // Quyền đơn mua hàng
  { key: 'approve_purchase_requisition', label: 'Duyệt đề xuất mua hàng', description: 'Duyệt các đề xuất mua hàng từ nhân viên' },
  { key: 'view_all_purchase_orders', label: 'Xem tất cả đơn mua hàng', description: 'Xem danh sách tất cả đơn mua hàng' },
  { key: 'approve_purchase_orders', label: 'Xác nhận đơn mua hàng', description: 'Xác nhận các đơn mua hàng' },
];

// Quyền HR (Factory Admin có thể quản lý)
const HR_PERMISSIONS: Array<{ key: string; label: string }> = [
  { key: 'receive_leave_approved_notification', label: 'Nhận TB đơn nghỉ phép được duyệt' },
  { key: 'receive_overtime_approved_notification', label: 'Nhận TB đơn tăng ca được duyệt' },
];

type ViewMode = 'list' | 'permissions' | 'employees';

export default function RoleGroupManagement() {
  const { role } = useAuth();
  const isSuperAdmin = role === ROLE.SUPER_ADMIN;
  const toast = useToast();
  const navigate = useNavigate();

  const [myFactory, setMyFactory] = useState<any>(null);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<RoleGroup | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<RoleGroup | null>(null);
  const [showToggleStatusConfirm, setShowToggleStatusConfirm] = useState<RoleGroup | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    canAccessAdmin: false,
    adminMenuKeys: [] as string[],
    permissions: [] as string[],
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted) {
          setMyFactory(factory);
          if (factory?.id) {
            await fetchRoleGroups(factory.id);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchRoleGroups = async (factoryId: number) => {
    try {
      const groups = await roleGroupApi.getAll(factoryId);
      setRoleGroups(groups);
    } catch (error) {
      console.error('[RoleGroupManagement] Error fetching role groups:', error);
      toast.error('Không thể tải danh sách nhóm phân quyền');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !myFactory?.id) return;

    try {
      await roleGroupApi.create({
        name: formData.name,
        description: formData.description,
        factoryId: myFactory.id,
        canAccessAdmin: formData.canAccessAdmin,
        adminMenuKeys: formData.adminMenuKeys,
        permissions: formData.permissions,
      });
      toast.success('Tạo nhóm phân quyền thành công');
      setShowCreateModal(false);
      resetForm();
      if (myFactory?.id) await fetchRoleGroups(myFactory.id);
    } catch (error) {
      console.error('[RoleGroupManagement] Error creating role group:', error);
      toast.error('Không thể tạo nhóm phân quyền');
    }
  };

  const handleUpdate = async () => {
    if (!showEditModal || !formData.name.trim()) return;

    try {
      await roleGroupApi.update(showEditModal.id, {
        name: formData.name,
        description: formData.description,
        canAccessAdmin: formData.canAccessAdmin,
        adminMenuKeys: formData.adminMenuKeys,
        permissions: formData.permissions,
      });
      toast.success('Cập nhật nhóm phân quyền thành công');
      setShowEditModal(null);
      resetForm();
      if (myFactory?.id) await fetchRoleGroups(myFactory.id);
    } catch (error) {
      console.error('[RoleGroupManagement] Error updating role group:', error);
      toast.error('Không thể cập nhật nhóm phân quyền');
    }
  };

  const handleToggleStatus = async () => {
    if (!showToggleStatusConfirm) return;
    
    try {
      const group = showToggleStatusConfirm;
      const newStatus = group.status === 'active' ? 'inactive' : 'active';
      await roleGroupApi.update(group.id, { status: newStatus });
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'tắt'} nhóm phân quyền`);
      setShowToggleStatusConfirm(null);
      if (myFactory?.id) await fetchRoleGroups(myFactory.id);
    } catch (error) {
      console.error('[RoleGroupManagement] Error toggling status:', error);
      toast.error('Không thể thay đổi trạng thái nhóm phân quyền');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      canAccessAdmin: false,
      adminMenuKeys: [],
      permissions: [],
    });
  };

  const openEditModal = (group: RoleGroup) => {
    setShowEditModal(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      canAccessAdmin: group.canAccessAdmin,
      adminMenuKeys: group.adminMenuKeys || [],
      permissions: group.permissions || [],
    });
  };

  if (loading) return <div className="py-6">Đang tải...</div>;
  if (!myFactory) return <div className="py-6">Không tìm thấy nhà máy</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý nhóm phân quyền</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và quản lý nhóm phân quyền, sau đó thêm nhân viên vào nhóm
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo nhóm mới
        </Button>
      </div>

      {/* Role Groups List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {roleGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Chưa có nhóm phân quyền nào</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo nhóm đầu tiên
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {roleGroups.map((group) => (
              <div key={group.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-gray-900">{group.name}</h4>
                      {group.status === 'active' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          Không hoạt động
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        <Users className="h-4 w-4 inline mr-1" />
                        {group.employees?.length || 0} nhân viên
                      </span>
                      <span>
                        <Key className="h-4 w-4 inline mr-1" />
                        {(group.permissions?.length || 0) + (group.adminMenuKeys?.length || 0)} quyền
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/nha-may-cua-toi/nhom-phan-quyen/${group.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Chi tiết
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowToggleStatusConfirm(group)}
                      title={group.status === 'active' ? 'Tắt nhóm' : 'Bật nhóm'}
                    >
                      <Power className={`h-4 w-4 ${group.status === 'active' ? 'text-red-600' : 'text-green-600'}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => !open && (setShowCreateModal(false), resetForm())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo nhóm phân quyền mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Tên nhóm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Quản lý đơn hàng, HR Team..."
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về nhóm phân quyền này..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => (setShowCreateModal(false), resetForm())}>
                Hủy
              </Button>
              <Button onClick={handleCreate}>Tạo nhóm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!showEditModal} onOpenChange={(open) => !open && (setShowEditModal(null), resetForm())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa nhóm phân quyền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">
                Tên nhóm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => (setShowEditModal(null), resetForm())}>
                Hủy
              </Button>
              <Button onClick={handleUpdate}>Cập nhật</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={!!showToggleStatusConfirm}
        onClose={() => setShowToggleStatusConfirm(null)}
        onConfirm={handleToggleStatus}
        title={showToggleStatusConfirm?.status === 'active' ? 'Xác nhận tắt nhóm' : 'Xác nhận bật nhóm'}
        description={
          showToggleStatusConfirm?.status === 'active'
            ? `Bạn có chắc muốn tắt nhóm "${showToggleStatusConfirm?.name}"? Tất cả nhân viên trong nhóm này sẽ mất quyền từ nhóm này.`
            : `Bạn có chắc muốn bật nhóm "${showToggleStatusConfirm?.name}"? Tất cả nhân viên trong nhóm này sẽ có lại quyền từ nhóm này.`
        }
      />

    </div>
  );
}

// Component quản lý permissions của nhóm (Tab)
function RoleGroupPermissionsTab({
  group,
  onSuccess,
  isSuperAdmin,
}: {
  group: RoleGroup;
  onSuccess: () => void;
  isSuperAdmin: boolean;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [adminMenuKeys, setAdminMenuKeys] = useState<string[]>(group.adminMenuKeys || []);
  const [misaPermissions, setMisaPermissions] = useState<string[]>(
    (group.permissions || []).filter(p => MISA_PERMISSIONS.some(mp => mp.key === p))
  );
  const [hrPermissions, setHrPermissions] = useState<string[]>(
    (group.permissions || []).filter(p => HR_PERMISSIONS.some(hp => hp.key === p))
  );

  // Get menu config
  const MENU_DEFS = getMenuDefsForPermissions();
  const menuCategories = MENU_DEFS.reduce((acc: any, menu: any) => {
    if (!acc[menu.category]) acc[menu.category] = [];
    acc[menu.category].push(menu);
    return acc;
  }, {} as Record<string, typeof MENU_DEFS>);

  const handleSave = async () => {
    try {
      setLoading(true);
      const allPermissions = [...misaPermissions, ...hrPermissions];
      
      // Gộp thành 1 API call để tránh race condition
      await roleGroupApi.updatePermissionsAndMenuKeys(
        group.id,
        allPermissions,
        adminMenuKeys
      );

      toast.success('Cập nhật quyền thành công');
      onSuccess();
    } catch (error) {
      console.error('[RoleGroupPermissionsModal] Error updating permissions:', error);
      toast.error('Không thể cập nhật quyền');
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuKey = (key: string) => {
    setAdminMenuKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleMisaPermission = (key: string) => {
    setMisaPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleHrPermission = (key: string) => {
    setHrPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="p-6 space-y-6">
          {/* Admin Menu Keys */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quyền màn hình</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(menuCategories).map(([category, menus]: [string, any]) => {
                const filteredMenus = menus.filter((menu: any) => {
                  if (menu.superAdminOnly) return isSuperAdmin;
                  return true;
                });
                if (filteredMenus.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {filteredMenus.map((menu: any) => {
                      const isDisabled = menu.superAdminOnly && !isSuperAdmin;
                      return (
                        <label
                          key={menu.key}
                          className={`flex items-center space-x-2 ${
                            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={adminMenuKeys.includes(menu.key)}
                            onChange={() => !isDisabled && toggleMenuKey(menu.key)}
                            disabled={isDisabled}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{menu.label}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MISA Permissions */}
          {isSuperAdmin && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quyền đơn hàng MISA</h4>
              <div className="space-y-3">
                {MISA_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-start space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={misaPermissions.includes(perm.key)}
                      onChange={() => toggleMisaPermission(perm.key)}
                      className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm text-gray-700 font-medium">{perm.label}</span>
                      {perm.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* HR Permissions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quyền HR</h4>
            <div className="space-y-2">
              {HR_PERMISSIONS.map((perm) => (
                <label key={perm.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hrPermissions.includes(perm.key)}
                    onChange={() => toggleHrPermission(perm.key)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
    </div>
  );
}

// Component quản lý employees trong nhóm (Tab)
function RoleGroupEmployeesTab({
  group,
  onSuccess,
  factoryId,
}: {
  group: RoleGroup;
  onSuccess: () => void;
  factoryId: number;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeWithDetails[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (group) {
      fetchEmployees();
    }
  }, [group]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [groupEmployees, all] = await Promise.all([
        roleGroupApi.getEmployees(group.id),
        employeeApi.listEmployeesWithDetails(1, 10000, factoryId, {}),
      ]);
      setEmployees(groupEmployees);
      setAllEmployees((all.data as EmployeeWithDetails[]) || []);
    } catch (error) {
      console.error('[RoleGroupEmployeesModal] Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployees = async () => {
    if (selectedEmployeeIds.length === 0) return;

    try {
      setLoading(true);
      await roleGroupApi.addEmployees(group.id, selectedEmployeeIds);
      toast.success('Thêm nhân viên vào nhóm thành công');
      setShowAddModal(false);
      setSelectedEmployeeIds([]);
      await fetchEmployees();
      onSuccess();
    } catch (error) {
      console.error('[RoleGroupEmployeesModal] Error adding employees:', error);
      toast.error('Không thể thêm nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: number) => {
    try {
      setLoading(true);
      await roleGroupApi.removeEmployees(group.id, [employeeId]);
      toast.success('Xóa nhân viên khỏi nhóm thành công');
      await fetchEmployees();
      onSuccess();
    } catch (error) {
      console.error('[RoleGroupEmployeesModal] Error removing employee:', error);
      toast.error('Không thể xóa nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const availableEmployees = allEmployees.filter(
    emp => !employees.some(e => e.id === emp.id)
  );

  return (
    <>
      <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {employees.length} nhân viên trong nhóm
              </p>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm nhân viên
              </Button>
            </div>

            {loading && employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có nhân viên nào trong nhóm
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium">{emp.user?.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {emp.department?.name} - {emp.position?.name}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveEmployee(emp.id)}
                      disabled={loading}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

      </div>

      {/* Add Employees Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !open && (setShowAddModal(false), setSelectedEmployeeIds([]))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên vào nhóm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {availableEmployees.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tất cả nhân viên đã có trong nhóm
                </div>
              ) : (
                <div className="divide-y">
                  {availableEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(+emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployeeIds([...selectedEmployeeIds, +emp.id]);
                          } else {
                            setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== +emp.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{emp.user?.fullName}</div>
                        <div className="text-sm text-gray-500">
                          {emp.department?.name} - {emp.position?.name}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => (setShowAddModal(false), setSelectedEmployeeIds([]))}>
                Hủy
              </Button>
              <Button onClick={handleAddEmployees} disabled={loading || selectedEmployeeIds.length === 0}>
                {loading ? 'Đang thêm...' : `Thêm ${selectedEmployeeIds.length} nhân viên`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

