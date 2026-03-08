import React, { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Copy, Save, Edit, Trash2, MessageCircle } from 'lucide-react';
import { zaloApi } from '../../api/zalo';
import { LoadingPage } from '../../components/commons/Loading';
import type { ZaloOA } from '../../types';
import ErrorMessage from '../../components/commons/ErrorMessage';

interface ZaloOAExtended extends ZaloOA {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  appId: string;
  appSecret: string;
  apiUrl: string;
  webhookUrl?: string;
  timeout: number;
}

interface CreateZaloOADto {
  oaId: string;
  oaName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  appId: string;
  appSecret: string;
  apiUrl: string;
  webhookUrl?: string;
  timeout?: number;
  factoryId?: number;
}

// Helper function to calculate expiration time like in refresh cron
const calculateExpirationTime = (expiresInSeconds: number = 2 * 24 * 60 * 60): string => {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
};

const MyFactoryZaloOA: React.FC = () => {
  const [zaloOA, setZaloOA] = useState<ZaloOAExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [editingOA, setEditingOA] = useState<ZaloOAExtended | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateZaloOADto>({
    oaId: '',
    oaName: '',
    accessToken: '',
    refreshToken: '',
    expiresAt: calculateExpirationTime(2 * 24 * 60 * 60), // 2 days from now (172800 seconds)
    appId: '',
    appSecret: '',
    apiUrl: 'https://openapi.zalo.me/v3.0',
    webhookUrl: '',
    timeout: 30000,
    factoryId: 0
  });
  const [userFactoryId, setUserFactoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserFactoryId();
    fetchZaloOA();
  }, []);

  const fetchUserFactoryId = async () => {
    try {
      const factoryId = await zaloApi.getMyFactoryId();
      setUserFactoryId(factoryId);
      setFormData(prev => ({ ...prev, factoryId }));
    } catch (error: any) {
      console.error('Error fetching user factory ID:', error);
      const message = error?.message || error?.data?.errors?.message || 'Có lỗi xảy ra khi tải thông tin nhà máy';
      setError(message);
    }
  };

  const fetchZaloOA = async () => {
    try {
      setLoading(true);
      const response = await zaloApi.getMyZaloOA();
      setZaloOA(response as ZaloOAExtended);
    } catch (error: any) {
      console.error('Error fetching Zalo OA:', error);
      const message = error?.message || error?.data?.errors?.message || 'Có lỗi xảy ra khi tải thông tin Zalo OA';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateOA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOA) {
        await zaloApi.updateZaloOA(editingOA.id, formData);
      } else {
        await zaloApi.createZaloOA(formData);
      }
      await fetchZaloOA();
      setShowCreateModal(false);
      setEditingOA(null);
      resetForm();
    } catch (error: any) {
      console.error('Error saving Zalo OA:', error);
      const message = error?.message || error?.data?.errors?.message || 'Có lỗi xảy ra khi lưu thông tin Zalo OA';
      setError(message);
    }
  };

  const handleEdit = (oa: ZaloOAExtended) => {
    setEditingOA(oa);
    setFormData({
      oaId: oa.oaId,
      oaName: oa.oaName,
      accessToken: '', // Không hiển thị token
      refreshToken: '', // Không hiển thị token
      expiresAt: oa.expiresAt,
      appId: oa.appId,
      appSecret: '', // Không hiển thị secret
      apiUrl: oa.apiUrl,
      webhookUrl: oa.webhookUrl || '',
      timeout: oa.timeout,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Zalo OA này?')) {
      try {
        await zaloApi.deleteZaloOA(id);
        await fetchZaloOA();
      } catch (error: any) {
        console.error('Error deleting Zalo OA:', error);
        const message = error?.message || error?.data?.errors?.message || 'Có lỗi xảy ra khi xóa Zalo OA';
        setError(message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      oaId: '',
      oaName: '',
      accessToken: '',
      refreshToken: '',
      expiresAt: calculateExpirationTime(2 * 24 * 60 * 60), // 2 days from now (172800 seconds)
      appId: '',
      appSecret: '',
      apiUrl: 'https://openapi.zalo.me/v3.0',
      webhookUrl: '',
      timeout: 30000,
      factoryId: userFactoryId || 0
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <LoadingPage text="Đang tải thông tin Zalo OA..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zalo OA của nhà máy</h1>
        <p className="text-gray-600">Quản lý thông tin Zalo Official Account cho nhà máy của bạn</p>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Zalo OA Info */}
      {zaloOA ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">{zaloOA.oaName}</h2>
                <p className="text-sm text-gray-600">OA ID: {zaloOA.oaId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(zaloOA)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(zaloOA.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                title="Xóa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">App ID</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {zaloOA.appId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(zaloOA.appId)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">App Secret</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {showSecret ? zaloOA.appSecret : '••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(zaloOA.appSecret)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">API URL</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {zaloOA.apiUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(zaloOA.apiUrl)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    zaloOA.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {zaloOA.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Hết hạn</label>
                <span className="text-sm text-gray-900">
                  {new Date(zaloOA.expiresAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Timeout</label>
                <span className="text-sm text-gray-900">{zaloOA.timeout}ms</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có Zalo OA</h3>
          <p className="text-gray-600 mb-4">Nhà máy của bạn chưa có Zalo Official Account được cấu hình.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Thêm Zalo OA
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingOA) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingOA ? 'Chỉnh sửa Zalo OA' : 'Thêm Zalo OA mới'}
              </h3>
              
              <form onSubmit={handleCreateOrUpdateOA} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       OA ID <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={formData.oaId}
                      onChange={(e) => setFormData({ ...formData, oaId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập OA ID"
                      required
                    />
                  </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Tên OA <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={formData.oaName}
                      onChange={(e) => setFormData({ ...formData, oaName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập tên OA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       App ID <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={formData.appId}
                      onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập App ID"
                      required
                    />
                  </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       App Secret <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="password"
                      value={formData.appSecret}
                      onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập App Secret"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Access Token <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập Access Token"
                      required
                    />
                  </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Refresh Token <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={formData.refreshToken}
                      onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập Refresh Token"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.apiUrl}
                      onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://openapi.zalo.me/v3.0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập Webhook URL"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingOA(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingOA ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFactoryZaloOA;
