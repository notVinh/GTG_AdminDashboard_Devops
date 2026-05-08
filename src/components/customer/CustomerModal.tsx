import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  Building2,
  CreditCard,
  Factory,
  HeartHandshake,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const CustomerModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
}) => {
  const [formData, setFormData] = useState<any>({});

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData); // Chế độ Sửa: Điền data có sẵn
    } else {
      setFormData({
        accountObjectCode: "",
        accountObjectName: "",
        address: "",
        taxCode: "",
        contactName: "",
        contactMobile: "",
        contactEmail: "",
        customerGroup: "agency_l1",
        priceGroup: "wholesale",
        discountRate: 0,
        creditLimit: 0,
        paymentTermDays: 30,
        debtGraceDays: 0,
        garmentType: "",
        workerScale: 0,
        averageMonthlyCapacity: 0,
        careIntervalDays: 30,
        careNote: "",
        shippingAddress: "",
      });
    }
  }, [initialData, isOpen]);
  // const [formData, setFormData] = useState({
  //   accountObjectCode: "",
  //   accountObjectName: "",
  //   address: "",
  //   taxCode: "",
  //   contactName: "",
  //   contactMobile: "",
  //   contactEmail: "",
  //   customerGroup: "agency_l1",
  //   priceGroup: "wholesale",
  //   discountRate: 0,
  //   creditLimit: 0,
  //   paymentTermDays: 30,
  //   debtGraceDays: 0,
  //   garmentType: "",
  //   workerScale: 0,
  //   averageMonthlyCapacity: 0,
  //   careIntervalDays: 30,
  //   careNote: "",
  //   shippingAddress: "",
  // });

  if (!isOpen) return null;

  const isEdit = !!initialData?.accountObjectCode;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (payload: any) => {
    if (isEdit) {
      await axios.patch(`${API_URL}/customers/${payload.id}`, payload);
    } else {
      await axios.post(`${API_URL}/customers`, payload);
    }

    onClose();
  };

  const tabs = [
    { id: "general", label: "Thông tin chung", icon: <Building2 size={18} /> },
    { id: "sales", label: "Kinh doanh & Nợ", icon: <CreditCard size={18} /> },
    { id: "production", label: "Sản xuất", icon: <Factory size={18} /> },
    { id: "care", label: "Chăm sóc", icon: <HeartHandshake size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit
              ? `Chỉnh sửa khách hàng: ${initialData.accountObjectCode}`
              : "Tạo khách hàng mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Tab: Thông tin chung */}
            {activeTab === "general" && (
              <>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã khách hàng *
                  </label>
                  <input
                    name="accountObjectCode"
                    value={formData.accountObjectCode || ""}
                    onChange={handleChange}
                    disabled={isEdit}
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="KH0001"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    name="accountObjectName"
                    value={formData.accountObjectName || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ trụ sở
                  </label>
                  <input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã số thuế
                  </label>
                  <input
                    name="taxCode"
                    value={formData.taxCode || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="w-30">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khu vực
                  </label>
                  <select
                    name="region"
                    value={formData.region || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="bac">Miền Bắc</option>
                    <option value="trung">Miền Trung</option>
                    <option value="nam">Miền Nam</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    name="contactName"
                    value={formData.contactName || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    name="contactMobile"
                    value={formData.contactMobile || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email liên hệ
                  </label>
                  <input
                    name="contactEmail"
                    value={formData.contactEmail || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
              </>
            )}

            {/* Tab: Kinh doanh & Công nợ */}
            {activeTab === "sales" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhóm khách hàng
                  </label>
                  <select
                    name="customerGroup"
                    value={formData.customerGroup || "agency_l1"}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="agency_l1">Đại lý cấp 1</option>
                    <option value="agency_l2">Đại lý cấp 2</option>
                    <option value="retail">Khách lẻ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người đại diện
                  </label>
                  <input
                    name="legalRepresentative"
                    value={formData.legalRepresentative || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn mức nợ (VNĐ)
                  </label>
                  <input
                    name="creditLimit"
                    value={formData.creditLimit || 0}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số ngày được nợ
                  </label>
                  <input
                    name="paymentTermDays"
                    value={formData.paymentTermDays || 30}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chiết khấu (%)
                  </label>
                  <input
                    name="discountRate"
                    value={formData.discountRate || 0}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    name="isBlockedDebt"
                    checked={formData.isBlockedDebt || false}
                    id="isBlockedDebt"
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label
                    htmlFor="isBlockedDebt"
                    className="text-sm font-medium text-red-600"
                  >
                    Khóa nợ khách hàng này
                  </label>
                </div>
              </>
            )}

            {/* Tab: Sản xuất (Ngành may) */}
            {activeTab === "production" && (
              <>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hàng may mặc
                  </label>
                  <input
                    name="garmentType"
                    value={formData.garmentType || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                    placeholder="Ví dụ: Jeans, Kaki..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quy mô công nhân
                  </label>
                  <input
                    name="workerScale"
                    value={formData.workerScale || 0}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năng suất (SP/Tháng)
                  </label>
                  <input
                    name="averageMonthlyCapacity"
                    value={formData.averageMonthlyCapacity || 0}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thiết bị hiện có
                  </label>
                  <textarea
                    name="currentEquipment"
                    value={formData.currentEquipment || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2 h-20"
                  />
                </div>
              </>
            )}

            {/* Tab: Chăm sóc khách hàng */}
            {activeTab === "care" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chu kỳ chăm sóc (ngày)
                  </label>
                  <input
                    name="careIntervalDays"
                    value={formData.careIntervalDays || 30}
                    type="number"
                    onChange={handleChange}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú chăm sóc
                  </label>
                  <textarea
                    name="careNote"
                    value={formData.careNote || ""}
                    onChange={handleChange}
                    className="w-full rounded-md border p-2 h-32"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => handleSubmit(formData)}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 rounded-md shadow-sm"
          >
            <Save size={18} /> {isEdit ? "Cập nhật thay đổi" : "Lưu khách hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
