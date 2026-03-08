import {
  ChartBar,
  Building,
  Settings,
  Factory,
  UserCog,
  Group,
  Users,
  Calendar,
  Database,
  Package,
  FileText,
  AlarmClock,
  MessageSquare,
  ClipboardList,
  MapPin,
  Wrench,
  Banknote,
  Wallet,
  Table2,
  Calculator,
  ShoppingCart,
  ShoppingBag,
  Moon,
  FolderOpen,
  Box,
  FolderOpenIcon,
  ReceiptTextIcon,
  ListCheck,
} from "lucide-react";
import { createElement } from "react";

// Interface cho menu item
export interface MenuItemConfig {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItemConfig[];
  // Chỉ super admin mới thấy
  superAdminOnly?: boolean;
}

// Single source of truth cho tất cả menu
export const MENU_CONFIG: MenuItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    category: "Dashboard",
    icon: createElement(ChartBar, { className: "h-5 w-5" }),
    href: "/",
    superAdminOnly: true,
  },
  {
    id: "factory",
    label: "Quản lý nhà máy",
    category: "Quản lý nhà máy",
    icon: createElement(Building, { className: "h-5 w-5" }),
    href: "/quan-ly/nha-may",
    superAdminOnly: true,
  },
  // Nhà máy của tôi
  {
    id: "my-factory-organization",
    label: "Nhà máy của tôi",
    category: "Nhà máy của tôi",
    icon: createElement(Settings, { className: "h-5 w-5" }),
    children: [
      {
        id: "my-factory",
        label: "Thông tin nhà máy",
        category: "Nhà máy của tôi",
        icon: createElement(Factory, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi",
      },
      {
        id: "my-factory-departments",
        label: "Phòng ban",
        category: "Nhà máy của tôi",
        icon: createElement(Building, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/phong-ban",
      },
      {
        id: "my-factory-positions",
        label: "Vị trí nhân viên",
        category: "Nhà máy của tôi",
        icon: createElement(UserCog, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/vi-tri",
      },
      {
        id: "my-factory-teams",
        label: "Tổ/Nhóm",
        category: "Nhà máy của tôi",
        icon: createElement(Group, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/to",
      },
      {
        id: "my-factory-employees",
        label: "Nhân viên",
        category: "Nhà máy của tôi",
        icon: createElement(Users, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/nhan-vien",
      },
      {
        id: "my-factory-settings",
        label: "Cấu hình nhà máy",
        category: "Nhà máy của tôi",
        icon: createElement(Settings, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/cau-hinh",
      },
    ],
  },
  // Chấm công
  {
    id: "my-factory-attendance",
    label: "Chấm công",
    category: "Chấm công",
    icon: createElement(Calendar, { className: "h-5 w-5" }),
    children: [
      {
        id: "my-factory-attendance-list",
        label: "Dữ liệu chấm công",
        category: "Chấm công",
        icon: createElement(Database, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/du-lieu-cham-cong",
      },
      {
        id: "my-factory-daily-production",
        label: "Sản xuất hàng ngày",
        category: "Chấm công",
        icon: createElement(Package, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/san-xuat-hang-ngay",
      },
    ],
  },
  // Quản lý đơn từ
  {
    id: "my-factory-management-request",
    label: "Quản lý đơn từ",
    category: "Quản lý đơn từ",
    icon: createElement(FileText, { className: "h-5 w-5" }),
    children: [
      {
        id: "my-factory-attendance-overtime-management",
        label: "Đơn tăng ca",
        category: "Quản lý đơn từ",
        icon: createElement(AlarmClock, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/quan-ly-tang-ca",
      },
      {
        id: "my-factory-attendance-bulk-overtime-management",
        label: "Đơn tăng ca hàng loạt",
        category: "Quản lý đơn từ",
        icon: createElement(Users, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/quan-ly-tang-ca-hang-loat",
      },
      {
        id: "my-factory-attendance-leave-management",
        label: "Đơn nghỉ phép",
        category: "Quản lý đơn từ",
        icon: createElement(Calendar, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/quan-ly-phep",
      },
      {
        id: "my-factory-feedback-management",
        label: "Góp ý của nhân viên",
        category: "Quản lý đơn từ",
        icon: createElement(MessageSquare, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/gop-y",
      },
    ],
  },
  // Quản lý báo cáo
  {
    id: "my-factory-management-report",
    label: "Quản lý báo cáo",
    category: "Quản lý báo cáo",
    icon: createElement(ClipboardList, { className: "h-5 w-5" }),
    children: [
      {
        id: "my-factory-arrival-report-management",
        label: "Báo đến nhà máy",
        category: "Quản lý báo cáo",
        icon: createElement(MapPin, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/bao-den-nha-may",
      },
      {
        id: "my-factory-maintenance-report-management",
        label: "Báo máy hỏng",
        category: "Quản lý báo cáo",
        icon: createElement(Wrench, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/bao-may-hong",
      },
      {
        id: "my-factory-support-request-management",
        label: "Báo phí hỗ trợ",
        category: "Quản lý báo cáo",
        icon: createElement(Moon, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/bao-ho-tro",
      },
    ],
  },
  // Lương
  {
    id: "my-factory-salary",
    label: "Lương",
    category: "Lương",
    icon: createElement(Banknote, { className: "h-5 w-5" }),
    children: [
      {
        id: "my-factory-salary-list",
        label: "Phụ cấp",
        category: "Lương",
        icon: createElement(Wallet, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/phu-cap",
      },
      {
        id: "my-factory-salary-table",
        label: "Bảng lương",
        category: "Lương",
        icon: createElement(Table2, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/bang-luong",
      },
      {
        id: "my-factory-salary-calculator",
        label: "Tính lương",
        category: "Lương",
        icon: createElement(Calculator, { className: "h-4 w-4" }),
        href: "/nha-may-cua-toi/tinh-luong",
      },
    ],
  },
  // Dữ liệu từ MISA (chỉ Super Admin)
  {
    id: "misa-data",
    label: "Dữ liệu từ MISA",
    category: "Dữ liệu từ MISA",
    icon: createElement(Database, { className: "h-5 w-5" }),
    superAdminOnly: true,
    children: [
      {
        id: "category-management",
        label: "Danh mục",
        category: "Dữ liệu từ MISA",
        icon: createElement(FolderOpen, { className: "h-4 w-4" }),
        href: "/danh-muc",
        superAdminOnly: true,
      },
      {
        id: "misa-order-management",
        label: "Đơn bán hàng",
        category: "Dữ liệu từ MISA",
        icon: createElement(ShoppingCart, { className: "h-4 w-4" }),
        href: "/quan-ly/don-hang-misa",
        superAdminOnly: true,
      },
      {
        id: "admin-purchase-requisition",
        label: "Đề xuất mua hàng",
        category: "Dữ liệu từ MISA",
        icon: createElement(FileText, { className: "h-4 w-4" }),
        href: "/quan-ly/de-xuat-mua-hang",
        superAdminOnly: true,
      },
      {
        id: "admin-purchase-order",
        label: "Đơn mua hàng",
        category: "Dữ liệu từ MISA",
        icon: createElement(ShoppingBag, { className: "h-4 w-4" }),
        href: "/quan-ly/don-mua-hang",
        superAdminOnly: true,
      },
    ],
  },
  // Quan ly san pham
  {
    id: "product-data",
    label: "Quản lý sản phẩm",
    category: "Quản lý sản phẩm",
    icon: createElement(Box, { className: "h-5 w-5" }),
    superAdminOnly: true,
    children: [
      {
        id: "product-category-management",
        label: "Danh mục",
        category: "Quản lý danh mục",
        icon: createElement(FolderOpenIcon, { className: "h-4 w-4" }),
        href: "/danh-muc-san-pham",
        superAdminOnly: true,
      },
      {
        id: "product-unit-management",
        label: "Sản phẩm",
        category: "Quản lý sản phẩm",
        icon: createElement(Package, { className: "h-4 w-4" }),
        href: "/danh-sach-san-pham",
        superAdminOnly: true,
      },
    ],
  },
  {
    id: "quote",
    label: "Báo giá",
    category: "Báo giá",
    icon: createElement(ReceiptTextIcon, { className: "h-5 w-5" }),
    superAdminOnly: true,
    children: [
      {
        id: "quote-category-management",
        label: "Danh sách báo giá",
        category: "Báo giá",
        icon: createElement(ListCheck, { className: "h-4 w-4" }),
        href: "/danh-sach-bao-gia",
        superAdminOnly: true,
      },
      // {
      //   id: "quote-unit-management",
      //   label: "San phẩm",
      //   category: "Báo giá",
      //   icon: createElement(Database, { className: "h-4 w-4" }),
      //   href: "/danh-sach-san-pham",
      //   superAdminOnly: true,
      // },
    ],
  },
];

// Helper: Flatten menu để lấy tất cả menu items (bao gồm children)
export const getFlatMenuItems = (
  items: MenuItemConfig[] = MENU_CONFIG,
): MenuItemConfig[] => {
  const result: MenuItemConfig[] = [];

  const flatten = (menuItems: MenuItemConfig[]) => {
    for (const item of menuItems) {
      // Chỉ thêm item có href (là leaf node)
      if (item.href) {
        result.push(item);
      }
      if (item.children) {
        flatten(item.children);
      }
    }
  };

  flatten(items);
  return result;
};

// Helper: Lấy danh sách menu cho RoleManagementSettings
export const getMenuDefsForPermissions = (): Array<{
  key: string;
  label: string;
  category: string;
  superAdminOnly?: boolean;
}> => {
  const flatItems = getFlatMenuItems();
  return flatItems.map((item) => ({
    key: item.id,
    label: item.label,
    category: item.category,
    superAdminOnly: item.superAdminOnly,
  }));
};

// Helper: Lấy menu items cho Sidebar (cấu trúc cây)
export const getSidebarItems = () => MENU_CONFIG;

// Helper: Group menu by category
export const getMenuByCategory = (): Record<
  string,
  Array<{ key: string; label: string; superAdminOnly?: boolean }>
> => {
  const flatItems = getFlatMenuItems();
  const grouped: Record<
    string,
    Array<{ key: string; label: string; superAdminOnly?: boolean }>
  > = {};

  for (const item of flatItems) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push({
      key: item.id,
      label: item.label,
      superAdminOnly: item.superAdminOnly,
    });
  }

  return grouped;
};

// Helper: Lấy map từ menuKey → href (dùng cho redirect sau login)
export const getMenuKeyToHrefMap = (): Record<string, string> => {
  const flatItems = getFlatMenuItems();
  const map: Record<string, string> = {};
  for (const item of flatItems) {
    if (item.href) {
      map[item.id] = item.href;
    }
  }
  return map;
};
