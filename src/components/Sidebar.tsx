import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { SuperAdminOnly, FactoryAdminOnly } from "./RoleGuard";
import { useAuth } from "../contexts/AuthContext";
import { ROLE } from "../types";
import { getSidebarItems, type MenuItemConfig } from "../constants/menuConfig";

interface SidebarProps {
  onSelectCategory?: (categoryId: 1 | 2) => void;
  onSelectTitle?: (title: string) => void;
  onNavigate?: (path: string) => void;
}

// Sử dụng menu config từ file chung
const sidebarItems = getSidebarItems();

export default function Sidebar({
  onSelectCategory,
  onSelectTitle,
  onNavigate,
}: SidebarProps) {
  const { role } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["my-factory"])
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("my-factory");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderSidebarItem = (item: MenuItemConfig, level = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive =
      item.id === activeItem ||
      item.children?.some((child) => child.id === activeItem);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              if (isCollapsed) {
                // Expand sidebar when clicking on parent item in collapsed mode
                setIsCollapsed(false);
              }
              toggleExpand(item.id);
              setActiveItem(item.id);
              onSelectTitle?.(item.label);
            } else {
              setActiveItem(item.id);
              onSelectTitle?.(item.label);
              if (item.href) {
                onNavigate?.(item.href);
                // Auto close on mobile after navigate
                setIsMobileOpen(false);
              } else if (onSelectCategory) {
                if (item.id === "factory") onSelectCategory(1);
                if (item.id === "employee") onSelectCategory(2);
              }
            }
          }}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground cursor-pointer",
            isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5",
            isActive &&
              !hasChildren &&
              "bg-accent text-accent-foreground border border-primary/60",
            isActive &&
              hasChildren &&
              "bg-accent/60 text-accent-foreground border border-primary/40",
            level > 0 && !isCollapsed && "ml-4"
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </div>
          {hasChildren && !isCollapsed && (
            <div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </button>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => {
              if (child.superAdminOnly) {
                return (
                  <SuperAdminOnly key={child.id}>
                    {renderSidebarItem(child, level + 1)}
                  </SuperAdminOnly>
                );
              }
              return renderSidebarItem(child, level + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  // Helpers: filter menu for EMPLOYEE by adminMenuKeys (đã merge từ roleGroups)
  const getEmployeePermissions = () => {
    const empPermRaw = localStorage.getItem("employee_permissions");
    try {
      if (empPermRaw) {
        const parsed = JSON.parse(empPermRaw) as {
          canAccessAdmin?: boolean;
          adminMenuKeys?: string[];
          permissions?: string[];
        };
        return {
          canAccessAdmin: parsed.canAccessAdmin || false,
          adminMenuKeys: Array.isArray(parsed.adminMenuKeys) ? parsed.adminMenuKeys : [],
          permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        };
      }
    } catch {}
    return { canAccessAdmin: false, adminMenuKeys: [] as string[], permissions: [] as string[] };
  };

  const filterItemsByAdminKeys = (
    items: MenuItemConfig[],
    keys: Set<string>
  ): MenuItemConfig[] => {
    return items
      .map((it) => {
        const children = it.children
          ? filterItemsByAdminKeys(it.children, keys)
          : undefined;
        const includeSelf = keys.has(it.id);
        if (includeSelf || (children && children.length)) {
          return { ...it, children } as MenuItemConfig;
        }
        return null;
      })
      .filter(Boolean) as MenuItemConfig[];
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg border border-border"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
          "flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "flex items-center h-16 border-b border-border",
          isCollapsed ? "justify-center px-2" : "justify-center px-6"
        )}>
          {isCollapsed ? (
            <img src="/logo.png" alt="GTG" className="h-6 w-6 object-contain" />
          ) : (
            <img src="/logo.png" alt="GTG" className="h-6 w-auto" />
          )}
        </div>

        <nav className={cn(
          "flex-1 overflow-y-auto space-y-1",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {(() => {
            const isEmployee = role === ROLE.EMPLOYEE || role === ROLE.EMPLOYEE_GTG;
            if (isEmployee) {
              const { canAccessAdmin, adminMenuKeys } =
                getEmployeePermissions();
              if (!canAccessAdmin) return null;
              const allowed = new Set<string>(
                Array.isArray(adminMenuKeys) ? adminMenuKeys : []
              );
              const filtered = filterItemsByAdminKeys(sidebarItems, allowed);
              return filtered.map((item) => (
                <div key={item.id}>{renderSidebarItem(item)}</div>
              ));
            }

            // Non-employee (admins): sử dụng superAdminOnly từ config
            return sidebarItems.map((item) => {
              // Nếu item có superAdminOnly thì chỉ super admin mới thấy
              if (item.superAdminOnly) {
                return (
                  <SuperAdminOnly key={item.id}>
                    {renderSidebarItem(item)}
                  </SuperAdminOnly>
                );
              }
              // Các menu khác: Factory Admin có thể thấy
              return (
                <FactoryAdminOnly key={item.id} menuKey={item.id}>
                  {renderSidebarItem(item)}
                </FactoryAdminOnly>
              );
            });
          })()}
        </nav>

        {/* Collapse/Expand Button */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground",
              isCollapsed ? "justify-center px-2" : "justify-between px-3"
            )}
            title={isCollapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <span>Thu nhỏ</span>
                <ChevronLeft className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
