import { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { overnightReportApi } from '../api/overnight-report';
import { useLoading } from '../contexts/LoadingContext';
import ErrorMessage from './commons/ErrorMessage';

interface ExportOvernightReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryId: number;
}

export default function ExportOvernightReportModal({
  isOpen,
  onClose,
  factoryId
}: ExportOvernightReportModalProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleExport = async () => {
    setError(null);
    setLoading(true);
    showLoading('Đang xuất báo cáo qua đêm...');

    try {
      const blob = await overnightReportApi.exportXLSX(factoryId, year, month);

      // Tạo URL để download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-qua-dem-${year}-${month.toString().padStart(2, '0')}.xlsx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xuất file');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleClose = () => {
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Xuất báo cáo qua đêm
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {error && <ErrorMessage error={error} setError={setError} />}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Chọn tháng
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Chọn năm
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>File Excel sẽ bao gồm:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Danh sách nhân viên có báo cáo qua đêm trong tháng</li>
              <li>Đánh dấu "x" vào các ngày có báo cáo</li>
              <li>Nhóm theo phòng ban và tổ/nhóm</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Đang xuất file...' : 'Xuất Excel'}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
