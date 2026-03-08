import { useEffect, useState } from "react";
import type React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  Users,
  Search,
  Building2,
  UserCheck,
  CheckCircle,
  UsersRound,
} from "lucide-react";
import { roleGroupApi, type RoleGroup } from "../../api/role-group";
import { employeeApi } from "../../api/employee";
import { departmentApi } from "../../api/departments";
import { positionApi } from "../../api/positions";
import { teamApi } from "../../api/team";
import type { EmployeeWithDetails } from "../../types";
import type { Department, Team } from "../../types/department";
import type { PositionItem } from "../../types";
import { Button } from "../../components/ui/button";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE } from "../../types";
import {
  getMenuDefsForPermissions,
  MENU_CONFIG,
  type MenuItemConfig,
} from "../../constants/menuConfig";
import { UserPlus, Trash } from "lucide-react";
import FilterSection from "../../components/commons/FilterSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

// Quyền đơn bán hàng (chỉ Super Admin)
const SALES_ORDER_PERMISSIONS: Array<{
  key: string;
  label: string;
  description?: string;
}> = [
  // Quyền xem
  {
    key: "view_all_orders",
    label: "Xem tất cả đơn đặt hàng",
    description: "Xem danh sách và chi tiết tất cả đơn hàng MISA",
  },

  // Quyền workflow đơn hàng
  {
    key: "submit_order_for_approval",
    label: "Nhập thông tin đơn hàng và gửi duyệt",
    description: "Nhập thông tin bổ sung cho đơn hàng mới từ MISA và gửi duyệt",
  },
  {
    key: "approve_order",
    label: "Duyệt đơn đặt hàng",
    description: "Duyệt hoặc từ chối đơn hàng",
  },
  {
    key: "manager",
    label: "Quản lý",
    description: "Xác nhận tạm dừng đơn hàng, can thiệp đơn hàng khi cần",
  },
  {
    key: "assign_order_to_warehouse",
    label: "Giao việc cho bộ phận kho",
    description: "Giao việc cho bộ phận kho",
  },
  {
    key: "assign_order_to_technical",
    label: "Giao việc cho bộ phận kỹ thuật",
    description: "Giao việc cho bộ phận kỹ thuật",
  },
  {
    key: "complete_order",
    label: "Hoàn thành đơn hàng",
    description: "Hoàn thành đơn hàng",
  },
];

// Quyền đơn mua hàng (chỉ Super Admin)
const PURCHASE_ORDER_PERMISSIONS: Array<{
  key: string;
  label: string;
  description?: string;
}> = [
  {
    key: "receive_notification_of_purchase_requisition",
    label: "Nhận thông báo và xác nhận mua hàng",
    description: "Nhận thông báo khi đề xuất mua hàng được duyệt và xác nhận đã mua hàng",
  },
  {
    key: "approve_purchase_requisition",
    label: "Duyệt đề xuất mua hàng",
    description: "Duyệt các đề xuất mua hàng từ nhân viên",
  },
  {
    key: "view_all_purchase_orders",
    label: "Xem tất cả đơn mua hàng",
    description: "Xem danh sách tất cả đơn mua hàng",
  },
  {
    key: "submit_purchase_orders",
    label: "Xác nhận đơn mua hàng",
    description: "Nhập thông tin bổ sung cho đơn mua hàng mới từ MISA",
  },
];

const HR_PERMISSIONS: Array<{
  key: string;
  label: string;
  description?: string;
}> = [
  {
    key: "receive_leave_approved_notification",
    label: "Nhận thông báo đơn nghỉ phép được duyệt",
    description: "Nhận thông báo đơn nghỉ phép được duyệt từ nhân viên",
  },
  {
    key: "receive_overtime_approved_notification",
    label: "Nhận thông báo đơn tăng ca được duyệt",
    description: "Nhận thông báo đơn tăng ca được duyệt từ nhân viên",
  },
];

type TabType = "permissions" | "employees";

export default function RoleGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();
  const isSuperAdmin = role === ROLE.SUPER_ADMIN;

  const [group, setGroup] = useState<RoleGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("permissions");
  const [factoryId, setFactoryId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error("ID nhóm không hợp lệ");
        navigate("/nha-may-cua-toi/cau-hinh");
        return;
      }

      try {
        setLoading(true);
        // Get factory first
        const { usersApi } = await import("../../api/users");
        const factory = await usersApi.getMyFactory();
        setFactoryId(factory?.id || null);

        if (factory?.id) {
          const groups = await roleGroupApi.getAll(factory.id);
          const foundGroup = groups.find((g) => String(g.id) === id);
          if (foundGroup) {
            setGroup(foundGroup);
          } else {
            toast.error("Không tìm thấy nhóm phân quyền");
            navigate("/nha-may-cua-toi/cau-hinh");
          }
        }
      } catch (error) {
        console.error("[RoleGroupDetail] Error fetching data:", error);
        toast.error("Không thể tải thông tin nhóm phân quyền");
        navigate("/nha-may-cua-toi/cau-hinh");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const handleSuccess = async () => {
    if (!factoryId || !id) return;
    try {
      const groups = await roleGroupApi.getAll(factoryId);
      const foundGroup = groups.find((g) => String(g.id) === id);
      if (foundGroup) {
        setGroup(foundGroup);
      }
    } catch (error) {
      console.error("[RoleGroupDetail] Error refreshing:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Đang tải thông tin nhóm phân quyền...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Không tìm thấy nhóm phân quyền
          </h2>
          <Link
            to="/nha-may-cua-toi/cau-hinh"
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-block"
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/nha-may-cua-toi/cau-hinh"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại cấu hình
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết nhóm phân quyền: {group.name}
          </h1>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              Vai trò
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employees"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Nhân viên
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "permissions" && (
          <RoleGroupPermissionsTab
            group={group}
            onSuccess={handleSuccess}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === "employees" && factoryId && (
          <RoleGroupEmployeesTab
            group={group}
            onSuccess={handleSuccess}
            factoryId={factoryId}
          />
        )}
      </div>
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
  const [adminMenuKeys, setAdminMenuKeys] = useState<string[]>(
    group.adminMenuKeys || []
  );
  const [salesOrderPermissions, setSalesOrderPermissions] = useState<string[]>(
    (group.permissions || []).filter((p) =>
      SALES_ORDER_PERMISSIONS.some((sp) => sp.key === p)
    )
  );
  const [purchaseOrderPermissions, setPurchaseOrderPermissions] = useState<
    string[]
  >(
    (group.permissions || []).filter((p) =>
      PURCHASE_ORDER_PERMISSIONS.some((pp) => pp.key === p)
    )
  );
  const [hrPermissions, setHrPermissions] = useState<string[]>(
    (group.permissions || []).filter((p) =>
      HR_PERMISSIONS.some((hp) => hp.key === p)
    )
  );

  // Get menu config - sử dụng cấu trúc cây
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Filter menu items based on superAdminOnly
  const filterMenuItems = (items: MenuItemConfig[]): MenuItemConfig[] => {
    return items
      .filter((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        return true;
      })
      .map((item) => {
        const filteredItem = { ...item };
        if (item.children) {
          filteredItem.children = filterMenuItems(item.children);
        }
        return filteredItem;
      });
  };

  const filteredMenuConfig = filterMenuItems(MENU_CONFIG);

  // 4 danh mục chính
  const categories = [
    { type: "screen", name: "Quyền màn hình" },
    { type: "hr", name: "Quyền HR" },
    ...(isSuperAdmin
      ? [
          { type: "sales-order", name: "Quyền đơn bán hàng" },
          { type: "purchase-order", name: "Quyền đơn mua hàng" },
        ]
      : []),
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories.length > 0 ? categories[0].type : "screen"
  );

  const handleSave = async () => {
    try {
      setLoading(true);
      const allPermissions = [
        ...salesOrderPermissions,
        ...purchaseOrderPermissions,
        ...hrPermissions,
      ];

      await roleGroupApi.updatePermissionsAndMenuKeys(
        group.id,
        allPermissions,
        adminMenuKeys
      );

      toast.success("Cập nhật quyền thành công");
      onSuccess();
    } catch (error) {
      console.error(
        "[RoleGroupPermissionsTab] Error updating permissions:",
        error
      );
      toast.error("Không thể cập nhật quyền");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Lấy tất cả child menu IDs (chỉ lấy các menu có href - leaf nodes)
  const getAllChildMenuIds = (item: MenuItemConfig): string[] => {
    const childIds: string[] = [];
    if (item.children) {
      item.children.forEach((child) => {
        if (child.href) {
          childIds.push(child.id);
        }
        if (child.children) {
          childIds.push(...getAllChildMenuIds(child));
        }
      });
    }
    return childIds;
  };

  // Helper: Tìm menu cha của một menu item
  const findParentMenu = (
    menuId: string,
    items: MenuItemConfig[],
    parent: MenuItemConfig | null = null
  ): MenuItemConfig | null => {
    for (const item of items) {
      // Nếu tìm thấy menu item có id trùng với menuId
      if (item.id === menuId) {
        return parent;
      }

      // Nếu item có children, tìm đệ quy
      if (item.children && item.children.length > 0) {
        const found = findParentMenu(menuId, item.children, item);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  };

  // Helper: Tìm menu item theo ID
  const findMenuById = (
    menuId: string,
    items: MenuItemConfig[]
  ): MenuItemConfig | null => {
    for (const item of items) {
      if (item.id === menuId) {
        return item;
      }
      if (item.children) {
        const found = findMenuById(menuId, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleMenuKey = (key: string) => {
    setAdminMenuKeys((prev) => {
      const isCurrentlyChecked = prev.includes(key);
      const menuItem = findMenuById(key, filteredMenuConfig);
      let newKeys: string[];

      if (isCurrentlyChecked) {
        // Bỏ chọn menu này
        newKeys = prev.filter((k) => k !== key);

        // Nếu menu này có children, bỏ chọn tất cả children
        if (menuItem) {
          const allChildIds = getAllChildMenuIds(menuItem);
          newKeys = newKeys.filter((k) => !allChildIds.includes(k));
        }

        // Tìm menu cha và bỏ chọn nếu đang được chọn
        const parentMenu = findParentMenu(key, filteredMenuConfig, null);
        if (parentMenu && newKeys.includes(parentMenu.id)) {
          newKeys = newKeys.filter((k) => k !== parentMenu.id);
        }
      } else {
        // Chọn menu này
        newKeys = [...prev, key];

        // Nếu menu này có children, chọn tất cả children
        if (menuItem) {
          const allChildIds = getAllChildMenuIds(menuItem);
          allChildIds.forEach((childId) => {
            if (!newKeys.includes(childId)) {
              newKeys.push(childId);
            }
          });
        }

        // Tìm menu cha và kiểm tra xem tất cả menu con đã được chọn chưa
        const parentMenu = findParentMenu(key, filteredMenuConfig, null);
        if (parentMenu) {
          const allChildIds = getAllChildMenuIds(parentMenu);
          const allChildrenChecked =
            allChildIds.length > 0 &&
            allChildIds.every((childId) => newKeys.includes(childId));

          if (allChildrenChecked && !newKeys.includes(parentMenu.id)) {
            newKeys.push(parentMenu.id);
          }
        }
      }

      return newKeys;
    });
  };

  const toggleSalesOrderPermission = (key: string) => {
    setSalesOrderPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const togglePurchaseOrderPermission = (key: string) => {
    setPurchaseOrderPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleHrPermission = (key: string) => {
    setHrPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Chọn tất cả / Bỏ chọn tất cả cho từng danh mục
  const selectAllInCategory = (category: string) => {
    if (category === "screen") {
      // Chọn tất cả menu items (chỉ các menu có href)
      const allMenuIds: string[] = [];
      const collectMenuIds = (items: MenuItemConfig[]) => {
        items.forEach((item) => {
          if (item.href && (!item.superAdminOnly || isSuperAdmin)) {
            allMenuIds.push(item.id);
          }
          if (item.children) {
            collectMenuIds(item.children);
          }
        });
      };
      collectMenuIds(filteredMenuConfig);
      setAdminMenuKeys((prev) => {
        const newKeys = [...prev];
        allMenuIds.forEach((id) => {
          if (!newKeys.includes(id)) {
            newKeys.push(id);
          }
        });
        return newKeys;
      });
    } else if (category === "hr") {
      setHrPermissions(HR_PERMISSIONS.map((p) => p.key));
    } else if (category === "sales-order") {
      setSalesOrderPermissions(SALES_ORDER_PERMISSIONS.map((p) => p.key));
    } else if (category === "purchase-order") {
      setPurchaseOrderPermissions(PURCHASE_ORDER_PERMISSIONS.map((p) => p.key));
    }
  };

  const deselectAllInCategory = (category: string) => {
    if (category === "screen") {
      // Bỏ chọn tất cả menu items (chỉ các menu có href)
      const allMenuIds: string[] = [];
      const collectMenuIds = (items: MenuItemConfig[]) => {
        items.forEach((item) => {
          if (item.href && (!item.superAdminOnly || isSuperAdmin)) {
            allMenuIds.push(item.id);
          }
          if (item.children) {
            collectMenuIds(item.children);
          }
        });
      };
      collectMenuIds(filteredMenuConfig);
      setAdminMenuKeys((prev) => prev.filter((k) => !allMenuIds.includes(k)));
    } else if (category === "hr") {
      setHrPermissions([]);
    } else if (category === "sales-order") {
      setSalesOrderPermissions([]);
    } else if (category === "purchase-order") {
      setPurchaseOrderPermissions([]);
    }
  };

  // Kiểm tra xem tất cả quyền trong danh mục đã được chọn chưa
  const isAllSelectedInCategory = (category: string): boolean => {
    if (category === "screen") {
      const allMenuIds: string[] = [];
      const collectMenuIds = (items: MenuItemConfig[]) => {
        items.forEach((item) => {
          if (item.href && (!item.superAdminOnly || isSuperAdmin)) {
            allMenuIds.push(item.id);
          }
          if (item.children) {
            collectMenuIds(item.children);
          }
        });
      };
      collectMenuIds(filteredMenuConfig);
      return (
        allMenuIds.length > 0 &&
        allMenuIds.every((id) => adminMenuKeys.includes(id))
      );
    } else if (category === "hr") {
      return (
        HR_PERMISSIONS.length > 0 &&
        HR_PERMISSIONS.every((p) => hrPermissions.includes(p.key))
      );
    } else if (category === "sales-order") {
      return (
        SALES_ORDER_PERMISSIONS.length > 0 &&
        SALES_ORDER_PERMISSIONS.every((p) =>
          salesOrderPermissions.includes(p.key)
        )
      );
    } else if (category === "purchase-order") {
      return (
        PURCHASE_ORDER_PERMISSIONS.length > 0 &&
        PURCHASE_ORDER_PERMISSIONS.every((p) =>
          purchaseOrderPermissions.includes(p.key)
        )
      );
    }
    return false;
  };

  const toggleMenuExpanded = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Render menu items với cấu trúc cây
  const renderMenuItems = (
    items: MenuItemConfig[],
    level: number = 0
  ): React.ReactNode => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedMenus.has(item.id);
      const isDisabled = item.superAdminOnly && !isSuperAdmin;

      // Tính toán isChecked: nếu có children, kiểm tra xem tất cả children đã được chọn chưa
      let isChecked: boolean;
      if (hasChildren) {
        const allChildIds = getAllChildMenuIds(item);
        isChecked =
          allChildIds.length > 0 &&
          allChildIds.every((childId) => adminMenuKeys.includes(childId));
      } else {
        isChecked = adminMenuKeys.includes(item.id);
      }

      // Nếu có children, render như dropdown
      if (hasChildren) {
        return (
          <div key={item.id} className={`${level > 0 ? "ml-4" : ""}`}>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
              <div
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={() => !isDisabled && toggleMenuExpanded(item.id)}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) toggleMenuKey(item.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDisabled}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span
                  className={`text-sm font-medium text-gray-700 ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) toggleMenuExpanded(item.id);
                }}
                className="ml-2 p-1 hover:bg-gray-200 rounded"
                disabled={isDisabled}
              >
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            {isExpanded && (
              <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                {renderMenuItems(item.children!, level + 1)}
              </div>
            )}
          </div>
        );
      }

      // Nếu không có children, render như item thường
      if (item.href) {
        return (
          <label
            key={item.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border ${
              isDisabled
                ? "cursor-not-allowed opacity-50 bg-gray-50"
                : "cursor-pointer hover:bg-gray-50 border-gray-200"
            } ${level > 0 ? "ml-4" : ""}`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => !isDisabled && toggleMenuKey(item.id)}
              disabled={isDisabled}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 flex-1">{item.label}</span>
          </label>
        );
      }

      return null;
    });
  };

  // Get current category's permissions
  const getCurrentCategoryPermissions = () => {
    if (selectedCategory === "screen") {
      // Quyền màn hình - render cấu trúc cây
      return {
        type: "screen",
        renderContent: () => (
          <div className="space-y-2">{renderMenuItems(filteredMenuConfig)}</div>
        ),
      };
    }

    if (selectedCategory === "hr") {
      // Quyền HR (thông báo)
      return {
        type: "hr",
        permissions: HR_PERMISSIONS.map((perm) => ({
          key: perm.key,
          label: perm.label,
          checked: hrPermissions.includes(perm.key),
          onChange: () => toggleHrPermission(perm.key),
        })),
      };
    }

    if (selectedCategory === "sales-order") {
      // Quyền đơn bán hàng
      return {
        type: "sales-order",
        permissions: SALES_ORDER_PERMISSIONS.map((perm) => ({
          key: perm.key,
          label: perm.label,
          description: perm.description,
          checked: salesOrderPermissions.includes(perm.key),
          onChange: () => toggleSalesOrderPermission(perm.key),
        })),
      };
    }

    if (selectedCategory === "purchase-order") {
      // Quyền đơn mua hàng
      return {
        type: "purchase-order",
        permissions: PURCHASE_ORDER_PERMISSIONS.map((perm) => ({
          key: perm.key,
          label: perm.label,
          description: perm.description,
          checked: purchaseOrderPermissions.includes(perm.key),
          onChange: () => togglePurchaseOrderPermission(perm.key),
        })),
      };
    }

    return null;
  };

  const currentPermissions = getCurrentCategoryPermissions();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex h-[600px]">
        {/* Left Sidebar - Categories */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Danh mục
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.type;
                return (
                  <button
                    key={cat.type}
                    onClick={() => setSelectedCategory(cat.type)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content - Permissions */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentPermissions ? (
              selectedCategory === "screen" &&
              currentPermissions.renderContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Quyền màn hình
                    </h3>
                    <div className="flex gap-2">
                      {isAllSelectedInCategory("screen") ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deselectAllInCategory("screen")}
                        >
                          Bỏ chọn tất cả
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllInCategory("screen")}
                        >
                          Chọn tất cả
                        </Button>
                      )}
                    </div>
                  </div>
                  {currentPermissions.renderContent()}
                </div>
              ) : currentPermissions.permissions &&
                currentPermissions.permissions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedCategory === "hr"
                        ? "Quyền HR"
                        : selectedCategory === "sales-order"
                        ? "Quyền đơn bán hàng"
                        : selectedCategory === "purchase-order"
                        ? "Quyền đơn mua hàng"
                        : ""}
                    </h3>
                    <div className="flex gap-2">
                      {isAllSelectedInCategory(selectedCategory) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            deselectAllInCategory(selectedCategory)
                          }
                        >
                          Bỏ chọn tất cả
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllInCategory(selectedCategory)}
                        >
                          Chọn tất cả
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {currentPermissions.permissions.map((perm: any) => (
                      <label
                        key={perm.key}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          perm.disabled
                            ? "cursor-not-allowed opacity-50 bg-gray-50"
                            : "cursor-pointer hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={perm.checked}
                          onChange={perm.onChange}
                          disabled={perm.disabled}
                          className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 font-medium">
                            {perm.label}
                          </span>
                          {perm.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Không có quyền nào trong danh mục này</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Không có quyền nào trong danh mục này</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Save Button */}
      <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
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
  const [saving, setSaving] = useState(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeWithDetails[]>([]);
  const [groupEmployeeIds, setGroupEmployeeIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(
    new Set()
  );

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [managerFilter, setManagerFilter] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  // Options for filters
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);

  useEffect(() => {
    if (group && factoryId) {
      fetchEmployees();
      fetchFilterOptions();
    }
  }, [group, factoryId]);

  // Load teams when department changes
  useEffect(() => {
    if (!factoryId) {
      setTeams([]);
      return;
    }
    (async () => {
      try {
        const teamList = await teamApi.getAll(+factoryId);
        setTeams(teamList || []);
      } catch (_) {
        setTeams([]);
      }
    })();
  }, [factoryId]);

  const fetchFilterOptions = async () => {
    try {
      const [pos, deps] = await Promise.all([
        positionApi.getAll(+factoryId),
        departmentApi.getAll(+factoryId),
      ]);
      setPositions(pos || []);
      setDepartments(deps || []);
    } catch (error) {
      console.error(
        "[RoleGroupEmployeesTab] Error fetching filter options:",
        error
      );
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [groupEmployees, all] = await Promise.all([
        roleGroupApi.getEmployees(group.id),
        employeeApi.listEmployeesWithDetails(1, 10000, factoryId, {}),
      ]);
      const groupIds = new Set(
        (groupEmployees || []).map((e: EmployeeWithDetails) => +e.id)
      );
      setGroupEmployeeIds(groupIds);
      setSelectedEmployeeIds(new Set(groupIds));
      setAllEmployees((all.data as EmployeeWithDetails[]) || []);
    } catch (error) {
      console.error("[RoleGroupEmployeesTab] Error fetching employees:", error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const filteredIds = getFilteredEmployees().map((e) => +e.id);
    setSelectedEmployeeIds(new Set(filteredIds));
  };

  const handleDeselectAll = () => {
    setSelectedEmployeeIds(new Set());
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentIds = Array.from(groupEmployeeIds);
      const newIds = Array.from(selectedEmployeeIds);

      // Find employees to add and remove
      const toAdd = newIds.filter((id) => !groupEmployeeIds.has(id));
      const toRemove = currentIds.filter((id) => !selectedEmployeeIds.has(id));

      // Batch operations
      if (toAdd.length > 0) {
        await roleGroupApi.addEmployees(group.id, toAdd);
      }
      if (toRemove.length > 0) {
        await roleGroupApi.removeEmployees(group.id, toRemove);
      }

      toast.success("Cập nhật nhân viên trong nhóm thành công");
      await fetchEmployees();
      onSuccess();
    } catch (error) {
      console.error("[RoleGroupEmployeesTab] Error saving employees:", error);
      toast.error("Không thể cập nhật nhân viên");
    } finally {
      setSaving(false);
    }
  };

  // Filter employees based on search and filters
  const getFilteredEmployees = (): EmployeeWithDetails[] => {
    return allEmployees.filter((emp) => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = (emp.user?.fullName || "").toLowerCase();
        const phone = (emp.user?.phone || "").toLowerCase();
        if (!fullName.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }

      // Department filter
      if (
        departmentFilter &&
        String(emp.department?.id) !== String(departmentFilter)
      ) {
        return false;
      }

      // Team filter
      if (teamFilter && String((emp as any).teamId) !== String(teamFilter)) {
        return false;
      }

      // Position filter
      if (
        positionFilter &&
        String(emp.position?.id) !== String(positionFilter)
      ) {
        return false;
      }

      // Status filter
      if (statusFilter && emp.status !== statusFilter) {
        return false;
      }

      // Manager filter
      if (managerFilter) {
        const isManager = emp.isManager === true;
        if (managerFilter === "true" && !isManager) return false;
        if (managerFilter === "false" && isManager) return false;
      }

      // Selected filter
      if (selectedFilter) {
        const isSelected = selectedEmployeeIds.has(+emp.id);
        if (selectedFilter === "selected" && !isSelected) return false;
        if (selectedFilter === "not-selected" && isSelected) return false;
      }

      return true;
    });
  };

  const filteredEmployees = getFilteredEmployees();
  const hasActiveFilters =
    departmentFilter !== "" ||
    teamFilter !== "" ||
    positionFilter !== "" ||
    statusFilter !== "" ||
    managerFilter !== "" ||
    selectedFilter !== "" ||
    searchTerm.trim() !== "";

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployeeIds.has(+emp.id));
  const someFilteredSelected = filteredEmployees.some((emp) =>
    selectedEmployeeIds.has(+emp.id)
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FilterSection
          filters={[
            {
              type: "select",
              label: "Phòng ban",
              value: departmentFilter,
              onChange: (v: string) => {
                setDepartmentFilter(v);
                setPositionFilter("");
                setTeamFilter("");
              },
              options: [
                { value: "", label: "Tất cả phòng ban" },
                ...departments.map((d) => ({
                  value: d.id.toString(),
                  label: d.name,
                })),
              ],
              icon: <Building2 className="h-4 w-4 text-gray-400" />,
            },
            ...(departmentFilter &&
            teams.filter(
              (t) => String(t.departmentId) === String(departmentFilter)
            ).length > 0
              ? [
                  {
                    type: "select" as const,
                    label: "Tổ",
                    value: teamFilter,
                    onChange: setTeamFilter,
                    options: [
                      { value: "", label: "Tất cả tổ" },
                      ...teams
                        .filter(
                          (t) =>
                            String(t.departmentId) === String(departmentFilter)
                        )
                        .map((t) => ({
                          value: t.id.toString(),
                          label: t.name,
                        })),
                    ],
                    icon: <UsersRound className="h-4 w-4 text-gray-400" />,
                  },
                ]
              : []),
            ...(departmentFilter &&
            positions.filter(
              (p) =>
                String((p as any).departmentId) === String(departmentFilter)
            ).length > 0
              ? [
                  {
                    type: "select" as const,
                    label: "Vị trí",
                    value: positionFilter,
                    onChange: setPositionFilter,
                    options: [
                      { value: "", label: "Tất cả vị trí" },
                      ...positions
                        .filter(
                          (p) =>
                            String((p as any).departmentId) ===
                            String(departmentFilter)
                        )
                        .map((p) => ({
                          value: p.id.toString(),
                          label: p.name,
                        })),
                    ],
                    icon: <Users className="h-4 w-4 text-gray-400" />,
                  },
                ]
              : []),
            {
              type: "select",
              label: "Trạng thái",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: "Tất cả trạng thái" },
                { value: "Đã phỏng vấn", label: "Đã phỏng vấn" },
                { value: "Thử việc", label: "Thử việc" },
                { value: "Chính thức", label: "Chính thức" },
                { value: "Nghỉ việc", label: "Nghỉ việc" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
            {
              type: "select",
              label: "Quản lý",
              value: managerFilter,
              onChange: setManagerFilter,
              options: [
                { value: "", label: "Là quản lý hay không" },
                { value: "true", label: "Có" },
                { value: "false", label: "Không" },
              ],
              icon: <UserCheck className="h-4 w-4 text-gray-400" />,
            },
            {
              type: "select",
              label: "Trạng thái chọn",
              value: selectedFilter,
              onChange: setSelectedFilter,
              options: [
                { value: "", label: "Tất cả" },
                { value: "selected", label: "Đã chọn" },
                { value: "not-selected", label: "Chưa chọn" },
              ],
              icon: <CheckCircle className="h-4 w-4 text-gray-400" />,
            },
          ]}
          gridCols="sm:grid-cols-5"
          searchSlot={
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập tên nhân viên cần tìm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          }
          onClearFilters={() => {
            setDepartmentFilter("");
            setTeamFilter("");
            setPositionFilter("");
            setStatusFilter("");
            setManagerFilter("");
            setSelectedFilter("");
            setSearchTerm("");
          }}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách nhân viên
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Đã chọn: {selectedEmployeeIds.size} / {filteredEmployees.length}{" "}
              nhân viên
            </p>
          </div>
          <div className="flex gap-2">
            {allFilteredSelected ? (
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Bỏ chọn tất cả
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Chọn tất cả
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {hasActiveFilters
              ? "Không tìm thấy nhân viên nào phù hợp với bộ lọc"
              : "Không có nhân viên nào"}
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmployeeIds.has(+emp.id);
              return (
                <label
                  key={emp.id}
                  className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleEmployee(+emp.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {emp.user?.fullName || "-"}
                      </span>
                      {emp.isManager && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Quản lý
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>{emp.department?.name || "-"}</span>
                      {emp.position?.name && (
                        <span> - {emp.position.name}</span>
                      )}
                      {emp.user?.phone && <span> - {emp.user.phone}</span>}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Footer with Save Button */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
