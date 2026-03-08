import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loading } from '../components/commons/Loading';

type LoadingContextValue = {
  isLoading: boolean;
  text: string | null;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  setLoadingText: (text: string | null) => void;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [text, setText] = useState<string | null>(null);
  // Use a counter to support nested show/hide calls from different places
  const counterRef = useRef<number>(0);

  const showLoading = useCallback((message?: string) => {
    counterRef.current += 1;
    if (message !== undefined) {
      setText(message);
    }
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) {
      setIsLoading(false);
      setText(null);
    }
  }, []);

  const setLoadingText = useCallback((message: string | null) => {
    setText(message);
  }, []);

  const value = useMemo<LoadingContextValue>(() => ({
    isLoading,
    text,
    showLoading,
    hideLoading,
    setLoadingText,
  }), [hideLoading, isLoading, setLoadingText, showLoading, text]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-border px-6 py-5">
            <Loading size="lg" text={text ?? 'Đang xử lý...'} />
          </div>
        </div>,
        document.body
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return ctx;
}


