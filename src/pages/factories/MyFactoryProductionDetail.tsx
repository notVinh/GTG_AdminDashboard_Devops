import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  dailyProductionApi,
  type DailyProductionItem,
  type EmployeeProductionSummary,
} from "../../api/dailyProduction";
import { employeeApi } from "../../api/employee";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import ConfirmModal from "../../components/ConfirmModal";
import ProductionInputModal from "../../components/ProductionInputModal";
import { Package, ArrowLeft, User, Plus } from "lucide-react";

export default function MyFactoryProductionDetail() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [employee, setEmployee] = useState<EmployeeProductionSummary | null>(null);
  const [productions, setProductions] = useState<DailyProductionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DailyProductionItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted) {
          if (me) {
            setFactoryId(Number((me as any).factoryId));
          }
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!factoryId || !employeeId) return;
      setLoading(true);
      try {
        // Get current employee info
        const employeesList = await dailyProductionApi.getEmployeesWithProduction(factoryId);
        const emp = employeesList.find(e => e.employeeId === parseInt(employeeId));
        if (emp) setEmployee(emp);

        // Get production data
        const data = await dailyProductionApi.listByEmployee(parseInt(employeeId));
        setProductions(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [factoryId, employeeId]);

  const filtered = productions.filter((item) => {
    const itemDate = new Date(item.date);
    const itemMonth = itemDate.getMonth() + 1;
    const itemYear = itemDate.getFullYear();

    if (monthFilter !== "all" && itemMonth !== parseInt(monthFilter)) return false;
    if (itemYear !== yearFilter) return false;
    return true;
  });

  const groupedData = filtered.reduce((groups, item) => {
    const date = new Date(item.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!groups[key]) {
      groups[key] = {
        month: `${month}/${year}`,
        year,
        items: [],
        totalQuantity: 0,
        totalValue: 0,
      };
    }

    groups[key].items.push(item);
    groups[key].totalQuantity += item.quantity;
    groups[key].totalValue += item.totalPrice || 0;

    return groups;
  }, {} as Record<string, any>);

  const months = [
    { value: "all", label: "Tất cả tháng" },
    { value: "1", label: "Tháng 1" },
    { value: "2", label: "Tháng 2" },
    { value: "3", label: "Tháng 3" },
    { value: "4", label: "Tháng 4" },
    { value: "5", label: "Tháng 5" },
    { value: "6", label: "Tháng 6" },
    { value: "7", label: "Tháng 7" },
    { value: "8", label: "Tháng 8" },
    { value: "9", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleDelete = async (id: number) => {
    try {
      await dailyProductionApi.delete(id);
      setProductions((prev) => prev.filter((x) => x.id !== id));
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Error deleting production record:", error);
    }
  };

  const handleInputSuccess = async () => {
    // Refresh production data
    if (employeeId) {
      const data = await dailyProductionApi.listByEmployee(parseInt(employeeId));
      setProductions(data);
    }
    
    // Refresh employee info
    if (factoryId) {
      const employeesList = await dailyProductionApi.getEmployeesWithProduction(factoryId);
      const emp = employeesList.find(e => e.employeeId === parseInt(employeeId!));
      if (emp) setEmployee(emp);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/nha-may-cua-toi/san-xuat-hang-ngay')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chi tiết sản xuất</h1>
        </div>
        <Button
          onClick={() => setShowInputModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nhập sản lượng
        </Button>
      </div>

      {/* Employee Info */}
      {employee && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gray-400" />
          <div>
            <h2 className="font-semibold text-lg">{employee.fullName}</h2>
            <div className="text-sm text-gray-500 mb-2">
              {employee.salaryType === 'daily' ? 'Lương theo ngày công' : 'Lương theo sản lượng'}
            </div>
            <div className="flex gap-6 text-sm text-gray-600 mt-1">
              <span>Tổng bản ghi: {employee.totalRecords}</span>
              <span>Tổng sản lượng: {employee.totalQuantity.toLocaleString()}</span>
              <span>Tổng giá trị: {formatCurrency(Number(employee.totalValue))}</span>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Năm</label>
            <Select
              value={yearFilter.toString()}
              onValueChange={(v) => setYearFilter(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Không có dữ liệu sản xuất</div>
          </div>
        ) : (
          Object.values(groupedData)
            .sort((a: any, b: any) => {
              if (a.year !== b.year) return b.year - a.year;
              return parseInt(b.month.split('/')[0]) - parseInt(a.month.split('/')[0]);
            })
            .map((group: any) => (
              <div key={group.month} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tháng {group.month}
                    </h3>
                    {/* <div className="text-sm text-gray-600">
                      Tổng: {group.totalQuantity.toLocaleString()} sản phẩm - {formatCurrency(group.totalValue)}
                    </div> */}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.items.map((item: DailyProductionItem) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {new Date(item.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-4 text-right text-sm text-gray-900">
                            {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-900">
                            {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                          </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item);
                              setShowInputModal(true);
                            }}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setShowDeleteModal(item.id)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Production Input Modal */}
      {factoryId && (
        <ProductionInputModal
          isOpen={showInputModal}
          onClose={() => { setShowInputModal(false); setEditingItem(null); }}
          factoryId={factoryId}
          employeeId={employeeId ? parseInt(employeeId) : undefined}
          mode={editingItem ? 'edit' : 'create'}
          initialItem={editingItem || undefined}
          requireReason={!!editingItem}
          onSuccess={handleInputSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => showDeleteModal && handleDelete(showDeleteModal)}
        title="Xác nhận xóa bản ghi sản xuất"
        description="Bạn có chắc chắn muốn xóa bản ghi sản xuất này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
