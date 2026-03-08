import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  ChevronDown,
  Package,
  User,
} from "lucide-react";
import {
  misaDataSourceApi,
  type MisaCustomer,
  type MisaProduct,
  type ManualOrderDetail,
  type CreateManualOrderData,
} from "../api/misa-data-source";
import { useToast } from "../contexts/ToastContext";

type ManualOrderFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerData?: any;
};

export default function ManualOrderForm({
  isOpen,
  onClose,
  onSuccess,
  customerData,
}: ManualOrderFormProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateManualOrderData>>({
    refNo: "",
    refDate: new Date().toISOString().split("T")[0],
    journalMemo: "",
    requestedDeliveryDate: "",
    goodsStatus: "",
    machineType: "",
    region: "",
    priority: "",
    saleType: "",
    receiverName: customerData?.customerName || "",
    receiverPhone: customerData?.customerPhone || "",
    specificAddress: customerData?.customerAddress || "",
  });

  // Order details (products)
  const [orderDetails, setOrderDetails] = useState<ManualOrderDetail[]>([]);

  // Customer selection
  const [customers, setCustomers] = useState<MisaCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MisaCustomer | null>(
    null,
  );

  // Product selection
  const [products, setProducts] = useState<MisaProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Options
  const machineTypeOptions = ["Máy mới", "Máy cũ"];
  const regionOptions = ["Miền Bắc", "Miền Trung", "Miền Nam"];
  const priorityOptions = ["Thường", "Gấp", "Rất Gấp"];
  const saleTypeOptions = ["Bán", "Cho thuê", "Cho mượn", "Đổi"];

  // Fetch customers
  const fetchCustomers = useCallback(async (search: string) => {
    setLoadingCustomers(true);
    try {
      const result = await misaDataSourceApi.getCustomers(
        1,
        20,
        search || undefined,
      );
      setCustomers(result.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (search: string) => {
    setLoadingProducts(true);
    try {
      const result = await misaDataSourceApi.getProducts(
        1,
        20,
        search || undefined,
      );
      setProducts(result.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Debounced search for customers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCustomerDropdown) {
        fetchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, showCustomerDropdown, fetchCustomers]);

  // Debounced search for products
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showProductDropdown) {
        fetchProducts(productSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, showProductDropdown, fetchProducts]);

  // Select customer
  const handleSelectCustomer = (customer: MisaCustomer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      accountObjectId: customer.accountObjectId,
      accountObjectCode: customer.accountObjectCode,
      accountObjectName: customer.accountObjectName,
      accountObjectAddress: customer.address || "",
      accountObjectTaxCode: customer.taxCode || "",
    }));
    setShowCustomerDropdown(false);
    setCustomerSearch("");
  };

  // Add product to order details
  const handleAddProduct = (product: MisaProduct) => {
    // Check if already added
    const exists = orderDetails.find(
      (d) => d.inventoryItemCode === product.inventoryItemCode,
    );
    if (exists) {
      toast.warning(`Sản phẩm ${product.inventoryItemCode} đã được thêm`);
      return;
    }

    setOrderDetails((prev) => [
      ...prev,
      {
        inventoryItemCode: product.inventoryItemCode,
        description: product.inventoryItemName,
        unitName: product.unitName || "",
        quantity: 1,
        unitPrice: product.salePrice1 || product.unitPrice || 0,
        vatRate: 0,
      },
    ]);
    setShowProductDropdown(false);
    setProductSearch("");
  };

  // Update order detail
  const handleUpdateDetail = (
    index: number,
    field: keyof ManualOrderDetail,
    value: string | number,
  ) => {
    setOrderDetails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  // Remove order detail
  const handleRemoveDetail = (index: number) => {
    setOrderDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate total
  const calculateTotal = () => {
    return orderDetails.reduce((sum, item) => {
      const amount = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + amount;
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      refNo: "",
      refDate: new Date().toISOString().split("T")[0],
      journalMemo: "",
      requestedDeliveryDate: "",
      goodsStatus: "",
      machineType: "",
      region: "",
      priority: "",
      saleType: "",
      receiverName: "",
      receiverPhone: "",
      specificAddress: "",
    });
    setOrderDetails([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.refNo?.trim()) {
      toast.error("Vui lòng nhập số đơn hàng");
      return;
    }

    setLoading(true);
    try {
      const data: CreateManualOrderData = {
        refNo: formData.refNo!,
        refDate: formData.refDate || undefined,
        accountObjectId: formData.accountObjectId || undefined,
        accountObjectName: formData.accountObjectName || undefined,
        accountObjectCode: formData.accountObjectCode || undefined,
        accountObjectAddress: formData.accountObjectAddress || undefined,
        accountObjectTaxCode: formData.accountObjectTaxCode || undefined,
        journalMemo: formData.journalMemo || undefined,
        requestedDeliveryDate: formData.requestedDeliveryDate || undefined,
        goodsStatus: formData.goodsStatus || undefined,
        machineType: formData.machineType || undefined,
        region: formData.region || undefined,
        priority: formData.priority || undefined,
        saleType: formData.saleType || undefined,
        receiverName: formData.receiverName || undefined,
        receiverPhone: formData.receiverPhone || undefined,
        specificAddress: formData.specificAddress || undefined,
        details: orderDetails.length > 0 ? orderDetails : undefined,
      };

      const result = await misaDataSourceApi.createManualOrder(data);
      if (result.success) {
        toast.success(result.message || "Tạo đơn hàng thành công");
        resetForm();
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Close handler
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Tạo đơn hàng thủ công
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
          {/* Basic Info */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Thông tin đơn hàng
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Số đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.refNo || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, refNo: e.target.value }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="VD: DH1234"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Ngày đơn hàng
                </label>
                <input
                  type="date"
                  value={formData.refDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      refDate: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Ngày yêu cầu giao
                </label>
                <input
                  type="date"
                  value={formData.requestedDeliveryDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requestedDeliveryDate: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={formData.priority || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn --</option>
                  {priorityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Phân loại máy
                </label>
                <select
                  value={formData.machineType || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      machineType: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn --</option>
                  {machineTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Loại bán/cho thuê
                </label>
                <select
                  value={formData.saleType || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      saleType: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn --</option>
                  {saleTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Khu vực
                </label>
                <select
                  value={formData.region || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, region: e.target.value }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn --</option>
                  {regionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Diễn giải/Ghi chú
                </label>
                <input
                  type="text"
                  value={formData.journalMemo || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      journalMemo: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <User className="w-4 h-4" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 relative">
                <label className="block text-xs text-gray-600 mb-1">
                  Khách hàng
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      selectedCustomer
                        ? `${selectedCustomer.accountObjectCode} - ${selectedCustomer.accountObjectName}`
                        : customerSearch
                    }
                    onChange={(e) => {
                      if (selectedCustomer) {
                        setSelectedCustomer(null);
                        setFormData((prev) => ({
                          ...prev,
                          accountObjectId: undefined,
                          accountObjectCode: undefined,
                          accountObjectName: undefined,
                          accountObjectAddress: undefined,
                          accountObjectTaxCode: undefined,
                        }));
                      }
                      setCustomerSearch(e.target.value);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                    placeholder="Tìm khách hàng theo mã hoặc tên..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {loadingCustomers ? (
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Customer Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-auto">
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <div className="text-xs font-medium text-gray-500">
                        {loadingCustomers ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Đang tìm kiếm...
                          </span>
                        ) : (
                          `Tìm thấy ${customers.length} khách hàng`
                        )}
                      </div>
                    </div>
                    {customers.length === 0 && !loadingCustomers ? (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        Không tìm thấy khách hàng. Thử từ khóa khác.
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-600">
                              {customer.accountObjectCode}
                            </span>
                            {customer.taxCode && (
                              <span className="text-xs text-gray-400">
                                MST: {customer.taxCode}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-800 mt-0.5">
                            {customer.accountObjectName}
                          </div>
                          {customer.address && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {customer.address}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  value={formData.accountObjectTaxCode || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountObjectTaxCode: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Địa chỉ khách hàng
                </label>
                <input
                  type="text"
                  value={formData.accountObjectAddress || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountObjectAddress: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Thông tin người nhận
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Người nhận
                </label>
                <input
                  type="text"
                  value={formData.receiverName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      receiverName: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tên người nhận..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  SĐT người nhận
                </label>
                <input
                  type="text"
                  value={formData.receiverPhone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      receiverPhone: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Số điện thoại..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Tình trạng hàng hóa
                </label>
                <input
                  type="text"
                  value={formData.goodsStatus || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      goodsStatus: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ghi chú hàng hóa..."
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Địa chỉ giao hàng cụ thể
                </label>
                <input
                  type="text"
                  value={formData.specificAddress || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specificAddress: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Địa chỉ giao hàng chi tiết..."
                />
              </div>
            </div>
          </div>

          {/* Order Details (Products) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Chi tiết đơn hàng
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                >
                  <Plus className="w-3 h-3" />
                  Thêm sản phẩm
                </button>

                {/* Product Dropdown - Opens upward */}
                {showProductDropdown && (
                  <div className="absolute right-0 bottom-full z-[100] w-[400px] mb-1 bg-white border border-gray-300 rounded-lg shadow-xl">
                    <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tìm theo mã hoặc tên sản phẩm..."
                          autoFocus
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5 flex items-center justify-between">
                        <span>
                          {loadingProducts ? (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Đang tìm...
                            </span>
                          ) : (
                            `Tìm thấy ${products.length} sản phẩm`
                          )}
                        </span>
                        <span className="text-gray-400">Click để thêm</span>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {products.length === 0 && !loadingProducts ? (
                        <div className="px-4 py-6 text-sm text-gray-500 text-center">
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Không tìm thấy sản phẩm. Thử từ khóa khác.
                        </div>
                      ) : (
                        products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-blue-600">
                                {product.inventoryItemCode}
                              </span>
                              <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                                {formatCurrency(
                                  product.salePrice1 || product.unitPrice || 0,
                                )}
                              </span>
                            </div>
                            <div className="text-sm text-gray-800 mt-0.5 line-clamp-2">
                              {product.inventoryItemName}
                            </div>
                            {product.unitName && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                ĐVT: {product.unitName}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[40px]">
                      STT
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[100px]">
                      Mã SP
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500">
                      Mô tả
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[80px]">
                      SL
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[70px]">
                      ĐVT
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[100px]">
                      Đơn giá
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[110px]">
                      Thành tiền
                    </th>
                    <th className="px-2 py-1.5 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderDetails.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-4 text-center text-gray-500"
                      >
                        Chưa có sản phẩm. Nhấn "Thêm sản phẩm" để thêm.
                      </td>
                    </tr>
                  ) : (
                    orderDetails.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-2 py-1.5 font-medium">
                          {item.inventoryItemCode}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) =>
                              handleUpdateDetail(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full px-1 py-0.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateDetail(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="w-full px-1 py-0.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">
                          {item.unitName || "-"}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateDetail(
                                index,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            className="w-full px-1 py-0.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">
                          {formatCurrency(
                            (item.quantity || 0) * (item.unitPrice || 0),
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(index)}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {orderDetails.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-1.5 text-right font-medium"
                      >
                        Tổng cộng:
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-blue-600">
                        {formatCurrency(calculateTotal())}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 rounded border border-gray-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Tạo đơn hàng
          </button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showCustomerDropdown || showProductDropdown) && (
        <div
          className="fixed inset-0 z-[99] bg-black/5"
          onClick={() => {
            setShowCustomerDropdown(false);
            setShowProductDropdown(false);
          }}
        />
      )}
    </div>
  );
}
