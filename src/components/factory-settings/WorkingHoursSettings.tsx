import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users';
import { factoryApi } from '../../api/factory';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Clock, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface WorkingHoursConfig {
  workingDays: string[]; // ['monday', 'tuesday', ...]
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// Map số ngày sang tên ngày: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
const WEEKDAYS = [
  { id: 'monday', label: 'Thứ 2', value: 1 },
  { id: 'tuesday', label: 'Thứ 3', value: 2 },
  { id: 'wednesday', label: 'Thứ 4', value: 3 },
  { id: 'thursday', label: 'Thứ 5', value: 4 },
  { id: 'friday', label: 'Thứ 6', value: 5 },
  { id: 'saturday', label: 'Thứ 7', value: 6 },
  { id: 'sunday', label: 'Chủ nhật', value: 0 },
];

// Helper functions
const numberToWeekdayId = (num: number): string => {
  const day = WEEKDAYS.find((d) => d.value === num);
  return day ? day.id : '';
};

const weekdayIdToNumber = (id: string): number => {
  const day = WEEKDAYS.find((d) => d.id === id);
  return day ? day.value : -1;
};

const formatTimeForDisplay = (time: string): string => {
  // Convert HH:mm:ss to HH:mm
  if (!time) return '08:00';
  return time.substring(0, 5);
};

const formatTimeForApi = (time: string): string => {
  // Convert HH:mm to HH:mm:ss
  if (!time) return '08:00:00';
  return time.length === 5 ? `${time}:00` : time;
};

export default function WorkingHoursSettings() {
  const { showToast } = useToast();
  const [myFactory, setMyFactory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WorkingHoursConfig>({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '17:00',
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted) {
          setMyFactory(factory);
          // Load existing config from factory
          if (factory) {
            // Convert workDays từ number[] sang string[]
            const workDaysStrings = (factory.workDays || [1, 2, 3, 4, 5])
              .map(numberToWeekdayId)
              .filter(Boolean);

            setConfig({
              workingDays: workDaysStrings,
              startTime: formatTimeForDisplay(factory.hourStartWork || '08:00:00'),
              endTime: formatTimeForDisplay(factory.hourEndWork || '17:00:00'),
            });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWorkingDay = (dayId: string) => {
    setConfig((prev) => {
      const isSelected = prev.workingDays.includes(dayId);
      const newDays = isSelected
        ? prev.workingDays.filter((d) => d !== dayId)
        : [...prev.workingDays, dayId];
      return { ...prev, workingDays: newDays };
    });
  };

  const handleSave = async () => {
    if (!myFactory?.id) return;
    try {
      setSaving(true);

      // Convert workingDays từ string[] sang number[]
      const workDaysNumbers = config.workingDays
        .map(weekdayIdToNumber)
        .filter((n) => n >= 0);

      // Call API to update work schedule
      await factoryApi.updateWorkSchedule(myFactory.id, {
        workDays: workDaysNumbers,
        hourStartWork: formatTimeForApi(config.startTime),
        hourEndWork: formatTimeForApi(config.endTime),
      });

      showToast('Đã lưu cấu hình thành công!', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Lỗi khi lưu cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-6">Đang tải...</div>;
  if (!myFactory) return <div className="py-6">Không tìm thấy nhà máy</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cấu hình thời gian làm việc</h3>
        <p className="text-sm text-gray-600 mt-1">
          Thiết lập các ngày làm việc và giờ làm việc chuẩn của nhà máy
        </p>
      </div>

      <div className="space-y-6">
        {/* Working Days */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-900">
            Ngày làm việc trong tuần
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WEEKDAYS.map((day) => (
              <label
                key={day.id}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors
                  ${
                    config.workingDays.includes(day.id)
                      ? 'bg-blue-600/5 border-primary'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Checkbox
                  id={day.id}
                  checked={config.workingDays.includes(day.id)}
                  onCheckedChange={() => toggleWorkingDay(day.id)}
                />
                <span className="text-sm font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Giờ bắt đầu làm việc
              </div>
            </Label>
            <Input
              id="startTime"
              type="time"
              value={config.startTime}
              onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Giờ kết thúc làm việc
              </div>
            </Label>
            <Input
              id="endTime"
              type="time"
              value={config.endTime}
              onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Tóm tắt cấu hình</h4>
          <div className="text-sm text-gray-700">
            <p>
              <span className="font-medium">Ngày làm việc:</span>{' '}
              {config.workingDays.length > 0
                ? WEEKDAYS.filter((d) => config.workingDays.includes(d.id))
                    .map((d) => d.label)
                    .join(', ')
                : 'Chưa chọn'}
            </p>
            <p>
              <span className="font-medium">Giờ làm việc:</span>{' '}
              {config.startTime} - {config.endTime}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || config.workingDays.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  );
}
