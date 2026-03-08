import { useState, useEffect } from "react";
import { Calendar, Check } from "lucide-react";

interface WorkDaysSelectorProps {
  selectedDays: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  onDaysChange: (days: number[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { id: 1, name: "T2", fullName: "Thứ 2" },
  { id: 2, name: "T3", fullName: "Thứ 3" },
  { id: 3, name: "T4", fullName: "Thứ 4" },
  { id: 4, name: "T5", fullName: "Thứ 5" },
  { id: 5, name: "T6", fullName: "Thứ 6" },
  { id: 6, name: "T7", fullName: "Thứ 7" },
  { id: 0, name: "CN", fullName: "Chủ nhật" },
];

export default function WorkDaysSelector({ 
  selectedDays, 
  onDaysChange, 
  disabled = false 
}: WorkDaysSelectorProps) {
  const [days, setDays] = useState<number[]>(selectedDays);

  useEffect(() => {
    setDays(selectedDays);
  }, [selectedDays]);

  const handleDayToggle = (dayId: number) => {
    if (disabled) return;
    
    const newDays = days.includes(dayId)
      ? days.filter(d => d !== dayId)
      : [...days, dayId].sort();
    
    setDays(newDays);
    onDaysChange(newDays);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const allDays = DAYS_OF_WEEK.map(day => day.id);
    const newDays = days.length === allDays.length ? [] : allDays;
    setDays(newDays);
    onDaysChange(newDays);
  };

  const isAllSelected = days.length === DAYS_OF_WEEK.length;
  const isNoneSelected = days.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Ngày làm việc trong tuần</span>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = days.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => handleDayToggle(day.id)}
              disabled={disabled}
              className={`
                relative p-2 rounded-lg border text-center transition-all
                ${isSelected 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-xs font-medium">{day.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{day.fullName}</div>
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-gray-500">
        {isNoneSelected 
          ? "Chưa chọn ngày làm việc nào" 
          : `Đã chọn ${days.length} ngày: ${DAYS_OF_WEEK
              .filter(day => days.includes(day.id))
              .map(day => day.name)
              .join(", ")
            }`
        }
      </div>
    </div>
  );
}
