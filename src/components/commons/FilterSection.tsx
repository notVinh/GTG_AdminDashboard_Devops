import { useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

export interface FilterItem {
  type: "select" | "checkbox" | "date";
  label?: string;
  value: string | boolean;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

interface FilterSectionProps {
  filters: FilterItem[];
  gridCols?: "sm:grid-cols-2" | "sm:grid-cols-3" | "sm:grid-cols-4" | "sm:grid-cols-5";
  defaultOpen?: boolean;
  searchSlot?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export default function FilterSection({
  filters,
  gridCols = "sm:grid-cols-3",
  defaultOpen = false,
  searchSlot,
  onClearFilters,
  hasActiveFilters = false,
}: FilterSectionProps) {
  const [showFilters, setShowFilters] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
        {searchSlot}
        <div className={`flex gap-2 ${searchSlot ? "xl:ml-auto" : "justify-end"}`}>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Ẩn bộ lọc" : "Lọc"}
          </button>
          {onClearFilters && showFilters && hasActiveFilters && (
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-red-600 hover:bg-red-50"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="pt-3 border-t border-gray-200">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
              {filters.map((filter, index) => (
                <div key={index} className={filter.className}>
                  {filter.type === "select" && (
                    <div>
                      {filter.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {filter.label}
                        </label>
                      )}
                      <div className="relative">
                        {filter.icon && (
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            {filter.icon}
                          </div>
                        )}
                        <select
                          value={filter.value as string}
                          onChange={(e) => filter.onChange(e.target.value)}
                          className={`w-full ${
                            filter.icon ? "pl-10" : "pl-4"
                          } pr-10 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {filter.type === "checkbox" && (
                    <div className="flex items-center h-full">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filter.value as boolean}
                          onChange={(e) => filter.onChange(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{filter.label}</span>
                      </label>
                    </div>
                  )}

                  {filter.type === "date" && (
                    <div>
                      {filter.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {filter.label}
                        </label>
                      )}
                      <input
                        type="date"
                        value={filter.value as string}
                        onChange={(e) => filter.onChange(e.target.value)}
                        placeholder={filter.placeholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
