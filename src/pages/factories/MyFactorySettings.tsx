import { useState } from 'react';
import { Settings, Clock, UserCog, MapPin, Gift, ArrowLeft, ChevronRight, Percent, CalendarOff, HandCoins } from 'lucide-react';
import WorkingHoursSettings from '../../components/factory-settings/WorkingHoursSettings';
import RoleManagementSettings from '../../components/factory-settings/RoleManagementSettingsWrapper';
import LocationSettings from '../../components/factory-settings/LocationSettings';
import HolidaySettings from '../../components/factory-settings/HolidaySettings';
import OvertimeCoefficientSettings from '../../components/factory-settings/OvertimeCoefficientSettings';
import LeaveTypeSettings from '../../components/factory-settings/LeaveTypeSettings';
import SupportTypeSettings from '../../components/factory-settings/SupportTypeSettings';

type SettingType = 'working-hours' | 'location' | 'holiday' | 'role-management' | 'overtime-coefficient' | 'leave-type' | 'support-type' | null;

interface SettingCard {
  id: SettingType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

export default function MyFactorySettings() {
  const [selectedSetting, setSelectedSetting] = useState<SettingType>(null);

  const settings: SettingCard[] = [
    {
      id: 'working-hours',
      label: 'Cấu hình thời gian làm việc',
      description: 'Thiết lập giờ vào, giờ ra và các ca làm việc',
      icon: Clock,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'location',
      label: 'Cấu hình vị trí & bán kính',
      description: 'Thiết lập vị trí nhà máy và bán kính chấm công',
      icon: MapPin,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'holiday',
      label: 'Quản lý ngày nghỉ lễ',
      description: 'Thiết lập các ngày nghỉ lễ trong năm',
      icon: Gift,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'overtime-coefficient',
      label: 'Hệ số làm thêm giờ',
      description: 'Cấu hình hệ số tính lương cho các ca làm thêm',
      icon: Percent,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'leave-type',
      label: 'Loại nghỉ phép',
      description: 'Cấu hình các loại nghỉ phép cho nhân viên',
      icon: CalendarOff,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'support-type',
      label: 'Loại hỗ trợ',
      description: 'Cấu hình các loại hỗ trợ (qua đêm, km xe, ...)',
      icon: HandCoins,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
    {
      id: 'role-management',
      label: 'Quản lý vai trò',
      description: 'Phân quyền và quản lý vai trò nhân viên',
      icon: UserCog,
      iconColor: 'text-gray-700',
      bgColor: 'bg-white hover:bg-gray-50'
    },
  ];

  // If a setting is selected, show its detail view
  if (selectedSetting) {
    const setting = settings.find(s => s.id === selectedSetting);
    const Icon = setting?.icon;

    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Back Button and Header */}
        <div className="space-y-4">
          <button
            onClick={() => setSelectedSetting(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-gray-700" />}
            <h1 className="text-2xl font-bold">{setting?.label}</h1>
          </div>
        </div>

        {/* Setting Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {selectedSetting === 'working-hours' && <WorkingHoursSettings />}
          {selectedSetting === 'location' && <LocationSettings />}
          {selectedSetting === 'holiday' && <HolidaySettings />}
          {selectedSetting === 'overtime-coefficient' && <OvertimeCoefficientSettings />}
          {selectedSetting === 'leave-type' && <LeaveTypeSettings />}
          {selectedSetting === 'support-type' && <SupportTypeSettings />}
          {selectedSetting === 'role-management' && <RoleManagementSettings />}
        </div>
      </div>
    );
  }

  // Default view: show cards grid
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Cấu hình nhà máy</h1>
      </div>

      <p className="text-gray-600">
        Chọn một cài đặt để quản lý
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <button
              key={setting.id}
              onClick={() => setSelectedSetting(setting.id)}
              className={`${setting.bgColor} border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-lg p-6 text-left transition-all group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg bg-gray-100`}>
                    <Icon className={`h-6 w-6 ${setting.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {setting.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
