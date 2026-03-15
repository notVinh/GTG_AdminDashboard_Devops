// Biến số thành chuỗi có dấu chấm: 1000000 -> "1.000.000"
export const formatNumber = (num: number) => {
  if (!num) return "";
  return Math.floor(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Biến chuỗi có dấu chấm thành số: "1.000.000" -> 1000000
export const parseNumber = (str: string) => {
  return Number(str.replace(/\D/g, ""));
};
