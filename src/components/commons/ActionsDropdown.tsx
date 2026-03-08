import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "default" | "danger" | "warning";
}

interface ActionsDropdownProps {
  actions: Action[];
}

export default function ActionsDropdown({ actions }: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, dropUp: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;

      // Estimate dropdown height: ~40px per action item + padding
      const estimatedDropdownHeight = actions.length * 40 + 16;

      // Decide if should drop up
      const shouldDropUp = spaceBelow < estimatedDropdownHeight + 20;

      // Calculate position
      const top = shouldDropUp
        ? rect.top - estimatedDropdownHeight - 8
        : rect.bottom + 8;
      const left = rect.right - 192; // 192px = w-48 (12rem)

      setPosition({ top, left, dropUp: shouldDropUp });
    }
  }, [isOpen, actions.length]);

  const handleActionClick = (action: Action) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        aria-label="Actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
            }}
            className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="py-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className={`
                    w-full px-4 py-2 text-sm text-left flex items-center gap-2 cursor-pointer
                    ${
                      action.variant === "danger"
                        ? "text-red-700 hover:bg-red-50"
                        : action.variant === "warning"
                        ? "text-amber-700 hover:bg-amber-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                    ${action.className || ""}
                  `}
                >
                  {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
