
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  showText?: boolean;
}

export function Loading({ 
  size = 'md', 
  text = 'Đang tải...', 
  className = '',
  showText = true 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${sizeClasses[size]}`}></div>
        {showText && (
          <p className={`mt-2 text-muted-foreground ${textSizeClasses[size]}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Loading variants for different use cases
export function LoadingPage({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loading text={text} size="md" />
    </div>
  );
}

export function LoadingModal({ text = 'Đang xử lý...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loading text={text} size="sm" />
    </div>
  );
}

export function LoadingButton({ text = 'Đang xử lý...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Loading size="sm" showText={false} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function LoadingTable({ text = 'Đang tải dữ liệu...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading text={text} size="md" />
    </div>
  );
}

export function LoadingCard({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <Loading text={text} size="md" />
    </div>
  );
}

export default Loading;
