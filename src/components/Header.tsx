import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCw, User, LogOut, KeyRound, Link, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { misaTokenApi } from '../api/misa-token';
import type { MisaTokenStatus } from '../api/misa-token';

interface HeaderProps {
  onLogout?: () => void;
  title?: string;
}

export default function Header({ onLogout, title }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [misaTokenStatus, setMisaTokenStatus] = useState<MisaTokenStatus | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMisaTokenStatus = async () => {
    try {
      const status = await misaTokenApi.getStatus();
      setMisaTokenStatus(status);
    } catch (error) {
      console.error('Failed to fetch MISA token status:', error);
      setMisaTokenStatus(null);
    }
  };

  // Fetch MISA token status when settings menu is opened
  useEffect(() => {
    if (showSettingsMenu) {
      fetchMisaTokenStatus();
    }
  }, [showSettingsMenu]);

  const handleGoToMisaConnection = () => {
    setShowSettingsMenu(false);
    navigate('/quan-ly/ket-noi-misa');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <h2 className="hidden sm:block text-lg font-semibold text-foreground">{title || 'Dashboard'}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer"
              title="Tải lại trang (F5)"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Settings Menu*/}
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  title="Cài đặt"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <h3 className="font-semibold text-sm text-foreground">Cài đặt</h3>
                    </div>

                    {/* MISA Connection */}
                    <button
                      onClick={handleGoToMisaConnection}
                      className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Quản lý kết nối MISA</span>
                      </div>
                      {misaTokenStatus ? (
                        misaTokenStatus.hasToken && misaTokenStatus.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
              </div>

            <div className="ml-2 flex items-center relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                {user?.photo?.path ? (
                  <img
                    src={user.photo.path}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary"
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center ${user?.photo?.path ? 'hidden' : ''}`}>
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                  >
                    <KeyRound className="h-4 w-4" />
                    Đổi mật khẩu
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
}