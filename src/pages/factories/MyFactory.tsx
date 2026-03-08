import { useEffect, useState } from 'react';
import { Building2, Users, UserCog } from 'lucide-react';
import { usersApi } from '../../api/users';
import ErrorMessage from '../../components/commons/ErrorMessage';

export default function MyFactory() {
  const [myFactory, setMyFactory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Work days settings
  const [workDays, setWorkDays] = useState<number[]>([]); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        setLoading(true);
        const factory = await usersApi.getMyFactory();
        if (isMounted) {
          setMyFactory(factory);
          
          // Load work days from factory data
          if (factory.workDays) {
            setWorkDays(factory.workDays);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Đang tải...</div>;

  if (!myFactory) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy nhà máy</h2>
          <p className="text-gray-500">Bạn chưa được gán vào nhà máy nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Nhà máy của tôi</h1>
        </div>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Factory Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{myFactory.name}</h2>
            <p className="text-sm text-gray-600">{myFactory.address}</p>
            <p className="text-sm text-gray-500">SĐT: {myFactory.phone}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Giờ làm việc: {myFactory.hourStartWork} - {myFactory.hourEndWork}</p>
            <p>Số nhân viên hiện tại: </p>
            <p className="text-blue-600">
              Ngày làm việc: {workDays.map(d => {
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                return dayNames[d];
              }).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Quản lý nhân viên</h3>
              <p className="text-sm text-gray-600">Xem và quản lý danh sách nhân viên</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/nha-may-cua-toi/nhan-vien'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Xem danh sách nhân viên
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCog className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Quản lý vị trí</h3>
              <p className="text-sm text-gray-600">Xem và quản lý các vị trí nhân viên</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/nha-may-cua-toi/vi-tri'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Xem danh sách vị trí
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin nhà máy</h2>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-600">
            <p>Đây là trang tổng quan của nhà máy. Bạn có thể:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Xem thông tin cơ bản của nhà máy</li>
              <li>Quản lý nhân viên thông qua menu "Nhân viên"</li>
              <li>Quản lý vị trí nhân viên thông qua menu "Vị trí nhân viên"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


