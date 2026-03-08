import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface SelectWithSearchProps {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; extra?: string }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectWithSearch({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
  disabled = false,
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower) ||
      (option.extra && option.extra.toLowerCase().includes(searchLower))
    );
  });

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "min-h-[40px] px-3 py-2 border rounded-md cursor-pointer",
          "flex items-center justify-between",
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-gray-400",
          isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
        )}
      >
        <span className={cn(value ? "text-gray-900" : "text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhân viên..."
                className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

          {/* Options list */}
          <div className="overflow-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm text-center">
                Không tìm thấy
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center justify-between",
                      isSelected
                        ? "bg-blue-50 text-blue-900"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {option.extra && (
                        <span className="text-gray-500 text-xs">
                          {option.extra}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
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

