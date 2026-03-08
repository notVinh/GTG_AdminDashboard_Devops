import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
} from "lucide-react";
import { factoriesApi } from "../../api/factories";
import type { FactoryItem } from "../../types";
import Pagination from "../../components/commons/Pagination";
import { useLoading } from "../../contexts/LoadingContext";

export default function FactoryManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FactoryItem[]>([]);
  const { showLoading, hideLoading } = useLoading();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const formatWorkDays = (workDays?: number[]) => {
    if (!workDays || workDays.length === 0) return "Chưa cấu hình";
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return workDays.map((day) => dayNames[day]).join(", ");
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        showLoading("Đang tải danh sách nhà máy...");
        const res = await factoriesApi.list(page, limit, searchTerm);
        if (isMounted) {
          setItems(res.data);
          setTotal(res.meta?.total || res.data.length || 0);
        }
      } finally {
        if (isMounted) {
          hideLoading();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [page, limit, searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">Quản lý nhà máy</h1>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-muted-foreground">Tổng:</span>
          <span className="font-medium">{total}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà máy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
              <Filter className="h-4 w-4" />
              Lọc
            </button>
            <button
              onClick={() => navigate("/quan-ly/nha-may/tao-moi")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Tạo nhà máy mới
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y">
          {items.map((factory) => (
            <div key={factory.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{factory.name}</div>
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{factory.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{factory.address || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Tối đa: {factory.maxEmployees ?? "-"}</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">
                      Tạo:{" "}
                      {factory.createdAt
                        ? new Date(factory.createdAt).toLocaleString("vi-VN")
                        : "-"}
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600">Ngày làm việc: </span>
                      <span className="font-medium text-gray-700">
                        {formatWorkDays(factory.workDays)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/quan-ly/nha-may/${factory.id}/chinh-sua`)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="p-6 text-center text-sm text-gray-500">
              {searchTerm
                ? "Không tìm thấy nhà máy nào phù hợp"
                : "Chưa có nhà máy nào"}
            </div>
          )}
        </div>
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
