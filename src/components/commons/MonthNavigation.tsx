import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { getMonthYearLabel } from '../../utils/dateHelpers';

interface MonthNavigationProps {
  selectedMonth?: number; // 0-11 (optional if label is provided)
  selectedYear?: number;
  label?: string; // Custom label (if provided, will be used instead of selectedMonth/selectedYear)
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void; // Optional today button handler
  showTodayButton?: boolean; // Show today button
  showCalendarIcon?: boolean; // Show calendar icon
  minWidth?: string; // Custom min-width, default: "min-w-[100px] sm:min-w-[120px]"
}

const MonthNavigation = ({
  selectedMonth,
  selectedYear,
  label,
  onPrevMonth,
  onNextMonth,
  onToday,
  showTodayButton = false,
  showCalendarIcon = false,
  minWidth = "min-w-[100px] sm:min-w-[120px]",
}: MonthNavigationProps) => {
  // Use custom label or generate from month/year
  const displayLabel = label ||
    (selectedMonth !== undefined && selectedYear !== undefined
      ? getMonthYearLabel(selectedMonth, selectedYear)
      : '');

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className={`text-xs sm:text-sm text-gray-900 font-medium ${minWidth} text-center px-1`}>
        {showCalendarIcon && <Calendar className="inline w-3 sm:w-4 mr-1" />}
        <span className="break-words">{displayLabel}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {showTodayButton && onToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="hidden xs:flex h-8 px-2 text-xs"
        >
          Hôm nay
        </Button>
      )}
    </div>
  );
};

export default MonthNavigation;
