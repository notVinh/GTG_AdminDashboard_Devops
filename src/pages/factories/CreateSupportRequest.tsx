import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supportRequestApi, supportTypeApi } from "../../api/support-request";
import { employeeApi } from "../../api/employee";
import type { SupportType, SupportRequestItemDto, SupportRequest } from "../../types/support-request";
import type { EmployeeWithDetails } from "../../types";
import {
  HandCoins,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { filesApi } from "../../api/files";

interface SupportItemForm {
  supportTypeId: number | null;
  quantity: number;
  photoFiles: File[];  // Store File objects for upload later
  photoPreviewUrls: string[];  // Store preview URLs for display
  note: string;
}

export default function CreateSupportRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const requestId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const isEditMode = !!requestId;

  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [supportTypes, setSupportTypes] = useState<SupportType[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingRequest, setExistingRequest] = useState<SupportRequest | null>(null);

  // Form state
  const [requestDate, setRequestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [approverEmployeeIds, setApproverEmployeeIds] = useState<number[]>([]);
  const [items, setItems] = useState<SupportItemForm[]>([
    { supportTypeId: null, quantity: 1, photoFiles: [], photoPreviewUrls: [], note: "" },
  ]);
  const [note, setNote] = useState<string>("");

  // Load initial data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const me = await employeeApi.getMyEmployee();
        if (mounted && me) {
          const currentFactoryId = Number((me as any).factoryId);
          setFactoryId(currentFactoryId);

          // Fetch support types
          let types = await supportTypeApi.getByFactory(currentFactoryId);
          if (types.length === 0) {
            // Seed default types if none exist
            types = await supportTypeApi.seedDefaultTypes(currentFactoryId);
          }
          if (mounted) setSupportTypes(types);

          // Fetch employees for approver selection - chỉ lấy quản lý
          // Sử dụng listEmployeesWithDetails với filter isManager=true
          const result = await employeeApi.listEmployeesWithDetails(1, 1000, currentFactoryId, {
            isManager: 'true'
          });
          if (mounted) setEmployees(result.data);

          // Load existing request if in edit mode
          if (requestId) {
            const request = await supportRequestApi.getById(requestId);
            if (mounted && request) {
              setExistingRequest(request);
              // Populate form with existing data
              setRequestDate(new Date(request.requestDate).toISOString().split("T")[0]);
              // Convert approverEmployeeIds to number array (có thể là string array từ backend)
              const approverIds = request.approverEmployeeIds 
                ? request.approverEmployeeIds.map((id: any) => Number(id))
                : [];
              setApproverEmployeeIds(approverIds);
              setNote(request.note || "");

              // Convert items to form format
              if (request.items && request.items.length > 0) {
                const formItems: SupportItemForm[] = request.items.map((item) => ({
                  supportTypeId: item.supportTypeId,
                  quantity: item.quantity,
                  photoFiles: [], // Existing photos are already URLs, not files
                  photoPreviewUrls: item.photoUrls || [], // Use existing photo URLs as preview
                  note: item.note || "",
                }));
                setItems(formItems);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        showToast("Không thể tải dữ liệu", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  // Get selected support type
  const getSupportType = (typeId: number | null): SupportType | undefined => {
    if (!typeId) return undefined;
    // Ensure both are compared as numbers
    return supportTypes.find((t) => Number(t.id) === Number(typeId));
  };

  // Add new item
  const handleAddItem = () => {
    setItems([
      ...items,
      { supportTypeId: null, quantity: 1, photoFiles: [], photoPreviewUrls: [], note: "" },
    ]);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item
  const handleUpdateItem = (
    index: number,
    field: keyof SupportItemForm,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Reset quantity to 1 if support type doesn't require quantity
    if (field === "supportTypeId") {
      const type = getSupportType(value);
      if (type && !type.requireQuantity) {
        newItems[index].quantity = 1;
      }
    }

    setItems(newItems);
  };

  // Handle photo selection (preview only, upload on submit)
  const handlePhotoSelect = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentCount = items[index].photoFiles.length;
    const maxAllowed = 5 - currentCount;

    if (maxAllowed <= 0) {
      showToast("Đã đạt giới hạn 5 ảnh", "error");
      return;
    }

    // Limit files to add
    const filesToAdd = Array.from(files).slice(0, maxAllowed);
    if (files.length > maxAllowed) {
      showToast(`Chỉ có thể thêm ${maxAllowed} ảnh nữa`, "warning");
    }

    // Create preview URLs
    const previewUrls = filesToAdd.map((file) => URL.createObjectURL(file));

    const newItems = [...items];
    newItems[index].photoFiles = [...newItems[index].photoFiles, ...filesToAdd].slice(0, 5);
    newItems[index].photoPreviewUrls = [...newItems[index].photoPreviewUrls, ...previewUrls].slice(0, 5);
    setItems(newItems);

    // Reset input value to allow selecting same file again
    event.target.value = "";
  };

  // Remove photo
  const handleRemovePhoto = (itemIndex: number, photoIndex: number) => {
    const newItems = [...items];
    // Revoke object URL to free memory
    URL.revokeObjectURL(newItems[itemIndex].photoPreviewUrls[photoIndex]);
    newItems[itemIndex].photoFiles = newItems[itemIndex].photoFiles.filter(
      (_, i) => i !== photoIndex
    );
    newItems[itemIndex].photoPreviewUrls = newItems[itemIndex].photoPreviewUrls.filter(
      (_, i) => i !== photoIndex
    );
    setItems(newItems);
  };

  // Toggle approver
  const handleToggleApprover = (empId: number) => {
    const empIdNum = Number(empId);
    const isSelected = approverEmployeeIds.some((id) => Number(id) === empIdNum);
    if (isSelected) {
      setApproverEmployeeIds(approverEmployeeIds.filter((id) => Number(id) !== empIdNum));
    } else {
      setApproverEmployeeIds([...approverEmployeeIds, empIdNum]);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!requestDate) {
      showToast("Vui lòng chọn ngày", "error");
      return false;
    }

    if (approverEmployeeIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 người duyệt", "error");
      return false;
    }

    const validItems = items.filter((item) => item.supportTypeId !== null);
    if (validItems.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 loại hỗ trợ", "error");
      return false;
    }

    for (const item of validItems) {
      const type = getSupportType(item.supportTypeId);
      // Nếu đơn đã approved, cho phép không có ảnh mới (vì có thể đã có ảnh cũ)
      const existingItem = isEditMode 
        ? existingRequest?.items?.find((i) => i.supportTypeId === item.supportTypeId)
        : null;
      const hasExistingPhotos = existingItem?.photoUrls && existingItem.photoUrls.length > 0;
      
      if (type?.requirePhoto && item.photoFiles.length === 0 && !hasExistingPhotos) {
        showToast(`"${type.name}" yêu cầu ảnh chứng minh`, "error");
        return false;
      }
      if (type?.requireQuantity && (!item.quantity || item.quantity <= 0)) {
        showToast(`"${type.name}" yêu cầu nhập số lượng`, "error");
        return false;
      }
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm() || !factoryId) return;

    setSubmitting(true);
    try {
      // Upload all photos first
      const validItems: SupportRequestItemDto[] = [];

      for (const item of items) {
        if (item.supportTypeId === null) continue;

        let photoUrls: string[] | undefined;

        // Upload photos if any
        if (item.photoFiles.length > 0) {
          const results = await filesApi.uploadMultiple(item.photoFiles);
          photoUrls = results.map((r) => r.path).filter(Boolean);
        }

        // Nếu đang edit, merge ảnh mới với ảnh cũ (nếu có)
        if (isEditMode && existingRequest) {
          const existingItem = existingRequest.items?.find(
            (i) => Number(i.supportTypeId) === Number(item.supportTypeId)
          );
          if (existingItem?.photoUrls && existingItem.photoUrls.length > 0) {
            const existingUrls = existingItem.photoUrls;
            if (photoUrls && photoUrls.length > 0) {
              // Có ảnh mới: merge với ảnh cũ (lọc duplicate)
              const newUrls = photoUrls.filter(url => !existingUrls.includes(url));
              photoUrls = [...existingUrls, ...newUrls];
            } else {
              // Không có ảnh mới: giữ nguyên ảnh cũ (để không bị validate fail)
              photoUrls = existingUrls;
            }
          }
        }

        validItems.push({
          supportTypeId: item.supportTypeId,
          quantity: item.quantity,
          photoUrls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
          note: item.note || undefined,
        });
      }

      if (isEditMode && requestId) {
        // Update existing request
        await supportRequestApi.update(requestId, {
          approverEmployeeIds,
          items: validItems,
          note: note || undefined,
        });
      } else {
        // Create new request
        await supportRequestApi.create({
          factoryId,
          requestDate,
          approverEmployeeIds,
          items: validItems,
          note: note || undefined,
        });
      }

      // Clean up preview URLs
      items.forEach((item) => {
        item.photoPreviewUrls.forEach((url) => {
          // Chỉ revoke object URLs (blob URLs), không revoke HTTP URLs
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      });

      showToast(
        isEditMode ? "Cập nhật yêu cầu hỗ trợ thành công" : "Tạo yêu cầu hỗ trợ thành công",
        "success"
      );
      navigate("/nha-may-cua-toi/bao-ho-tro");
    } catch (error: any) {
      console.error("Failed to create support request:", error);
      const message = error?.message || "Không thể tạo yêu cầu hỗ trợ";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/nha-may-cua-toi/bao-ho-tro")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <HandCoins className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">
              {isEditMode ? "Cập nhật báo cáo hỗ trợ" : "Tạo báo cáo hỗ trợ"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditMode 
                ? existingRequest?.employee?.user?.fullName
                  ? `Nhân viên: ${existingRequest.employee.user?.fullName || '-'} - Ngày: ${new Date(existingRequest.requestDate).toLocaleDateString('vi-VN')}`
                  : "Cập nhật thông tin báo cáo hỗ trợ"
                : "Tạo báo cáo hỗ trợ mới cho nhân viên"}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Info Banner - Chỉ hiển thị khi edit */}
      {isEditMode && existingRequest?.employee && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thông tin nhân viên */}
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">
                Thông tin nhân viên
              </div>
              <div className="text-base font-semibold text-gray-900">
                {existingRequest.employee.user?.fullName || `Nhân viên #${existingRequest.employeeId}`}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {existingRequest.employee.department?.name && (
                  <span>{existingRequest.employee.department?.name || '-'}</span>
                )}
                {existingRequest.employee.position?.name && (
                  <span className="ml-2">- {existingRequest.employee.position?.name || '-'}</span>
                )}
              </div>
            </div>

            {/* Người duyệt */}
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">
                Người duyệt được chỉ định
              </div>
              {existingRequest.approvers && existingRequest.approvers.length > 0 ? (
                <div className="space-y-1">
                  {existingRequest.approvers.map((approver) => (
                    <div key={approver.id} className="text-sm text-gray-900">
                      <span className="font-medium">{approver.user?.fullName || `#${approver.id}`}</span>
                      {(approver.position?.name || approver.department?.name) && (
                        <span className="text-gray-600 ml-2">
                          ({approver.position?.name || ''}
                          {approver.position?.name && approver.department?.name ? ' - ' : ''}
                          {approver.department?.name || ''})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Chưa có người duyệt</div>
              )}
            </div>

            {/* Ngày yêu cầu */}
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">
                Ngày yêu cầu
              </div>
              <div className="text-base font-semibold text-gray-900">
                {new Date(existingRequest.requestDate).toLocaleDateString('vi-VN')}
              </div>
              {existingRequest.status && (
                <div className="text-sm text-gray-600 mt-1">
                  Trạng thái: <span className="font-medium capitalize">
                    {existingRequest.status === 'pending' ? 'Chờ duyệt' :
                     existingRequest.status === 'approved' ? 'Đã duyệt' :
                     existingRequest.status === 'rejected' ? 'Từ chối' :
                     existingRequest.status === 'cancelled' ? 'Đã hủy' : existingRequest.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày yêu cầu <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={requestDate}
            onChange={(e) => setRequestDate(e.target.value)}
            disabled={isEditMode}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              Không thể thay đổi ngày yêu cầu khi cập nhật
            </p>
          )}
        </div>

        {/* Support Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Loại hỗ trợ <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Thêm loại
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedType = getSupportType(item.supportTypeId);
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Type Select */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Loại hỗ trợ
                        </label>
                        <select
                          value={item.supportTypeId || ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "supportTypeId",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Chọn loại hỗ trợ --</option>
                          {supportTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (if required) */}
                      {selectedType?.requireQuantity && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Số lượng ({selectedType.unit || "đơn vị"})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Photos (if required) */}
                  {selectedType?.requirePhoto && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">
                        Ảnh chứng minh <span className="text-red-500">*</span>
                        <span className="text-gray-400 ml-2">({item.photoPreviewUrls.length}/5)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {item.photoPreviewUrls.map((url, photoIdx) => (
                          <div key={photoIdx} className="relative group">
                            <img
                              src={url}
                              alt={`Photo ${photoIdx + 1}`}
                              className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index, photoIdx)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {item.photoPreviewUrls.length < 5 && (
                          <label className="h-20 w-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <Upload className="h-5 w-5 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoSelect(index, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Item Note */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ghi chú cho loại hỗ trợ này
                    </label>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) =>
                        handleUpdateItem(index, "note", e.target.value)
                      }
                      placeholder="Ghi chú (tùy chọn)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approvers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Người duyệt <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Chọn một hoặc nhiều người duyệt cho yêu cầu này
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {employees.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={approverEmployeeIds.some((id) => Number(id) === Number(emp.id))}
                  onChange={() => handleToggleApprover(emp.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {(emp as any).user?.fullName || `Employee #${emp.id}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(emp as any).position?.name || ""}{" "}
                    {(emp as any).department?.name
                      ? `- ${(emp as any).department?.name || '-'}`
                      : ""}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {approverEmployeeIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Đã chọn {approverEmployeeIds.length} người duyệt
            </p>
          )}
        </div>

        {/* General Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú chung
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú cho yêu cầu (tùy chọn)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate("/nha-may-cua-toi/bao-ho-tro")}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditMode ? "Cập nhật" : "Tạo yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
