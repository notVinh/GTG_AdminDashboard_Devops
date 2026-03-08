import { useEffect, useState } from 'react';
import { Building2, Users, Factory, TrendingUp } from 'lucide-react';
import { employeeApi } from '../../api/employee';

export default function SuperAdminDashboard() {
  const [totalFactories, setTotalFactories] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Sử dụng 1 API call duy nhất thay vì loop qua từng factory
        const stats = await employeeApi.getDashboardStats();
        setTotalFactories(stats.totalFactories);
        setTotalEmployees(stats.totalEmployees);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalFactories}</div>
              <div className="text-sm text-gray-500">Tổng nhà máy</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <div className="text-sm text-gray-500">Tổng nhân viên</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalFactories > 0 ? Math.round(totalEmployees / totalFactories) : 0}</div>
              <div className="text-sm text-gray-500">TB nhân viên/nhà máy</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
