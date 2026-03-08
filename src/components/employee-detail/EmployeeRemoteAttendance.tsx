import { useState } from 'react';
import { MapPin, Camera, Fingerprint, Save, X, Edit2 } from 'lucide-react';
import { employeeApi } from '../../api/employee';
import type { EmployeeWithDetails, AttendanceMethod } from '../../types/employee';
import { useToast } from '../../contexts/ToastContext';

interface EmployeeRemoteAttendanceProps {
  employee: EmployeeWithDetails;
}

interface AttendanceMethodOption {
  id: AttendanceMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean; // Tính năng đã phát triển chưa
}

const attendanceMethods: AttendanceMethodOption[] = [
  {
    id: 'location',
    label: 'Chấm công theo vị trí',
    description: 'Yêu cầu nhân viên ở trong khu vực nhà máy khi chấm công',
    icon: MapPin,
    available: true,
  },
  {
    id: 'remote',
    label: 'Chấm công từ xa',
    description: 'Cho phép chấm công mà không cần kiểm tra vị trí',
    icon: MapPin,
    available: true,
  },
  {
    id: 'photo',
    label: 'Chấm công bằng hình ảnh',
    description: 'Yêu cầu chụp ảnh khi chấm công',
    icon: Camera,
    available: false,
  },
  {
    id: 'fingerprint',
    label: 'Chấm công bằng vân tay',
    description: 'Sử dụng thiết bị vân tay để chấm công',
    icon: Fingerprint,
    available: false,
  },
];

const EmployeeRemoteAttendance = ({ employee }: EmployeeRemoteAttendanceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // State for attendance configuration
  const [config, setConfig] = useState({
    allowedAttendanceMethods: employee.allowedAttendanceMethods || ['location'],
    requireLocationCheck: employee.requireLocationCheck !== false, // default true
    requirePhotoVerification: employee.requirePhotoVerification || false,
    requireFingerprintVerification: employee.requireFingerprintVerification || false,
    allowRemoteAttendance: employee.allowRemoteAttendance || false,
  });

  const isMethodEnabled = (methodId: AttendanceMethod) => {
    return config.allowedAttendanceMethods.includes(methodId);
  };

  const handleMethodToggle = (methodId: AttendanceMethod, currentValue: boolean) => {
    const currentMethods = config.allowedAttendanceMethods;

    if (currentValue) {
      // Turning off - remove method (but keep at least one method)
      if (currentMethods.length > 1) {
        const newMethods = currentMethods.filter((m) => m !== methodId);
        const newConfig = {
          ...config,
          allowedAttendanceMethods: newMethods,
        };

        // If disabling remote, update related fields
        if (methodId === 'remote') {
          newConfig.allowRemoteAttendance = false;
          newConfig.requireLocationCheck = true;
        }

        setConfig(newConfig);
      } else {
        toast.error('Phải có ít nhất một phương thức chấm công!');
      }
    } else {
      // Turning on - add method
      const newConfig = {
        ...config,
        allowedAttendanceMethods: [...currentMethods, methodId],
      };

      // If enabling remote, update related fields
      if (methodId === 'remote') {
        newConfig.allowRemoteAttendance = true;
        newConfig.requireLocationCheck = false;
      }

      setConfig(newConfig);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await employeeApi.updateAttendanceConfig(employee.id, config);

      setIsEditing(false);
      toast.success('Cập nhật cấu hình chấm công thành công!');
    } catch (error) {
      console.error('Error updating attendance config:', error);
      toast.error('Có lỗi xảy ra khi cập nhật cấu hình chấm công');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to employee data
    setConfig({
      allowedAttendanceMethods: employee.allowedAttendanceMethods || ['location'],
      requireLocationCheck: employee.requireLocationCheck !== false,
      requirePhotoVerification: employee.requirePhotoVerification || false,
      requireFingerprintVerification: employee.requireFingerprintVerification || false,
      allowRemoteAttendance: employee.allowRemoteAttendance || false,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cấu hình chấm công</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý cấu hình chấm công của {employee.user?.fullName || '-'}
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
        {/* Attendance Methods Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Phương thức chấm công
          </h3>
          <div className="space-y-4">
            {attendanceMethods.map((method) => {
              const Icon = method.icon;
              const isEnabled = isMethodEnabled(method.id);
              const isDisabled = !isEditing || !method.available;

              return (
                <div
                  key={method.id}
                  className={`
                    flex items-center justify-between p-4 border border-gray-200 rounded-lg
                    ${!method.available ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`
                      p-2 rounded-lg
                      ${isEnabled ? 'bg-indigo-100' : 'bg-gray-100'}
                    `}>
                      <Icon className={`h-5 w-5 ${isEnabled ? 'text-indigo-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {method.label}
                        {!method.available && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                            Sắp ra mắt
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleMethodToggle(method.id, isEnabled)}
                      disabled={isDisabled}
                      className="sr-only peer"
                    />
                    <div className={`
                      w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                      peer-focus:ring-indigo-300 rounded-full peer
                      peer-checked:after:translate-x-full peer-checked:after:border-white
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                      after:bg-white after:border-gray-300 after:border after:rounded-full
                      after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Phải có ít nhất một phương thức chấm công được bật.
            Cấu hình này sẽ áp dụng cho tất cả các lần chấm công của nhân viên.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRemoteAttendance;
