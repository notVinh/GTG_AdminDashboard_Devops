import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Gift, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { usersApi } from '../../api/users';
import { holidayApi, type CreateHolidayDto, type Holiday } from '../../api/holiday';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

interface HolidayFormData {
  name: string;
  date: string;
  description: string;
  overtimeRate: number;
}

export default function HolidaySettings() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [factory, setFactory] = useState<any>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: '',
    description: '',
    overtimeRate: 3.0,
  });

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toISO = (y: number, mZeroBased: number, d: number) => `${y}-${pad2(mZeroBased + 1)}-${pad2(d)}`;
  const getDaysInMonth = (y: number, mZeroBased: number) => new Date(y, mZeroBased + 1, 0).getDate();
  const getFirstWeekday = (y: number, mZeroBased: number) => new Date(y, mZeroBased, 1).getDay(); // 0=CN

  useEffect(() => {
    loadData();
  }, []);

  // Reload holidays when selected year changes
  useEffect(() => {
    if (factory) {
      loadHolidays();
    }
  }, [selectedYear, factory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const factoryData = await usersApi.getMyFactory();
      setFactory(factoryData);

      const holidaysData = await holidayApi.getAll(factoryData.id, selectedYear);
      setHolidays(holidaysData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    if (!factory) return;

    try {
      setLoading(true);
      const holidaysData = await holidayApi.getAll(factory.id, selectedYear);
      setHolidays(holidaysData);
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast.error('Lỗi khi tải dữ liệu ngày lễ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factory) return;

    if (!formData.name.trim() || (!formData.date && selectedDates.length === 0)) {
      toast.warning('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSaving(true);
      
      if (editingId) {
        const year = new Date(formData.date).getFullYear();
        // Update
        await holidayApi.update(editingId, {
          name: formData.name,
          date: formData.date,
          year,
          description: formData.description,
          overtimeRate: formData.overtimeRate,
        });
      } else {
        // Create (single or multiple dates)
        const datesToCreate = selectedDates.length > 0 ? selectedDates : [formData.date];
        for (const dateStr of datesToCreate) {
          const year = new Date(dateStr).getFullYear();
          const createData: CreateHolidayDto = {
            factoryId: +factory.id,
            name: formData.name,
            date: dateStr,
            year,
            description: formData.description,
            overtimeRate: formData.overtimeRate,
            isActive: true,
          };
          await holidayApi.create(createData);
        }
      }

      toast.success(editingId ? 'Đã cập nhật ngày lễ!' : `Đã thêm ${selectedDates.length > 0 ? selectedDates.length : 1} ngày lễ!`);
      resetForm();
      loadHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error('Lỗi khi lưu ngày lễ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description || '',
      overtimeRate: holiday.overtimeRate,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa ngày lễ này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await holidayApi.delete(id);
      toast.success('Đã xóa ngày lễ!');
      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Lỗi khi xóa ngày lễ');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      description: '',
      overtimeRate: 3.0,
    });
    setEditingId(null);
    setShowForm(false);
    setSelectedDates([]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <div className="py-6">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý ngày nghỉ lễ</h3>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Năm trước"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <p className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              Năm {selectedYear}
            </p>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Năm sau"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            {selectedYear !== currentYear && (
              <button
                onClick={() => setSelectedYear(currentYear)}
                className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Về năm hiện tại
              </button>
            )}
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm ngày lễ
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">
              {editingId ? 'Chỉnh sửa ngày lễ' : 'Thêm ngày lễ mới'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên ngày lễ *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tết Nguyên Đán, Quốc Khánh..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Ngày *</Label>
                {selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDates.map((d) => (
                      <span key={d} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs border border-purple-200">
                        {new Date(d).toLocaleDateString('vi-VN')}
                        <button
                          type="button"
                          className="text-purple-600 hover:text-purple-800"
                          onClick={() => setSelectedDates((prev) => prev.filter((x) => x !== d))}
                          aria-label="Remove date"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                      onClick={() => setSelectedDates([])}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}

                {/* Calendar multi-select */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => {
                        const d = new Date(viewYear, viewMonth, 1);
                        d.setMonth(d.getMonth() - 1);
                        setViewYear(d.getFullYear());
                        setViewMonth(d.getMonth());
                      }}
                    >
                      Tháng trước
                    </button>
                    <div className="text-sm font-medium">
                      {new Date(viewYear, viewMonth, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => {
                        const d = new Date(viewYear, viewMonth, 1);
                        d.setMonth(d.getMonth() + 1);
                        setViewYear(d.getFullYear());
                        setViewMonth(d.getMonth());
                      }}
                    >
                      Tháng sau
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600 mb-1">
                    <div>CN</div>
                    <div>T2</div>
                    <div>T3</div>
                    <div>T4</div>
                    <div>T5</div>
                    <div>T6</div>
                    <div>T7</div>
                  </div>
                  {(() => {
                    const blanks = Array(getFirstWeekday(viewYear, viewMonth)).fill(null);
                    const total = getDaysInMonth(viewYear, viewMonth);
                    const days = Array.from({ length: total }, (_, i) => i + 1);
                    const cells = [...blanks, ...days];
                    return (
                      <div className="grid grid-cols-7 gap-1">
                        {cells.map((val, idx) => {
                          if (val === null) return <div key={`b-${idx}`} />;
                          const iso = toISO(viewYear, viewMonth, val as number);
                          const selected = selectedDates.includes(iso);
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => {
                                setSelectedDates((prev) =>
                                  prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]
                                );
                              }}
                              className={`h-8 rounded border text-xs ${selected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500">Có thể thêm nhiều ngày — các ngày sẽ dùng chung tên.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Tên ngày lễ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Ngày</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có ngày nghỉ lễ nào trong năm {selectedYear}</p>
                    <p className="text-sm mt-1">Nhấn "Thêm ngày lễ" để tạo mới</p>
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-900">{holiday.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(holiday.date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(holiday)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(holiday.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {holidays.length > 0 && (
        <div className="text-sm text-gray-600">
          Tổng: {holidays.length} ngày nghỉ lễ
        </div>
      )}
    </div>
  );
}
