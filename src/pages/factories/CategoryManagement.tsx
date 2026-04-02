import { useState, useEffect, useCallback } from "react";
import { Users, Package, RefreshCw, Warehouse, X } from "lucide-react";
import { misaCustomerApi, type MisaCustomer } from "../../api/misa-customer";
import {
  misaDataSourceApi,
  type MisaProduct,
  type MisaStock,
  type MisaInventoryBalance,
} from "../../api/misa-data-source";
import { Pagination } from "../../components/commons/Pagination";
import { MisaSearchBar } from "../../components/commons/MisaSearchBar";

type TabType = "customers" | "products" | "stocks";

export default function CategoryManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("customers");
  const [customers, setCustomers] = useState<MisaCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Products state
  const [products, setProducts] = useState<MisaProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsSyncing, setProductsSyncing] = useState(false);
  const [productsSyncMessage, setProductsSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [productsSearch, setProductsSearch] = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(20);
  const [productsTotal, setProductsTotal] = useState(0);

  // Stocks state
  const [stocks, setStocks] = useState<MisaStock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksSyncing, setStocksSyncing] = useState(false);
  const [stocksSyncMessage, setStocksSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [stocksSearch, setStocksSearch] = useState("");
  const [stocksPage, setStocksPage] = useState(1);
  const [stocksLimit, setStocksLimit] = useState(20);
  const [stocksTotal, setStocksTotal] = useState(0);

  // Inventory balance state
  const [selectedStock, setSelectedStock] = useState<MisaStock | null>(null);
  const [inventoryBalance, setInventoryBalance] = useState<
    MisaInventoryBalance[]
  >([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await misaCustomerApi.getCustomers({
        page,
        limit,
        search,
      });
      setCustomers(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const result = await misaDataSourceApi.getProducts(
        productsPage,
        productsLimit,
        productsSearch,
      );
      setProducts(result.data);
      setProductsTotal(result.total);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  }, [productsPage, productsLimit, productsSearch]);

  const fetchInventoryBalance = useCallback(async (stockId: string) => {
    setInventoryLoading(true);
    try {
      const data = await misaDataSourceApi.getInventoryBalance(stockId);
      setInventoryBalance(data || []);
    } catch (error) {
      console.error("Error fetching inventory balance:", error);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    setStocksLoading(true);
    try {
      const result = await misaDataSourceApi.getStocks(
        stocksPage,
        stocksLimit,
        stocksSearch,
      );
      setStocks(result.data);
      setStocksTotal(result.total);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setStocksLoading(false);
    }
  }, [stocksPage, stocksLimit, stocksSearch]);

  const handleStockClick = (stock: MisaStock) => {
    if (selectedStock?.id === stock.id) {
      setSelectedStock(null);
      setInventoryBalance([]);
      setInventorySearch("");
    } else {
      setSelectedStock(stock);
      setInventorySearch("");
      fetchInventoryBalance(stock.stockId);
    }
  };

  const filteredInventory = inventoryBalance.filter((item) => {
    if (!inventorySearch) return true;
    const searchLow = inventorySearch.toLowerCase();
    return (
      item.inventoryItemCode.toLowerCase().includes(searchLow) ||
      item.inventoryItemName.toLowerCase().includes(searchLow)
    );
  });

  useEffect(() => {
    if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "stocks") {
      fetchStocks();
    }
  }, [activeTab, fetchCustomers, fetchProducts, fetchStocks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleProductsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setProductsPage(1);
    fetchProducts();
  };

  const handleProductsLimitChange = (newLimit: number) => {
    setProductsLimit(newLimit);
    setProductsPage(1);
  };

  const handleStocksSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setStocksPage(1);
    fetchStocks();
  };

  const handleStocksLimitChange = (newLimit: number) => {
    setStocksLimit(newLimit);
    setStocksPage(1);
  };

  const handleSyncStocks = async () => {
    setStocksSyncing(true);
    setStocksSyncMessage(null);
    try {
      const dataSource = await misaDataSourceApi.getByCode("stock");
      if (!dataSource) {
        setStocksSyncMessage({
          type: "error",
          text: "Không tìm thấy nguồn dữ liệu kho. Vui lòng tạo trong trang Quản lý kết nối MISA.",
        });
        return;
      }
      const result = (await misaDataSourceApi.startSync(dataSource.id)) as any;
      if (result.success) {
        const stats = result.syncStats;
        let message = `Kéo ${result.total || 0} bản ghi`;
        if (stats) {
          message = `Tổng: ${result.total || 0} | Mới: ${stats.created} | Cập nhật: ${stats.updated} | Không đổi: ${stats.unchanged}`;
          if (stats.errors > 0) {
            message += ` | Lỗi: ${stats.errors}`;
          }
        }
        setStocksSyncMessage({ type: "success", text: message });
        setStocksPage(1);
        fetchStocks();
      } else {
        setStocksSyncMessage({
          type: "error",
          text: result.message || "Kéo dữ liệu thất bại",
        });
      }
    } catch (error: any) {
      setStocksSyncMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi kéo dữ liệu",
      });
    } finally {
      setStocksSyncing(false);
    }
  };

  const handleSyncProducts = async () => {
    setProductsSyncing(true);
    setProductsSyncMessage(null);
    try {
      const dataSource = await misaDataSourceApi.getByCode("product");
      if (!dataSource) {
        setProductsSyncMessage({
          type: "error",
          text: "Không tìm thấy nguồn dữ liệu sản phẩm",
        });
        return;
      }
      const result = (await misaDataSourceApi.startSync(dataSource.id)) as any;
      if (result.success) {
        // Hiển thị chi tiết sync stats
        const stats = result.syncStats;
        let message = `Kéo ${result.total || 0} bản ghi`;
        if (stats) {
          message = `Tổng: ${result.total || 0} | Mới: ${stats.created} | Cập nhật: ${stats.updated} | Không đổi: ${stats.unchanged}`;
          if (stats.errors > 0) {
            message += ` | Lỗi: ${stats.errors}`;
          }
        }
        setProductsSyncMessage({ type: "success", text: message });
        setProductsPage(1);
        fetchProducts();
      } else {
        setProductsSyncMessage({
          type: "error",
          text: result.message || "Kéo dữ liệu thất bại",
        });
      }
    } catch (error: any) {
      setProductsSyncMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi kéo dữ liệu",
      });
    } finally {
      setProductsSyncing(false);
    }
  };

  const handleSyncCustomers = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // Get customer data source by code
      const dataSource = await misaDataSourceApi.getByCode("customer");
      if (!dataSource) {
        setSyncMessage({
          type: "error",
          text: "Không tìm thấy nguồn dữ liệu khách hàng",
        });
        return;
      }
      // Start sync
      const result = (await misaDataSourceApi.startSync(dataSource.id)) as any;
      if (result.success) {
        // Hiển thị chi tiết sync stats
        const stats = result.syncStats;
        let message = `Kéo ${result.total || 0} bản ghi`;
        if (stats) {
          message = `Tổng: ${result.total || 0} | Mới: ${stats.created} | Cập nhật: ${stats.updated} | Không đổi: ${stats.unchanged}`;
          if (stats.errors > 0) {
            message += ` | Lỗi: ${stats.errors}`;
          }
        }
        setSyncMessage({ type: "success", text: message });
        // Refresh customer list
        setPage(1);
        fetchCustomers();
      } else {
        setSyncMessage({
          type: "error",
          text: result.message || "Kéo dữ liệu thất bại",
        });
      }
    } catch (error: any) {
      setSyncMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi kéo dữ liệu",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "customers"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Khách hàng
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "products"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Package className="w-4 h-4" />
          Sản phẩm
        </button>
        <button
          onClick={() => setActiveTab("stocks")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "stocks"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          Kho
        </button>
      </div>

      {/* Content */}
      {activeTab === "customers" && (
        <div className="flex-1 flex flex-col min-h-0">
          <MisaSearchBar
            placeholder="Tìm theo mã, tên, điện thoại..."
            value={search}
            onChange={setSearch}
            onSearch={handleSearch}
            onRefresh={fetchCustomers}
            onSync={handleSyncCustomers}
            loading={loading}
            syncing={syncing}
            className="mb-4"
          />

          {/* Sync message */}
          {syncMessage && (
            <div
              className={`mb-2 px-4 py-2 rounded-lg text-sm flex-shrink-0 ${
                syncMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {syncMessage.text}
              <button
                onClick={() => setSyncMessage(null)}
                className="ml-2 font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header with total */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">
                Tổng: <span className="text-blue-600 font-bold">{total}</span>{" "}
                khách hàng
              </span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="min-w-max w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 left-0 bg-gray-50 z-30 border-r border-gray-200">
                      Mã KH
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 left-[100px] bg-gray-50 z-30 max-w-[200px] border-r border-gray-200">
                      Tên khách hàng
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Địa chỉ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      MST/CCCD
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Điện thoại
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Quốc gia
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Tỉnh/TP
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Quận/Huyện
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Xã/Phường
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Người liên hệ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      ĐT di động NLH
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Email NLH
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Người đại diện PL
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Người nhận HĐ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      ĐT người nhận HĐ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Email người nhận HĐ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Địa điểm giao hàng
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20">
                      Loại
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={18}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Đang tải...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={18}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu khách hàng. Vui lòng sync từ MISA.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 min-w-[100px]">
                          {customer.accountObjectCode}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 min-w-[150px] max-w-[300px] break-words sticky left-[100px] bg-white z-10 border-r border-gray-200">
                          {customer.accountObjectName}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[150px] max-w-[250px] break-words border-r border-gray-200">
                          {customer.address || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.taxCode || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.tel || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[80px] break-words border-r border-gray-200">
                          {customer.country || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.provinceOrCity || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.district || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.wardOrCommune || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[120px] break-words border-r border-gray-200">
                          {customer.contactName || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.contactMobile || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[150px] break-words border-r border-gray-200">
                          {customer.contactEmail || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[120px] break-words border-r border-gray-200">
                          {customer.legalRepresentative || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[120px] break-words border-r border-gray-200">
                          {customer.invoiceReceiver || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[100px] break-words border-r border-gray-200">
                          {customer.invoiceReceiverPhone || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[150px] break-words border-r border-gray-200">
                          {customer.invoiceReceiverEmail || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[150px] max-w-[250px] break-words border-r border-gray-200">
                          {customer.shippingAddresses &&
                          customer.shippingAddresses.length > 0
                            ? customer.shippingAddresses
                                .map((a) => a.location_name)
                                .filter(Boolean)
                                .join(", ") || "-"
                            : "-"}
                        </td>
                        <td className="px-3 py-3 text-sm min-w-[80px]">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              customer.accountObjectType === 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {customer.accountObjectType === 0
                              ? "Cá nhân"
                              : "Tổ chức"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
              className="flex-shrink-0"
            />
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="flex-1 flex flex-col min-h-0">
          <MisaSearchBar
            placeholder="Tìm theo mã, tên sản phẩm..."
            value={productsSearch}
            onChange={setProductsSearch}
            onSearch={handleProductsSearch}
            onRefresh={fetchProducts}
            onSync={handleSyncProducts}
            loading={productsLoading}
            syncing={productsSyncing}
            className="mb-4"
          />

          {/* Sync message */}
          {productsSyncMessage && (
            <div
              className={`mb-2 px-4 py-2 rounded-lg text-sm flex-shrink-0 ${
                productsSyncMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {productsSyncMessage.text}
              <button
                onClick={() => setProductsSyncMessage(null)}
                className="ml-2 font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header with total */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">
                Tổng:{" "}
                <span className="text-blue-600 font-bold">{productsTotal}</span>{" "}
                sản phẩm
              </span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="min-w-max w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 left-0 bg-gray-50 z-30 border-r border-gray-200 min-w-[120px]">
                      Mã SP
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 left-[120px] bg-gray-50 z-30 border-r border-gray-200 min-w-[250px]">
                      Tên sản phẩm
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      ĐVT
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Giá mua
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Giá bán
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Tồn kho
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Giá trị tồn
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Nhóm SP
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20 border-r border-gray-200">
                      Nguồn gốc
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-20">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productsLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Đang tải...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu sản phẩm. Vui lòng sync từ MISA.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 min-w-[120px]">
                          {product.inventoryItemCode}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 min-w-[250px] max-w-[350px] sticky left-[120px] bg-white z-10 border-r border-gray-200">
                          <div
                            className="truncate"
                            title={product.inventoryItemName}
                          >
                            {product.inventoryItemName}
                          </div>
                          {product.saleDescription &&
                            product.saleDescription !==
                              product.inventoryItemName && (
                              <div
                                className="text-xs text-gray-500 truncate"
                                title={product.saleDescription || ""}
                              >
                                {product.saleDescription}
                              </div>
                            )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200">
                          {product.unitName || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-right whitespace-nowrap border-r border-gray-200 font-mono">
                          {Number(product.unitPrice).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-right whitespace-nowrap border-r border-gray-200 font-mono">
                          {Number(product.salePrice1).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-right whitespace-nowrap border-r border-gray-200 font-mono">
                          {Number(product.closingQuantity).toLocaleString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-right whitespace-nowrap border-r border-gray-200 font-mono">
                          {Number(product.closingAmount).toLocaleString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 min-w-[150px] max-w-[200px] border-r border-gray-200">
                          <div
                            className="truncate"
                            title={product.inventoryItemCategoryNameList || ""}
                          >
                            {product.inventoryItemCategoryNameList
                              ?.split(";")
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200">
                          {product.inventoryItemSource || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          {product.inactive ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Ngừng KD
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Hoạt động
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              page={productsPage}
              limit={productsLimit}
              total={productsTotal}
              onPageChange={setProductsPage}
              onLimitChange={handleProductsLimitChange}
              className="flex-shrink-0"
            />
          </div>
        </div>
      )}

      {activeTab === "stocks" && (
        <div className="flex-1 flex flex-col min-h-0">
          <MisaSearchBar
            placeholder="Tìm theo mã, tên kho..."
            value={stocksSearch}
            onChange={setStocksSearch}
            onSearch={handleStocksSearch}
            onRefresh={fetchStocks}
            onSync={handleSyncStocks}
            loading={stocksLoading}
            syncing={stocksSyncing}
            className="mb-4"
          />

          {/* Sync message */}
          {stocksSyncMessage && (
            <div
              className={`mb-2 px-4 py-2 rounded-lg text-sm flex-shrink-0 ${
                stocksSyncMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {stocksSyncMessage.text}
              <button
                onClick={() => setStocksSyncMessage(null)}
                className="ml-2 font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            <div
              className={`bg-white rounded-lg border border-gray-200 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${
                selectedStock ? "w-2/3" : "w-full"
              }`}
            >
              {/* Header with total */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  Tổng:{" "}
                  <span className="text-blue-600 font-bold">{stocksTotal}</span>{" "}
                  kho
                </span>
              </div>
              <div className="overflow-auto flex-1">
                <table className="min-w-max w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 min-w-[120px] bg-gray-50">
                        Mã kho
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 min-w-[200px] bg-gray-50">
                        Tên kho
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 bg-gray-50">
                        Mô tả
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                        Chi nhánh
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                        TK kho
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stocksLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Đang tải...
                        </td>
                      </tr>
                    ) : stocks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Chưa có dữ liệu kho. Vui lòng tạo nguồn dữ liệu
                          "stock" và sync từ MISA.
                        </td>
                      </tr>
                    ) : (
                      stocks.map((stock) => (
                        <tr
                          key={stock.id}
                          className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedStock?.id === stock.id ? "bg-blue-100" : ""
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                          <td className="px-3 py-3 text-sm font-medium border-r border-gray-200">
                            {stock.stockCode}
                          </td>
                          <td className="px-3 py-3 text-sm border-r border-gray-200">
                            <div className="truncate" title={stock.stockName}>
                              {stock.stockName}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-200">
                            <div
                              className="truncate"
                              title={stock.description || ""}
                            >
                              {stock.description || "-"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-200">
                            <div
                              className="truncate"
                              title={stock.branchName || ""}
                            >
                              {stock.branchName || "-"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-mono">
                            {stock.inventoryAccount || "-"}
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            {stock.inactive ? (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Ngừng sử dụng
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Hoạt động
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                page={stocksPage}
                limit={stocksLimit}
                total={stocksTotal}
                onPageChange={setStocksPage}
                onLimitChange={handleStocksLimitChange}
                className="flex-shrink-0"
              />
            </div>

            {/* Sidebar Detail Panel */}
            {selectedStock && (
              <div className="w-[450px] bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 shadow-lg shrink-0">
                <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Warehouse className="w-5 h-5 flex-shrink-0" />
                    <div className="truncate">
                      <h3 className="font-bold text-xs uppercase tracking-wide truncate">
                        Tồn kho: {selectedStock.stockName}
                      </h3>
                      <p className="text-[10px] opacity-80 uppercase">
                        {selectedStock.stockCode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStock(null);
                      setInventorySearch("");
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                    title="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Local Search for Inventory */}
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm mã hoặc tên vật tư..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    {inventorySearch && (
                      <button
                        onClick={() => setInventorySearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200 min-w-[120px]">
                          Vật tư
                        </th>
                        <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200">
                          Đầu kỳ
                        </th>
                        <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200">
                          Nhập
                        </th>
                        <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200">
                          Xuất
                        </th>
                        <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200">
                          Cuối kỳ
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                          Loại
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventoryLoading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-12 text-center text-gray-500"
                          >
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                            Đang tải...
                          </td>
                        </tr>
                      ) : filteredInventory.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-gray-500 italic"
                          >
                            {inventorySearch
                              ? "Không tìm thấy vật tư phù hợp."
                              : "Không có tồn kho."}
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item, idx) => (
                          <tr
                            key={`${item.inventoryItemId}-${idx}`}
                            className="hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="px-3 py-2 text-xs border-r border-gray-200">
                              <div className="font-semibold text-gray-900 line-clamp-1">
                                {item.inventoryItemCode}
                              </div>
                              <div className="text-[10px] text-gray-500 line-clamp-1">
                                {item.inventoryItemName}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-xs text-right font-mono text-gray-600 border-r border-gray-200 align-top">
                              {Math.floor(item.openingQuantity || 0)}
                            </td>
                            <td className="px-2 py-2 text-xs text-right font-mono text-gray-600 border-r border-gray-200 align-top">
                              {Math.floor(item.totalInQuantity || 0)}
                            </td>
                            <td className="px-2 py-2 text-xs text-right font-mono text-gray-600 border-r border-gray-200 align-top">
                              {Math.floor(item.totalOutQuantity || 0)}
                            </td>
                            <td className="px-2 py-2 text-xs text-right font-mono text-gray-600 border-r border-gray-200 align-top">
                              {Math.floor(item.closingQuantity || 0)}
                            </td>
                            <td className="px-3 py-2 text-xs text-right font-mono font-bold text-blue-700 align-top">
                              <div>
                                {item.balanceQuantity?.toLocaleString("vi-VN")}
                              </div>
                              <div className="text-[9px] text-gray-400 font-normal">
                                {item.unitName || "-"}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!inventoryLoading && filteredInventory.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                    <span className="text-[10px] text-gray-500">
                      Hiển thị {filteredInventory.length} mặt hàng
                      {inventorySearch && ` (lọc từ ${inventoryBalance.length})`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
