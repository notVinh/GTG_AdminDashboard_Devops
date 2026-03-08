
interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={`flex items-center justify-between p-3 border-t bg-gray-50 text-sm ${className || ""}`}>
      <div className="flex items-center gap-2">
        <span>Hiển thị:</span>
        <select 
          value={limit} 
          onChange={(e) => onLimitChange(parseInt(e.target.value))} 
          className="border rounded px-2 py-1 cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button 
          disabled={!canPrev} 
          onClick={() => onPageChange(Math.max(1, page - 1))} 
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
        >
          Trước
        </button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <button 
          disabled={!canNext} 
          onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export default Pagination;


