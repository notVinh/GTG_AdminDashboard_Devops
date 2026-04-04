/**
 * Get month/year label in Vietnamese format
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Formatted string like "Tháng 10 / 2025"
 */
export const getMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  return `${monthNames[month]} / ${year}`;
};

/**
 * Định nghĩa các tùy chọn cho hàm chuyển đổi
 */
interface FormatOptions {
  includeTime?: boolean;
  use24h?: boolean;
}

/**
 * Chuyển đổi chuỗi ISO sang định dạng ngày tháng tiếng Việt
 * @param isoString - Chuỗi thời gian (VD: 2026-03-15T08:02:25.151Z)
 * @param options - Các tùy chọn bổ sung (mặc định bao gồm thời gian)
 * @returns Chuỗi ngày tháng đã định dạng hoặc thông báo lỗi
 */
export const formatVN = (
  isoString: string | Date,
  options: FormatOptions = { includeTime: true, use24h: true },
): string => {
  const date = new Date(isoString);

  // Kiểm tra tính hợp lệ của Date
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const { includeTime, use24h } = options;

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  };

  if (includeTime) {
    dateTimeOptions.hour = "2-digit";
    dateTimeOptions.minute = "2-digit";
    dateTimeOptions.second = "2-digit";
    dateTimeOptions.hour12 = !use24h;
  }

  return new Intl.DateTimeFormat("vi-VN", dateTimeOptions).format(date);
};

// --- Ví dụ sử dụng ---
const isoInput = "2026-03-15T08:02:25.151Z";

console.log(formatVN(isoInput));
// Kết quả: 15:02:25 15/03/2026

console.log(formatVN(isoInput, { includeTime: false }));
// Kết quả: 15/03/2026
