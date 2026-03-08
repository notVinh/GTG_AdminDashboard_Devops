import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, MessageCircle, Building2 } from 'lucide-react';
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
  factory?: {
    id: number;
    name: string;
  };
}

const ZaloOAManagement: React.FC = () => {
  const [zaloOAs, setZaloOAs] = useState<ZaloOAExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchZaloOAs();
  }, []);

  const fetchZaloOAs = async () => {
    try {
      setLoading(true);
      const response = await zaloApi.getZaloOAs();
      setZaloOAs(response);
    } catch (error: any) {
      console.error('Error fetching Zalo OAs:', error);
      const message = error?.message || error?.data?.errors?.message || "Có lỗi xảy ra khi tải danh sách Zalo OA";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = (id: number) => {
    setShowSecret(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <LoadingPage text="Đang tải danh sách Zalo OA..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Zalo OA</h1>
        <p className="text-gray-600">Xem thông tin Zalo Official Account của tất cả nhà máy</p>
      </div>

      {/* Error Display */}
      {error && (<ErrorMessage error={error} setError={setError} />)}

      {/* Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Quản lý Zalo OA</h3>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Xem thông tin Zalo OA của tất cả nhà máy. Mỗi nhà máy có thể tự quản lý OA của mình.
        </p>
      </div>

      {/* Zalo OAs List */}
      <div className="grid gap-6">
        {zaloOAs.map((oa) => (
          <div key={oa.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-semibold">{oa.oaName}</h2>
                    <p className="text-sm text-gray-600">OA ID: {oa.oaId}</p>
                    {oa.factory && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{oa.factory.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    oa.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {oa.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">App ID</label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {oa.appId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(oa.appId)}
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
                        {showSecret[oa.id] ? oa.appSecret : '••••••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleSecretVisibility(oa.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showSecret[oa.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(oa.appSecret)}
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
                        {oa.apiUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(oa.apiUrl)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hết hạn</label>
                    <span className="text-sm text-gray-900 block">
                      {new Date(oa.expiresAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Timeout</label>
                    <span className="text-sm text-gray-900 block">{oa.timeout}ms</span>
                  </div>

                  {oa.webhookUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded truncate">
                          {oa.webhookUrl}
                        </span>
                        <button
                          onClick={() => copyToClipboard(oa.webhookUrl || '')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tạo: {new Date(oa.createdAt).toLocaleString('vi-VN')}</span>
                  <span>Cập nhật: {new Date(oa.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!zaloOAs.length && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có Zalo OA nào</h3>
            <p className="text-gray-600">
              Chưa có nhà máy nào cấu hình Zalo Official Account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZaloOAManagement;