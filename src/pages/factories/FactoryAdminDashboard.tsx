import { useEffect, useState } from 'react';
import { Building2, Users, Clock } from 'lucide-react';
import { factoriesApi } from '../../api/factories';
import { employeeApi } from '../../api/employee';
import type { FactoryItem, PositionItem, EmployeeItem } from '../../types';

export default function FactoryAdminDashboard() {
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [, setPositions] = useState<PositionItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        setLoading(true);
        const res = await factoriesApi.list(1, 100);
        if (isMounted) {
          setFactories(res.data);
          const defaultFactoryId = res.data?.[0]?.id ?? null;
          setSelectedFactoryId(defaultFactoryId);
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

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      if (!selectedFactoryId) return;
      
      try {
        const [pos, emp] = await Promise.all([
          employeeApi.listPositions(selectedFactoryId),
          employeeApi.listEmployees(1, 5, selectedFactoryId), // Show only 5 recent employees
        ]);
        
        if (isMounted) {
          setPositions(pos);
          setEmployees(emp.data);
        }
      } catch (error) {
        console.error('Error loading positions and employees:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedFactoryId]);

  const selectedFactory = factories.find(f => f.id === selectedFactoryId);

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard Factory Admin</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{selectedFactory?.name || '-'}</div>
              <div className="text-sm text-gray-500">Nhà máy</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{employees.length}</div>
              <div className="text-sm text-gray-500">Nhân viên</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {selectedFactory?.hourStartWork ? selectedFactory.hourStartWork.slice(0, 5) : '-'}
              </div>
              <div className="text-sm text-gray-500">Giờ bắt đầu làm việc</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {selectedFactory?.hourEndWork ? selectedFactory.hourEndWork.slice(0, 5) : '-'}
              </div>
              <div className="text-sm text-gray-500">Giờ kết thúc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Employees */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Nhân viên gần đây</h2>
        </div>
        <div className="divide-y">
          {employees.map((e) => (
            <div key={e.id} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
              <div><span className="text-gray-500">Họ và tên:</span> {e.user?.fullName || '-'}</div>
              <div>Vị trí: {e.position?.name || '-'}</div>
              <div>Số điện thoại: {e.user?.phone || '-'}</div>
              <div>Trạng thái: {e.status || '-'}</div>
            </div>
          ))}
          {!employees.length && (
            <div className="p-4 text-center text-sm text-gray-500">Không có nhân viên</div>
          )}
        </div>
      </div>
    </div>
  );
}
