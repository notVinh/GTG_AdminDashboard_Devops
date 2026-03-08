import { useState } from 'react';
import { Calendar, Edit2, Save, X, CheckCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { employeeApi } from '../../api/employee';
import type { EmployeeWithDetails } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface EmployeeLeaveDaysProps {
  employee: EmployeeWithDetails;
  onUpdate: (updatedEmployee: EmployeeWithDetails) => void;
}

interface LeaveFormData {
  totalLeaveDays: string;
  usedLeaveDays: string;
  availableLeaveDays: string;
  expiringLeaveDays: string;
}

const EmployeeLeaveDays = ({ employee, onUpdate }: EmployeeLeaveDaysProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LeaveFormData>({
    totalLeaveDays: employee.totalLeaveDays?.toString() || '0',
    usedLeaveDays: employee.usedLeaveDays?.toString() || '0',
    availableLeaveDays: employee.availableLeaveDays?.toString() || '0',
    expiringLeaveDays: employee.expiringLeaveDays?.toString() || '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLeaveDays = employee.totalLeaveDays || 0;
  const usedLeaveDays = employee.usedLeaveDays || 0;
  const availableLeaveDays = employee.availableLeaveDays || 0;
  const expiringLeaveDays = employee.expiringLeaveDays || 0;

  const handleSave = async () => {
    const total = parseFloat(formData.totalLeaveDays);
    const used = parseFloat(formData.usedLeaveDays);
    const available = parseFloat(formData.availableLeaveDays);
    const expiring = parseFloat(formData.expiringLeaveDays);

    if (isNaN(total) || isNaN(used) || isNaN(available) || isNaN(expiring)) {
      setError('Vui lòng nhập số hợp lệ cho tất cả các trường');
      return;
    }

    if (total < 0 || used < 0 || available < 0 || expiring < 0) {
      setError('Các giá trị không được âm');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await employeeApi.updateEmployee(employee.id, {
        totalLeaveDays: total,
        usedLeaveDays: used,
        availableLeaveDays: available,
        expiringLeaveDays: expiring,
      } as any);
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating leave days:', err);
      setError('Không thể cập nhật thông tin ngày phép');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      totalLeaveDays: employee.totalLeaveDays?.toString() || '0',
      usedLeaveDays: employee.usedLeaveDays?.toString() || '0',
      availableLeaveDays: employee.availableLeaveDays?.toString() || '0',
      expiringLeaveDays: employee.expiringLeaveDays?.toString() || '0',
    });
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof LeaveFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quản lý ngày phép</h2>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi và điều chỉnh số ngày phép của {employee.user?.fullName || '-'}
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            <span>Chỉnh sửa</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Hủy</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Đang lưu...' : 'Lưu'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Leave Days */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Tổng phép năm</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {totalLeaveDays}
                </p>
              </div>
            </div>
          </div>

          {/* Used Leave Days */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Đã sử dụng</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {usedLeaveDays}
                </p>
              </div>
            </div>
          </div>

          {/* Available Leave Days */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Còn lại</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {availableLeaveDays}
                </p>
              </div>
            </div>
          </div>

          {/* Expiring Leave Days */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Sắp hết hạn</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {expiringLeaveDays}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Chỉnh sửa thông tin ngày phép</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="totalLeaveDays" className="text-sm font-medium text-gray-700">
                  Tổng số ngày phép trong năm
                </Label>
                <Input
                  id="totalLeaveDays"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.totalLeaveDays}
                  onChange={(e) => handleInputChange('totalLeaveDays', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="usedLeaveDays" className="text-sm font-medium text-gray-700">
                  Số ngày phép đã sử dụng
                </Label>
                <Input
                  id="usedLeaveDays"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.usedLeaveDays}
                  onChange={(e) => handleInputChange('usedLeaveDays', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="availableLeaveDays" className="text-sm font-medium text-gray-700">
                  Số ngày phép còn lại
                </Label>
                <Input
                  id="availableLeaveDays"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.availableLeaveDays}
                  onChange={(e) => handleInputChange('availableLeaveDays', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiringLeaveDays" className="text-sm font-medium text-gray-700">
                  Số ngày phép sắp hết hạn
                </Label>
                <Input
                  id="expiringLeaveDays"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.expiringLeaveDays}
                  onChange={(e) => handleInputChange('expiringLeaveDays', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn quản lý ngày phép:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><span className="font-medium">Tổng phép năm:</span> Tổng số ngày phép được phân bổ cho nhân viên trong năm</li>
            <li><span className="font-medium">Đã sử dụng:</span> Số ngày phép nhân viên đã nghỉ (đơn nghỉ phép đã được duyệt)</li>
            <li><span className="font-medium">Còn lại:</span> Số ngày phép còn có thể sử dụng</li>
            <li><span className="font-medium">Sắp hết hạn:</span> Số ngày phép sẽ hết hạn nếu không sử dụng trước cuối năm</li>
          </ul>
          <p className="text-sm text-blue-800 mt-3">
            <span className="font-semibold">Lưu ý:</span> Mỗi tháng nhân viên sẽ được cộng thêm 1 ngày phép vào tổng phép năm.
            Khi đơn nghỉ phép có lương được duyệt, số ngày sẽ tự động chuyển từ "Còn lại" sang "Đã sử dụng".
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveDays;
