import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { employeeApi } from "../../api/employee";
import { Button } from "../../components/ui/button";

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ImportEmployees() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{ row: number; fullName: string; phone: string; error: string }>;
    created: Array<{ fullName: string; phone: string }>;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setSelectedFile(file);
      setError('');
      setStatus('idle');
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    // Download file mẫu từ public folder
    const link = document.createElement('a');
    link.href = '/mau import nhan vien.xlsx';
    link.download = 'mau-import-nhan-vien.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file để import');
      return;
    }

    try {
      setStatus('uploading');
      setError('');

      const importResult = await employeeApi.importFromExcel(selectedFile);

      setResult(importResult);
      setStatus('success');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err?.message || err?.data?.errors?.message || 'Có lỗi xảy ra khi import file');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus('idle');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/nha-may-cua-toi/nhan-vien')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Import nhân viên từ Excel</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step 1: Download Template */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tải file mẫu</h3>
                <p className="text-sm text-gray-600">
                  Tải file Excel mẫu, điền thông tin nhân viên theo đúng format
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-5 w-5" />
              Tải file mẫu
            </button>
          </div>
        </div>

        {/* Step 2: Upload File */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chọn file để import</h3>
                <p className="text-sm text-gray-600">
                  Chọn file Excel đã điền thông tin nhân viên
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer font-medium text-gray-700"
            >
              <Upload className="h-5 w-5" />
              Chọn file Excel
            </label>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <FileSpreadsheet className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {status === 'success' && result && (
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-800 mb-3">Import hoàn tất!</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                      <div className="text-sm text-gray-600">Tổng số dòng</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{result.success}</div>
                      <div className="text-sm text-gray-600">Thành công</div>
                    </div>
                    {result.failed > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                        <div className="text-sm text-gray-600">Thất bại</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Success Table */}
            {result.created && result.created.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Danh sách nhân viên import thành công ({result.created.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Họ tên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số điện thoại
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.created.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="text-sm font-medium text-gray-900">{emp.fullName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Table */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Danh sách nhân viên import thất bại ({result.errors.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dòng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Họ tên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số điện thoại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lỗi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {err.row}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {err.fullName || <span className="text-gray-400 italic">(Không có tên)</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {err.phone || <span className="text-gray-400 italic">(Không có SĐT)</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-red-600">{err.error}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {status === 'success' ? (
            <>
              <Button
                onClick={handleReset}
                variant="outline"
              >
                Import thêm
              </Button>
              <Button
                onClick={() => navigate('/nha-may-cua-toi/nhan-vien')}
              >
                Xem danh sách nhân viên
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate('/nha-may-cua-toi/nhan-vien')}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || status === 'uploading'}
                className="bg-green-600 hover:bg-green-700"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
