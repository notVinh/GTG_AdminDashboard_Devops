import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react"; // Thêm Check icon
import { cn } from "../../lib/utils";

interface SelectWithSearchProps {
  // Chấp nhận cả string (đơn) hoặc string[] (nhiều)
  value?: string | string[];
  onChange: (value: any) => void;
  options: Array<{ value: string; label: string; extra?: string }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: "single" | "multiple"; // Thêm mode
}

export function SelectMutilWithSearch({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
  disabled = false,
  mode = "single", // Mặc định là đơn
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower) ||
      (option.extra && option.extra.toLowerCase().includes(searchLower))
    );
  });

  // Kiểm tra xem một option có đang được chọn hay không
  const isOptionSelected = (optValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(optValue);
    }
    return value === optValue;
  };

  // Xử lý khi click vào một option
  const handleSelect = (optValue: string) => {
    if (mode === "multiple") {
      const currentValue = Array.isArray(value) ? value : [];
      if (currentValue.includes(optValue)) {
        // Nếu chọn rồi thì bỏ chọn
        onChange(currentValue.filter((v) => v !== optValue));
      } else {
        // Nếu chưa chọn thì thêm vào mảng
        onChange([...currentValue, optValue]);
      }
      // Không đóng dropdown khi chọn nhiều
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // Hiển thị nhãn ở ô input
  const renderDisplay = () => {
    if (mode === "multiple" && Array.isArray(value) && value.length > 0) {
      return `Đã chọn ${value.length} mục`;
    }
    const selectedOption = options.find(
      (opt) => opt.value === (Array.isArray(value) ? value[0] : value),
    );
    return selectedOption ? selectedOption.label : placeholder;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "min-h-[40px] px-3 py-2 border rounded-md cursor-pointer transition-all",
          "flex items-center justify-between gap-2",
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-gray-400",
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300",
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-sm",
            (Array.isArray(value) ? value.length > 0 : value)
              ? "text-gray-900"
              : "text-gray-400",
          )}
        >
          {renderDisplay()}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-80 flex flex-col overflow-hidden">
          <div className="p-2 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto max-h-60 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-gray-500 text-sm text-center italic">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = isOptionSelected(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors",
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.extra && (
                        <span className="text-[11px] text-gray-400 font-normal">
                          {option.extra}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
