import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'danger',
  });
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || 'Xác nhận',
        message: opts.message,
        confirmText: opts.confirmText || 'Xác nhận',
        cancelText: opts.cancelText || 'Hủy',
        type: opts.type || 'danger',
      });
      setIsOpen(true);
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(true);
    }
    setIsOpen(false);
    setResolveCallback(null);
  }, [resolveCallback]);

  const handleCancel = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(false);
    }
    setIsOpen(false);
    setResolveCallback(null);
  }, [resolveCallback]);

  const getTypeStyles = () => {
    switch (options.type) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmBg: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'success':
        return {
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          confirmBg: 'bg-green-600 hover:bg-green-700',
        };
      default:
        return {
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-100',
          confirmBg: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return <ConfirmContext.Provider value={{ confirm }}>{children}</ConfirmContext.Provider>;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${styles.iconBg}`}>
                <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {options.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {options.message}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="min-w-[100px]"
            >
              {options.cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`min-w-[100px] text-white ${styles.confirmBg}`}
            >
              {options.confirmText}
            </Button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}
