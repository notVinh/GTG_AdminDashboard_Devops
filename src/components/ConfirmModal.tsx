
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
  inputLabel?: string;
  inputError?: string;
  inputRequired?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'default',
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = '',
  inputLabel = '',
  inputError = '',
  inputRequired = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return 'bg-blue-600 hover:bg-blue-600/90';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
        
        <p className="text-gray-600">{description}</p>
        
        {showInput && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {inputLabel} {inputRequired && '*'}
            </label>
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                inputError 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              rows={3}
            />
            {inputError && (
              <p className="mt-1 text-sm text-red-600">{inputError}</p>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white cursor-pointer ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
