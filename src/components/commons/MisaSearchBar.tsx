import { Search, RefreshCw, Download } from 'lucide-react';

interface MisaSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onRefresh: () => void;
  onSync: () => void;
  loading?: boolean;
  syncing?: boolean;
  syncLabel?: string;
  syncingLabel?: string;
  compact?: boolean;
  className?: string;
  provinceSearch?: string;
  onProvinceSearchChange?: (value: string) => void;
}

export function MisaSearchBar({
  placeholder = 'Tìm kiếm...',
  value,
  onChange,
  onSearch,
  onRefresh,
  onSync,
  loading = false,
  syncing = false,
  syncLabel = 'Kéo dữ liệu MISA',
  syncingLabel = 'Đang kéo...',
  compact = false,
  className = '',
  provinceSearch,
  onProvinceSearchChange,
}: MisaSearchBarProps) {
  const inputClass = compact
    ? 'w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    : 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const buttonClass = compact
    ? 'flex items-center gap-1.5 px-3 py-1.5 text-[13px]'
    : 'flex items-center gap-2 px-4 py-2';

  const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const gapClass = compact ? 'gap-3' : 'gap-4';

  return (
    <div className={`flex items-center ${gapClass} flex-shrink-0 ${className}`}>
      <form onSubmit={onSearch} className="flex-1 max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
        {onProvinceSearchChange && (
          <input
            type="text"
            placeholder="Lọc tỉnh/TP..."
            value={provinceSearch || ''}
            onChange={(e) => onProvinceSearchChange(e.target.value)}
            className={compact
              ? 'w-[150px] px-2.5 py-1.5 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              : 'w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }
          />
        )}
      </form>
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`${buttonClass} bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50`}
      >
        <RefreshCw className={`${iconSize} ${loading ? 'animate-spin' : ''}`} />
        Làm mới
      </button>
      <button
        onClick={onSync}
        disabled={syncing}
        className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50`}
      >
        <Download className={`${iconSize} ${syncing ? 'animate-bounce' : ''}`} />
        {syncing ? syncingLabel : syncLabel}
      </button>
    </div>
  );
}
