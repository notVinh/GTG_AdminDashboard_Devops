import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Plus,
  SlidersHorizontalIcon,
  PanelTopCloseIcon,
  Search,
} from "lucide-react";

// Import Components từ UI kit của bạn
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import Pagination from "../../components/commons/Pagination";
import ProductionInputModal from "../../components/ProductionInputModal";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPESCRIPT) ---
interface ProductTranslation {
  languageCode: string;
  name: string;
  description?: string;
}

interface Product {
  id: number;
  inventoryItemName: string; // Tên hiển thị từ DB cũ
  unitPrice: number;
  createdAt: string;
  image?: string;
  translations?: ProductTranslation[];
  // Thêm các trường khác nếu API của bạn trả về
}

const API_URL = import.meta.env.VITE_API_URL;

export default function MyFactoryProduct() {
  // --- STATES ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // --- LOGIC FETCH DATA ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Gọi API với phân trang và tìm kiếm
      const res = await axios.get(`${API_URL}/products`, {
        params: {
          page,
          limit,
          search: searchTerm,
        },
      });

      // Mapping dữ liệu tùy theo cấu trúc trả về của Backend (thường là res.data.data)
      const rawData = res.data?.data?.data || res.data?.data || [];
      const total = res.data?.data?.total || 0;

      setProducts(rawData);
      setTotalItems(total);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lại mỗi khi trang hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce 300ms để tránh gọi API liên tục khi gõ phím
    return () => clearTimeout(delayDebounce);
  }, [page, limit, searchTerm]);

  // --- HANDLERS ---
  const handleViewDetail = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setCurrentProduct(product);
      setSelectedProductId(id);
    }
  };

  const statusBadge = (status: string) => {
    const styles = "px-2 py-1 rounded text-[10px] font-black uppercase";
    return (
      <span className={`${styles} bg-green-100 text-green-700`}>{status}</span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            Hệ thống Sản phẩm
          </h1>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto font-bold rounded-xl shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="relative">
            <SlidersHorizontalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
            <div className="pl-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="pl-10 bg-slate-50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mặc định</SelectItem>
                  <SelectItem value="price_asc">Giá (Thấp - Cao)</SelectItem>
                  <SelectItem value="price_desc">Giá (Cao - Thấp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <Checkbox
              id="published"
              checked={isPublished}
              onCheckedChange={(v) => setIsPublished(!!v)}
            />
            <label
              htmlFor="published"
              className="text-sm font-bold text-slate-600 cursor-pointer"
            >
              Chỉ hiện sản phẩm đang bán
            </label>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Đơn giá
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-700 uppercase text-sm italic">
                        {p.inventoryItemName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        ID: #{p.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {p.unitPrice?.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {statusBadge("Active")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetail(p.id)}
                        className="rounded-lg hover:bg-primary hover:text-white"
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
          <Pagination
            page={page}
            limit={limit}
            total={totalItems}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Product Detail Modal */}
      {/* {currentProduct && (
        <ProductionInputModal
          open={!!selectedProductId}
          onClose={() => {
            setSelectedProductId(null);
            setCurrentProduct(null);
          }}
          title="Thông tin chi tiết sản phẩm"
          itemData={currentProduct}
        />
      )} */}

      {/* Create Product Modal - Cần tạo component CreateProductModal riêng */}
      {/* {showCreateModal && <CreateProductModal ... />} */}
    </div>
  );
}
