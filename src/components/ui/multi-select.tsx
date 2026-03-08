import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className = "",
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          min-h-[40px] px-3 py-2 border rounded-md cursor-pointer
          flex items-center flex-wrap gap-1
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-gray-400"}
          ${isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"}
        `}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <>
            {selectedLabels.map((label, index) => (
              <span
                key={value[index]}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded"
              >
                {label}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-blue-600"
                    onClick={(e) => removeOption(value[index], e)}
                  />
                )}
              </span>
            ))}
          </>
        )}
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">Không có lựa chọn</div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center gap-2
                    ${isSelected ? "bg-blue-50" : "hover:bg-gray-100"}
                  `}
                >
                  <div
                    className={`
                      w-4 h-4 border rounded flex items-center justify-center
                      ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}
                    `}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={isSelected ? "text-blue-800" : ""}>{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
