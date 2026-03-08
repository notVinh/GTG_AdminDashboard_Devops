/**
 * Get month/year label in Vietnamese format
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Formatted string like "Tháng 10 / 2025"
 */
export const getMonthYearLabel = (month: number, year: number): string => {
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  return `${monthNames[month]} / ${year}`;
};
