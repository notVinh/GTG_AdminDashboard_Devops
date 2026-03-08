import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { employeeApi } from "../api/employee";

interface ImportEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ImportEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportEmployeeModalProps) {
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

  if (!isOpen) return null;

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

      // Nếu có ít nhất 1 nhân viên import thành công
      if (importResult.success > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err?.message || err?.data?.errors?.message || 'Có lỗi xảy ra khi import file');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setStatus('idle');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Import nhân viên từ Excel</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Tải file mẫu</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Tải file Excel mẫu, điền thông tin nhân viên theo đúng format
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Tải file mẫu
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Chọn file để import</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Chọn file Excel đã điền thông tin nhân viên
                </p>

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
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-100 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                >
                  <Upload className="h-4 w-4" />
                  Chọn file Excel
                </label>

                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-2">Import hoàn tất!</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Tổng số dòng: <span className="font-semibold">{result.total}</span></p>
                      <p className="text-green-700">
                        Thành công: <span className="font-semibold">{result.success}</span>
                      </p>
                      {result.failed > 0 && (
                        <p className="text-red-700">
                          Thất bại: <span className="font-semibold">{result.failed}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3">Chi tiết lỗi:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm border border-red-100">
                        <div className="font-medium text-gray-900">
                          Dòng {err.row}: {err.fullName} ({err.phone})
                        </div>
                        <div className="text-red-600 mt-1">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {status === 'success' ? 'Đóng' : 'Hủy'}
          </button>
          {status !== 'success' && (
            <button
              onClick={handleImport}
              disabled={!selectedFile || status === 'uploading'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-2"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
