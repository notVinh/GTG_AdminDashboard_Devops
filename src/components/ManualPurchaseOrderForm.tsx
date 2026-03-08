import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  ChevronDown,
  Package,
  Building2,
} from 'lucide-react';
import {
  misaDataSourceApi,
  type MisaSupplier,
  type MisaProduct,
} from '../api/misa-data-source';
import { useToast } from '../contexts/ToastContext';

interface PurchaseOrderDetail {
  inventoryItemCode: string;
  description: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface CreateManualPurchaseOrderData {
  refNo: string;
  refDate?: string;
  accountObjectId?: string;
  accountObjectCode?: string;
  accountObjectName?: string;
  accountObjectAddress?: string;
  accountObjectTaxCode?: string;
  journalMemo?: string;
  expectedArrivalDate?: string;
  details?: PurchaseOrderDetail[];
}

type ManualPurchaseOrderFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManualPurchaseOrderForm({ isOpen, onClose, onSuccess }: ManualPurchaseOrderFormProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateManualPurchaseOrderData>>({
    refNo: '',
    refDate: new Date().toISOString().split('T')[0],
    journalMemo: '',
    expectedArrivalDate: '',
  });

  // Order details (products)
  const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetail[]>([]);

  // Supplier selection
  const [suppliers, setSuppliers] = useState<MisaSupplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<MisaSupplier | null>(null);

  // Product selection
  const [products, setProducts] = useState<MisaProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async (search: string) => {
    setLoadingSuppliers(true);
    try {
      const result = await misaDataSourceApi.getSuppliers(1, 20, search || undefined);
      setSuppliers(result.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (search: string) => {
    setLoadingProducts(true);
    try {
      const result = await misaDataSourceApi.getProducts(1, 20, search || undefined);
      setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Debounced search for suppliers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSupplierDropdown) {
        fetchSuppliers(supplierSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, showSupplierDropdown, fetchSuppliers]);

  // Debounced search for products
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showProductDropdown) {
        fetchProducts(productSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, showProductDropdown, fetchProducts]);

  // Select supplier
  const handleSelectSupplier = (supplier: MisaSupplier) => {
    setSelectedSupplier(supplier);
    setFormData(prev => ({
      ...prev,
      accountObjectId: supplier.accountObjectId,
      accountObjectCode: supplier.accountObjectCode,
      accountObjectName: supplier.accountObjectName,
      accountObjectAddress: supplier.address || '',
      accountObjectTaxCode: supplier.taxCode || '',
    }));
    setShowSupplierDropdown(false);
    setSupplierSearch('');
  };

  // Add product to order details
  const handleAddProduct = (product: MisaProduct) => {
    // Check if already added
    const exists = orderDetails.find(d => d.inventoryItemCode === product.inventoryItemCode);
    if (exists) {
      toast.warning(`Sản phẩm ${product.inventoryItemCode} đã được thêm`);
      return;
    }

    setOrderDetails(prev => [...prev, {
      inventoryItemCode: product.inventoryItemCode,
      description: product.inventoryItemName,
      unitName: product.unitName || '',
      quantity: 1,
      unitPrice: product.unitPrice || 0,
      vatRate: 10,
    }]);
    setShowProductDropdown(false);
    setProductSearch('');
  };

  // Update order detail
  const handleUpdateDetail = (index: number, field: keyof PurchaseOrderDetail, value: string | number) => {
    setOrderDetails(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Remove order detail
  const handleRemoveDetail = (index: number) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      refNo: '',
      refDate: new Date().toISOString().split('T')[0],
      journalMemo: '',
      expectedArrivalDate: '',
    });
    setOrderDetails([]);
    setSelectedSupplier(null);
    setSupplierSearch('');
    setProductSearch('');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.refNo?.trim()) {
      toast.error('Vui lòng nhập số đơn mua hàng');
      return;
    }

    setLoading(true);
    try {
      const data: CreateManualPurchaseOrderData = {
        refNo: formData.refNo!,
        refDate: formData.refDate || undefined,
        accountObjectId: formData.accountObjectId || undefined,
        accountObjectName: formData.accountObjectName || undefined,
        accountObjectCode: formData.accountObjectCode || undefined,
        accountObjectAddress: formData.accountObjectAddress || undefined,
        accountObjectTaxCode: formData.accountObjectTaxCode || undefined,
        journalMemo: formData.journalMemo || undefined,
        expectedArrivalDate: formData.expectedArrivalDate || undefined,
        details: orderDetails.length > 0 ? orderDetails : undefined,
      };

      const result = await misaDataSourceApi.createManualPurchaseOrder(data);
      if (result.success) {
        toast.success(result.message || 'Tạo đơn mua hàng thành công');
        resetForm();
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tạo đơn mua hàng');
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
          <h2 className="text-lg font-semibold text-gray-900">Tạo đơn mua hàng thủ công</h2>
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
              Thông tin đơn mua hàng
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Số đơn mua hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.refNo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, refNo: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="VD: DMH1234"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ngày đặt hàng</label>
                <input
                  type="date"
                  value={formData.refDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, refDate: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ngày dự kiến hàng về</label>
                <input
                  type="date"
                  value={formData.expectedArrivalDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedArrivalDate: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Diễn giải/Ghi chú</label>
                <input
                  type="text"
                  value={formData.journalMemo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, journalMemo: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Thông tin nhà cung cấp
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 relative">
                <label className="block text-xs text-gray-600 mb-1">Nhà cung cấp</label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedSupplier ? `${selectedSupplier.accountObjectCode} - ${selectedSupplier.accountObjectName}` : supplierSearch}
                    onChange={(e) => {
                      if (selectedSupplier) {
                        setSelectedSupplier(null);
                        setFormData(prev => ({
                          ...prev,
                          accountObjectId: undefined,
                          accountObjectCode: undefined,
                          accountObjectName: undefined,
                          accountObjectAddress: undefined,
                          accountObjectTaxCode: undefined,
                        }));
                      }
                      setSupplierSearch(e.target.value);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                    placeholder="Tìm nhà cung cấp theo mã hoặc tên..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {loadingSuppliers ? (
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Supplier Dropdown */}
                {showSupplierDropdown && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-auto">
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <div className="text-xs font-medium text-gray-500">
                        {loadingSuppliers ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Đang tìm kiếm...
                          </span>
                        ) : (
                          `Tìm thấy ${suppliers.length} nhà cung cấp`
                        )}
                      </div>
                    </div>
                    {suppliers.length === 0 && !loadingSuppliers ? (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        Không tìm thấy nhà cung cấp. Thử từ khóa khác.
                      </div>
                    ) : (
                      suppliers.map(supplier => (
                        <div
                          key={supplier.id}
                          onClick={() => handleSelectSupplier(supplier)}
                          className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-600">{supplier.accountObjectCode}</span>
                            {supplier.taxCode && (
                              <span className="text-xs text-gray-400">MST: {supplier.taxCode}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-800 mt-0.5">{supplier.accountObjectName}</div>
                          {supplier.address && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{supplier.address}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mã số thuế</label>
                <input
                  type="text"
                  value={formData.accountObjectTaxCode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountObjectTaxCode: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Địa chỉ nhà cung cấp</label>
                <input
                  type="text"
                  value={formData.accountObjectAddress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountObjectAddress: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Order Details (Products) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Chi tiết đơn mua hàng</h3>
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
                        products.map(product => (
                          <div
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-blue-600">{product.inventoryItemCode}</span>
                              <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                                {formatCurrency(product.unitPrice || 0)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-800 mt-0.5 line-clamp-2">{product.inventoryItemName}</div>
                            {product.unitName && (
                              <div className="text-xs text-gray-400 mt-0.5">ĐVT: {product.unitName}</div>
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
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[40px]">STT</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[100px]">Mã SP</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500">Mô tả</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[80px]">SL</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 w-[70px]">ĐVT</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[100px]">Đơn giá</th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 w-[110px]">Thành tiền</th>
                    <th className="px-2 py-1.5 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderDetails.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                        Chưa có sản phẩm. Nhấn "Thêm sản phẩm" để thêm.
                      </td>
                    </tr>
                  ) : (
                    orderDetails.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-gray-500">{index + 1}</td>
                        <td className="px-2 py-1.5 font-medium">{item.inventoryItemCode}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleUpdateDetail(index, 'description', e.target.value)}
                            className="w-full px-1 py-0.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateDetail(index, 'quantity', Number(e.target.value))}
                            className="w-full px-1 py-0.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">{item.unitName || '-'}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateDetail(index, 'unitPrice', Number(e.target.value))}
                            className="w-full px-1 py-0.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">
                          {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
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
                      <td colSpan={6} className="px-2 py-1.5 text-right font-medium">Tổng cộng:</td>
                      <td className="px-2 py-1.5 text-right font-bold text-blue-600">{formatCurrency(calculateTotal())}</td>
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
            Tạo đơn mua hàng
          </button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showSupplierDropdown || showProductDropdown) && (
        <div
          className="fixed inset-0 z-[99] bg-black/5"
          onClick={() => {
            setShowSupplierDropdown(false);
            setShowProductDropdown(false);
          }}
        />
      )}
    </div>
  );
}
