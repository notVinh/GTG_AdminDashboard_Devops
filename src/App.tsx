import { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FactoryManagement from "./pages/admins/FactoryManagement";
import FactoryForm from "./pages/admins/FactoryForm";
import MyFactory from "./pages/factories/MyFactory";
import MyFactoryEmployees from "./pages/factories/MyFactoryEmployees";
import EmployeeForm from "./pages/factories/EmployeeForm";
import ImportEmployees from "./pages/factories/ImportEmployees";
import EmployeeDetail from "./pages/factories/EmployeeDetail";
import DepartmentManagement from "./pages/factories/DepartmentManagement";
import PositionManagement from "./pages/factories/PositionManagement";
import TeamManagement from "./pages/factories/TeamManagement";
import MessageManagement from "./pages/factories/MessageManagement";
import ZaloOAManagement from "./pages/factories/ZaloOAManagement";
import MyFactoryZaloOA from "./pages/factories/MyFactoryZaloOA";
import MyFactoryAttendance from "./pages/factories/MyFactoryAttendance";
import MyFactoryLeaveManagement from "./pages/factories/MyFactoryLeaveManagement";
import MyFactoryOvertimeManagement from "./pages/factories/MyFactoryOvertimeManagement";
import MyFactoryBulkOvertimeManagement from "./pages/factories/MyFactoryBulkOvertimeManagement";
import MyFactoryFeedbackManagement from "./pages/factories/MyFactoryFeedbackManagement";
import MyFactoryArrivalReportManagement from "./pages/factories/MyFactoryArrivalReportManagement";
import MyFactoryOvernightReportManagement from "./pages/factories/MyFactoryOvernightReportManagement";
import MyFactorySupportRequestManagement from "./pages/factories/MyFactorySupportRequestManagement";
import CreateSupportRequest from "./pages/factories/CreateSupportRequest";
import MyFactoryMaintenanceReportManagement from "./pages/factories/MyFactoryMaintenanceReportManagement";
import CreateBulkOvertimeRequest from "./pages/factories/CreateBulkOvertimeRequest";
import EditBulkOvertimeRequest from "./pages/factories/EditBulkOvertimeRequest";
import MyFactoryDailyProduction from "./pages/factories/MyFactoryDailyProduction";
import MyFactoryMisaOrders from "./pages/factories/MyFactoryMisaOrders";
import MisaOrderDetail from "./pages/factories/MisaOrderDetail";
import MyFactoryPurchaseOrders from "./pages/factories/MyFactoryPurchaseOrders";
import PurchaseOrderDetail from "./pages/factories/PurchaseOrderDetail";
import MyFactoryPurchaseRequisitions from "./pages/factories/MyFactoryPurchaseRequisitions";
import PurchaseRequisitionDetail from "./pages/factories/PurchaseRequisitionDetail";
import MyFactoryProductionDetail from "./pages/factories/MyFactoryProductionDetail";
import MyFactorySettings from "./pages/factories/MyFactorySettings";
import RoleGroupDetail from "./pages/factories/RoleGroupDetail";
import CategoryManagement from "./pages/factories/CategoryManagement";
import SuperAdminDashboard from "./pages/admins/SuperAdminDashboard";
import MisaConnectionManagement from "./pages/admins/MisaConnectionManagement";
import MisaOrderManagement from "./pages/admins/MisaOrderManagement";
import MisaSalesOrderDetail from "./pages/admins/MisaSalesOrderDetail";
import AdminPurchaseRequisitions from "./pages/admins/AdminPurchaseRequisitions";
import AdminPurchaseRequisitionDetail from "./pages/admins/AdminPurchaseRequisitionDetail";
import AdminPurchaseOrderManagement from "./pages/admins/AdminPurchaseOrderManagement";
import AdminPurchaseOrderDetail from "./pages/admins/AdminPurchaseOrderDetail";
import AdminGeneralRequests from "./pages/admins/AdminGeneralRequests";
import AdminGeneralRequestDetail from "./pages/admins/AdminGeneralRequestDetail";
import FactoryAdminDashboard from "./pages/factories/FactoryAdminDashboard";
import AllNotifications from "./pages/AllNotifications";
import { SuperAdminOnly, FactoryAdminOnly, AdminOrEmployee } from "./components/RoleGuard";
import Login from "./pages/Login";
import { setGlobalLogout } from "./api/client";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { useTokenExpiration } from "./hooks/useTokenExpiration";
import TokenExpirationNotification from "./components/TokenExpirationNotification";
import { type User, ROLE } from "./types";
import { employeeApi } from "./api/employee";
import { authApi } from "./api/auth";
import { getMenuKeyToHrefMap } from "./constants/menuConfig";
import { mergeEmployeePermissions } from "./utils/employeePermissions";
import ProductCategoryManagement from "./pages/factories/ProductCategoryManagement";
import ProductManagement from "./pages/factories/ProductManagement";
import QuoteManagement from "./pages/factories/QuoteManagement";
import PrintTemplate from "./components/PrintTemplate";

// Component to show role-based dashboard
function RoleBasedDashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (role === ROLE.SUPER_ADMIN) return;
    if (role === ROLE.FACTORY_ADMIN) return;
    // Employee: try read employee permissions and redirect to first allowed screen
    try {
      const raw = localStorage.getItem("employee_permissions");
      console.log("[RoleBasedDashboard] employee_permissions raw:", raw);
      if (raw) {
        const perms = JSON.parse(raw);
        console.log("[RoleBasedDashboard] parsed perms:", perms);
        if (perms?.canAccessAdmin) {
          const keys: string[] = Array.isArray(perms.adminMenuKeys)
            ? perms.adminMenuKeys
            : [];
          const first = keys[0];
          // Sử dụng map từ menuConfig (single source of truth)
          const map = getMenuKeyToHrefMap();
          console.log(
            "[RoleBasedDashboard] first key:",
            first,
            "map[first]:",
            map[first],
          );
          if (first && map[first]) {
            navigate(map[first], { replace: true });
            return;
          }
        }
      }
    } catch (e) {
      console.error("[RoleBasedDashboard] Error:", e);
    }
  }, [role, navigate]);

  if (role === ROLE.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  } else if (role === ROLE.FACTORY_ADMIN) {
    return <FactoryAdminDashboard />;
  }
  return <div className="p-6">Bạn không có quyền truy cập dashboard này.</div>;
}

function AppContent() {
  const [token, setToken] = useState<string | null>(null);
  // const [categoryId, setCategoryId] = useState<1 | 2>(1);
  const [title, setTitle] = useState<string>("Dashboard");
  const [showTokenWarning, setShowTokenWarning] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    // Update title based on current route
    if (location.pathname === "/") {
      setTitle("Dashboard");
    } else if (location.pathname === "/thong-bao") {
      setTitle("Thông báo");
    } else if (location.pathname === "/quan-ly/ket-noi-misa") {
      setTitle("Quản lý kết nối MISA");
    } else if (location.pathname.startsWith("/quan-ly/nha-may")) {
      setTitle("Nhà máy");
    } else if (location.pathname.startsWith("/nha-may-cua-toi")) {
      if (location.pathname === "/nha-may-cua-toi/phong-ban") {
        setTitle("Phòng ban");
      } else if (location.pathname === "/nha-may-cua-toi/vi-tri") {
        setTitle("Vị trí nhân viên");
      } else if (location.pathname === "/nha-may-cua-toi/to") {
        setTitle("Tổ");
      } else if (location.pathname === "/nha-may-cua-toi/nhan-vien/tao-moi") {
        setTitle("Tạo nhân viên mới");
      } else if (location.pathname === "/nha-may-cua-toi/nhan-vien/import") {
        setTitle("Import nhân viên");
      } else if (location.pathname.startsWith("/nha-may-cua-toi/nhan-vien/")) {
        setTitle("Chi tiết nhân viên");
      } else if (location.pathname === "/nha-may-cua-toi/nhan-vien") {
        setTitle("Nhân viên");
      } else if (location.pathname === "/nha-may-cua-toi/quan-ly-phep") {
        setTitle("Quản lý đơn phép");
      } else if (location.pathname === "/nha-may-cua-toi/quan-ly-tang-ca") {
        setTitle("Quản lý đơn tăng ca");
      } else if (location.pathname === "/nha-may-cua-toi/gop-y") {
        setTitle("Quản lý góp ý nhân viên");
      } else if (location.pathname === "/nha-may-cua-toi/bao-den-nha-may") {
        setTitle("Quản lý báo đến nhà máy");
      } else if (location.pathname === "/nha-may-cua-toi/bao-may-hong") {
        setTitle("Quản lý báo máy hỏng");
      } else if (location.pathname === "/nha-may-cua-toi/bao-qua-dem") {
        setTitle("Quản lý báo qua đêm");
      } else if (location.pathname === "/nha-may-cua-toi/bao-ho-tro") {
        setTitle("Quản lý báo hỗ trợ");
      } else if (location.pathname === "/nha-may-cua-toi/bao-ho-tro/tao-moi") {
        setTitle("Tạo yêu cầu hỗ trợ");
      } else if (location.pathname === "/nha-may-cua-toi/san-xuat-hang-ngay") {
        setTitle("Sản xuất hàng ngày");
      } else if (
        location.pathname.startsWith("/nha-may-cua-toi/chi-tiet-san-xuat/")
      ) {
        setTitle("Chi tiết sản xuất");
      } else if (location.pathname === "/nha-may-cua-toi/du-lieu-cham-cong") {
        setTitle("Dữ liệu chấm công");
      } else if (location.pathname === "/nha-may-cua-toi/ca-lam-viec") {
        setTitle("Ca làm việc");
      } else if (location.pathname === "/nha-may-cua-toi/zalo-oa") {
        setTitle("Zalo OA của nhà máy");
      } else if (location.pathname === "/nha-may-cua-toi/cau-hinh") {
        setTitle("Cấu hình nhà máy");
      } else if (location.pathname === "/nha-may-cua-toi/tin-nhan") {
        setTitle("Tin nhắn");
      } else {
        setTitle("Nhà máy của tôi");
      }
    } else if (location.pathname.startsWith("/nhan-vien")) {
      setTitle("Nhân viên");
    } else if (
      location.pathname.startsWith("/nha-may-cua-toi/misa-orders/import")
    ) {
      setTitle("Import Đơn Đặt Hàng");
    } else if (location.pathname.match(/\/nha-may-cua-toi\/misa-orders\/\d+/)) {
      setTitle("Chi Tiết Đơn Hàng");
    } else if (location.pathname.startsWith("/nha-may-cua-toi/misa-orders")) {
      setTitle("Danh Sách Đơn Đặt Hàng");
    } else if (
      location.pathname.match(/\/nha-may-cua-toi\/purchase-orders\/\d+/)
    ) {
      setTitle("Chi Tiết Đơn Mua Hàng");
    } else if (
      location.pathname.startsWith("/nha-may-cua-toi/purchase-orders")
    ) {
      setTitle("Danh Sách Đơn Mua Hàng");
    } else if (
      location.pathname.match(/\/nha-may-cua-toi\/purchase-requisitions\/\d+/)
    ) {
      setTitle("Chi Tiết Đề Xuất Mua Hàng");
    } else if (
      location.pathname.startsWith("/nha-may-cua-toi/purchase-requisitions")
    ) {
      setTitle("Danh Sách Đề Xuất Mua Hàng");
    } else if (location.pathname.match(/\/quan-ly\/de-xuat-mua-hang\/\d+/)) {
      setTitle("Chi Tiết Đề Xuất Mua Hàng");
    } else if (location.pathname.startsWith("/quan-ly/de-xuat-mua-hang")) {
      setTitle("Quản Lý Đề Xuất Mua Hàng");
    } else if (location.pathname.match(/\/quan-ly\/yeu-cau-chung\/\d+/)) {
      setTitle("Chi tiết yêu cầu");
    } else if (location.pathname.startsWith("/quan-ly/yeu-cau-chung")) {
      setTitle("Yêu cầu chung");
    } else if (location.pathname.match(/\/quan-ly\/don-mua-hang\/\d+/)) {
      setTitle("Chi Tiết Đơn Mua Hàng");
    } else if (location.pathname.startsWith("/quan-ly/don-mua-hang")) {
      setTitle("Quản Lý Đơn Mua Hàng");
    } else if (location.pathname === "/danh-muc") {
      setTitle("Danh mục");
    }
  }, [location]);

  const handleLogin = useCallback(
    async (newToken: string, loginResponse?: any) => {
      localStorage.setItem("auth_token", newToken);
      setToken(newToken);

      // Save refresh token if available
      if (loginResponse?.refreshToken) {
        localStorage.setItem("refresh_token", loginResponse.refreshToken);
      }

      // Reset token warning when login successfully
      setShowTokenWarning(false);

      // Extract user info from login response
      const userInfo = loginResponse?.user;
      console.log(userInfo);

      if (userInfo) {
        const rawRole =
          typeof userInfo.role === "object"
            ? userInfo.role?.name
            : userInfo.role;
        const roleName = String(rawRole || "")
          .toLowerCase()
          .replace(/\s|-/g, "");
        // Check if role contains keywords (e.g. "employeegtg" contains "employee")
        const roleEnum = roleName.includes("superadmin")
          ? ROLE.SUPER_ADMIN
          : roleName.includes("factoryadmin")
            ? ROLE.FACTORY_ADMIN
            : roleName.includes("employeegtg")
              ? ROLE.EMPLOYEE_GTG
              : roleName.includes("employee")
                ? ROLE.EMPLOYEE
                : ROLE.USER;

        const normalizedUser: User = {
          ...userInfo,
          role: roleEnum,
        };
        setUser(normalizedUser);

        // Fetch employee info for ALL roles (including admins)
        // Admins are also employees and need their employee data
        try {
          const myEmp = await employeeApi.getMyEmployee();
          console.log("[Login] myEmp from API:", myEmp);
          if (myEmp) {
            // Save employee info to localStorage
            localStorage.setItem("employee_info", JSON.stringify(myEmp));

            // For EMPLOYEE and EMPLOYEE_GTG roles, also save permissions
            if (roleEnum === ROLE.EMPLOYEE || roleEnum === ROLE.EMPLOYEE_GTG) {
              // Merge permissions từ roleGroups + permissions cũ
              const merged = mergeEmployeePermissions(myEmp as any);
              const payload = {
                canAccessAdmin: merged.canAccessAdmin,
                adminMenuKeys: merged.adminMenuKeys,
                permissions: merged.permissions,
              };
              console.log(
                "[Login] Saving employee_permissions (merged):",
                payload,
              );
              localStorage.setItem(
                "employee_permissions",
                JSON.stringify(payload),
              );
            } else {
              // Admin roles don't need employee_permissions (they have full access)
              localStorage.removeItem("employee_permissions");
            }
          } else {
            localStorage.removeItem("employee_info");
            localStorage.removeItem("employee_permissions");
          }
        } catch (error) {
          console.error("Error fetching employee info:", error);
          localStorage.removeItem("employee_info");
          localStorage.removeItem("employee_permissions");
        }
      }

      // Luôn chuyển hướng về trang chủ sau khi đăng nhập
      navigate("/", { replace: true });
    },
    [navigate, setUser],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("employee_info");
    localStorage.removeItem("employee_permissions");
    setToken(null);
    logout();
    // Redirect to login page
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // Handle token expiration
  const handleTokenExpired = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const handleTokenExpiringSoon = useCallback(() => {
    setShowTokenWarning(true);
  }, []);

  // Handle token refresh
  const handleTokenRefresh = useCallback(
    async (refreshToken: string): Promise<boolean> => {
      try {
        const res = await authApi.refreshToken(refreshToken);

        if (!res?.token) {
          console.error("[TokenRefresh] Response missing token:", res);
          return false;
        }

        // Update tokens in localStorage
        localStorage.setItem("auth_token", res.token);
        setToken(res.token);

        if (res.refreshToken) {
          localStorage.setItem("refresh_token", res.refreshToken);
        }

        // Note: Refresh response doesn't include user object, user data remains unchanged
        return true;
      } catch (error: any) {
        console.error("[TokenRefresh] Failed to refresh token:", {
          message: error?.message,
          status: error?.status,
          data: error?.data,
        });
        return false;
      }
    },
    [],
  );

  // Set up token expiration monitoring with auto-refresh
  useTokenExpiration({
    onTokenExpired: handleTokenExpired,
    onTokenExpiringSoon: handleTokenExpiringSoon,
    onTokenRefresh: handleTokenRefresh,
    checkInterval: 30000, // Check every 30 seconds
    warningThreshold: 5, // Warn 5 minutes before expiration
    autoRefresh: true, // Enable automatic token refresh
  });

  // Set global logout function cho API client
  useEffect(() => {
    setGlobalLogout(handleLogout);
  }, [handleLogout]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  // Check both state and localStorage for more reliable auth check
  const hasAuth = token || localStorage.getItem("auth_token");
  if (!hasAuth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onSelectTitle={setTitle} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} title={title} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<RoleBasedDashboard />} />
            <Route path="/thong-bao" element={<AllNotifications />} />
            <Route
              path="/quan-ly/nha-may"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang quản lý nhà
                        máy.
                      </p>
                    </div>
                  }
                >
                  <FactoryManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/nha-may/tao-moi"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang tạo nhà máy.
                      </p>
                    </div>
                  }
                >
                  <FactoryForm />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/nha-may/:id/chinh-sua"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang chỉnh sửa nhà
                        máy.
                      </p>
                    </div>
                  }
                >
                  <FactoryForm />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/ket-noi-misa"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang quản lý kết
                        nối MISA.
                      </p>
                    </div>
                  }
                >
                  <MisaConnectionManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/don-hang-misa"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang đơn hàng MISA.
                      </p>
                    </div>
                  }
                >
                  <MisaOrderManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/don-hang-misa/:id"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập chi tiết đơn hàng
                        MISA.
                      </p>
                    </div>
                  }
                >
                  <MisaSalesOrderDetail />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/de-xuat-mua-hang"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang đề xuất mua
                        hàng.
                      </p>
                    </div>
                  }
                >
                  <AdminPurchaseRequisitions />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/de-xuat-mua-hang/:id"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập chi tiết đề xuất mua
                        hàng.
                      </p>
                    </div>
                  }
                >
                  <AdminPurchaseRequisitionDetail />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/yeu-cau-chung/:id"
              element={
                <SuperAdminOnly
                  fallback={<AdminOrEmployee><AdminGeneralRequestDetail /></AdminOrEmployee>}
                >
                  <AdminGeneralRequestDetail />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/yeu-cau-chung"
              element={
                <SuperAdminOnly
                  fallback={<AdminOrEmployee><AdminGeneralRequests /></AdminOrEmployee>}
                >
                  <AdminGeneralRequests />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/don-mua-hang"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang đơn mua hàng.
                      </p>
                    </div>
                  }
                >
                  <AdminPurchaseOrderManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/quan-ly/don-mua-hang/:id"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập chi tiết đơn mua
                        hàng.
                      </p>
                    </div>
                  }
                >
                  <AdminPurchaseOrderDetail />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý nhà
                        máy của tôi.
                      </p>
                    </div>
                  }
                >
                  <MyFactory />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/nhan-vien/tao-moi"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-employees"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang tạo nhân
                        viên.
                      </p>
                    </div>
                  }
                >
                  <EmployeeForm />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/nhan-vien/import"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-employees"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang import nhân
                        viên.
                      </p>
                    </div>
                  }
                >
                  <ImportEmployees />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/nhan-vien/:id"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-employees"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang chi tiết
                        nhân viên.
                      </p>
                    </div>
                  }
                >
                  <EmployeeDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/nhan-vien"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-employees"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý nhân
                        viên.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryEmployees />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/misa-orders/:id"
              element={
                <FactoryAdminOnly
                  menuKey="misa-order"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang chi tiết đơn hàng
                        MISA.
                      </p>
                    </div>
                  }
                >
                  <MisaOrderDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/misa-orders"
              element={
                <FactoryAdminOnly
                  menuKey="misa-order"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang quản lý đơn hàng MISA.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryMisaOrders />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/purchase-orders/:id"
              element={
                <FactoryAdminOnly
                  menuKey="purchase-order"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang chi tiết đơn mua hàng.
                      </p>
                    </div>
                  }
                >
                  <PurchaseOrderDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/purchase-orders"
              element={
                <FactoryAdminOnly
                  menuKey="purchase-order"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang quản lý đơn mua hàng.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryPurchaseOrders />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/purchase-requisitions/:id"
              element={
                <FactoryAdminOnly
                  menuKey="purchase-requisition"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang chi tiết đề xuất mua
                        hàng.
                      </p>
                    </div>
                  }
                >
                  <PurchaseRequisitionDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/purchase-requisitions"
              element={
                <FactoryAdminOnly
                  menuKey="purchase-requisition"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Bạn không có quyền truy cập trang quản lý đề xuất mua
                        hàng.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryPurchaseRequisitions />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/du-lieu-cham-cong"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-list"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý chấm
                        công.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryAttendance />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/quan-ly-phep"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-leave-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý
                        phép.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryLeaveManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/quan-ly-tang-ca"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-overtime-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý tăng
                        ca.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryOvertimeManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/gop-y"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-feedback-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý góp
                        ý.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryFeedbackManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-den-nha-may"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-arrival-report-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý báo
                        đến nhà máy.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryArrivalReportManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-may-hong"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-maintenance-report-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý báo
                        máy hỏng.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryMaintenanceReportManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-qua-dem"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-overnight-report-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý báo
                        qua đêm.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryOvernightReportManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-ho-tro"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-support-request-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý báo
                        hỗ trợ.
                      </p>
                    </div>
                  }
                >
                  <MyFactorySupportRequestManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-ho-tro/tao-moi"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-support-request-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể tạo yêu cầu hỗ trợ.
                      </p>
                    </div>
                  }
                >
                  <CreateSupportRequest />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/bao-ho-tro/tao"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-support-request-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể tạo yêu cầu hỗ trợ.
                      </p>
                    </div>
                  }
                >
                  <CreateSupportRequest />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/quan-ly-tang-ca-hang-loat"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-bulk-overtime-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý tăng
                        ca hàng loạt.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryBulkOvertimeManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/tao-don-tang-ca-hang-loat"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-bulk-overtime-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang tạo đơn tăng
                        ca hàng loạt.
                      </p>
                    </div>
                  }
                >
                  <CreateBulkOvertimeRequest />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/don-tang-ca-hang-loat/:id"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-attendance-bulk-overtime-management"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang chi tiết đơn
                        tăng ca hàng loạt.
                      </p>
                    </div>
                  }
                >
                  <EditBulkOvertimeRequest />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/san-xuat-hang-ngay"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-daily-production"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang sản xuất
                        hàng ngày.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryDailyProduction />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/chi-tiet-san-xuat/:employeeId"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-daily-production"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang chi tiết sản
                        xuất.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryProductionDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/phong-ban"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-departments"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý
                        phòng ban.
                      </p>
                    </div>
                  }
                >
                  <DepartmentManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/vi-tri"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-positions"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý vị
                        trí.
                      </p>
                    </div>
                  }
                >
                  <PositionManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/to"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-teams"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý tổ.
                      </p>
                    </div>
                  }
                >
                  <TeamManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/tin-nhan"
              element={
                <FactoryAdminOnly
                  menuKey="message"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang gửi tin
                        nhắn.
                      </p>
                    </div>
                  }
                >
                  <MessageManagement />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="admin/zalo-oa"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang quản lý Zalo
                        OA.
                      </p>
                    </div>
                  }
                >
                  <ZaloOAManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/zalo-oa"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-zalo-oa"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang quản lý Zalo
                        OA của nhà máy.
                      </p>
                    </div>
                  }
                >
                  <MyFactoryZaloOA />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/cau-hinh"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-settings"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang cấu hình nhà
                        máy.
                      </p>
                    </div>
                  }
                >
                  <MyFactorySettings />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/nha-may-cua-toi/nhom-phan-quyen/:id"
              element={
                <FactoryAdminOnly
                  menuKey="my-factory-settings"
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Factory Admin mới có thể truy cập trang này.
                      </p>
                    </div>
                  }
                >
                  <RoleGroupDetail />
                </FactoryAdminOnly>
              }
            />
            <Route
              path="/danh-muc"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang danh mục.
                      </p>
                    </div>
                  }
                >
                  <CategoryManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/danh-muc-san-pham"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang danh mục.
                      </p>
                    </div>
                  }
                >
                  <ProductCategoryManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/danh-sach-san-pham"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang danh mục.
                      </p>
                    </div>
                  }
                >
                  <ProductManagement />
                </SuperAdminOnly>
              }
            />
            <Route
              path="/danh-sach-bao-gia"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang danh mục.
                      </p>
                    </div>
                  }
                >
                  <QuoteManagement />
                  {/* <PrintTemplate
                    customerName="vinh"
                    items={[{ name: "sp1", unitPrice: 5000 }]}
                    totalPrice={20000}
                  /> */}
                </SuperAdminOnly>
              }
            />
            <Route
              path="/form-bao-gia"
              element={
                <SuperAdminOnly
                  fallback={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Không có quyền truy cập
                      </h2>
                      <p className="text-gray-500">
                        Chỉ Super Admin mới có thể truy cập trang danh mục.
                      </p>
                    </div>
                  }
                >
                  <PrintTemplate />
                </SuperAdminOnly>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Token Expiration Notification */}
      <TokenExpirationNotification
        isVisible={showTokenWarning}
        onDismiss={() => setShowTokenWarning(false)}
        onRefresh={() => {
          setShowTokenWarning(false);
          handleLogout();
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router basename="/admin">
              <AppContent />
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
