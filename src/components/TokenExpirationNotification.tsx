import { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { getTimeUntilExpiration } from '../lib/tokenUtils';

interface TokenExpirationNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  onRefresh: () => void;
}

export default function TokenExpirationNotification({ 
  isVisible, 
  onDismiss, 
  onRefresh 
}: TokenExpirationNotificationProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isVisible) return;

    const updateTimeLeft = () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const timeUntilExpiration = getTimeUntilExpiration(token);
        setTimeLeft(timeUntilExpiration);
      }
    };

    // Update immediately
    updateTimeLeft();

    // Update every second
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible || timeLeft <= 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Phiên đăng nhập sắp hết hạn
            </h3>
            <div className="mt-1 text-sm text-yellow-700">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Còn lại: {formatTime(timeLeft)}</span>
              </div>
              <p className="mt-1">
                Vui lòng lưu công việc và đăng nhập lại để tiếp tục.
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={onRefresh}
                className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
              >
                Đăng nhập lại
              </button>
              <button
                onClick={onDismiss}
                className="text-sm text-yellow-600 hover:text-yellow-800 transition-colors"
              >
                Bỏ qua
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-yellow-400 hover:text-yellow-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
