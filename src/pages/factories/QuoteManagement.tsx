"use client";

import React, { useState, useEffect } from "react";
import { Check, Printer, Edit3, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { QuotationItemType, QuotationType } from "../../types/quotation";
import ManualOrderForm from "../../components/ManualOrderForm";

export default function QuoteManagement() {
  const [quotations, setQuotations] = useState<QuotationType[]>([]);
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);

  const navigate = useNavigate();

  // 1. Giả lập dữ liệu (Sau này bạn thay bằng fetch từ API NestJS)
  useEffect(() => {
    const fetchData = async () => {
      const data = await axios.get(
        `${import.meta.env.VITE_API_URL}/quotations/admin/all`,
      );
      setQuotations(data.data);
    };
    // setQuotations([
    //   {
    //     id: 8,
    //     customerName: "Nguyễn Văn A",
    //     customerPhone: "0988123456",
    //     customerEmail: "vana@gmail.com",
    //     status: "pending",
    //     totalPrice: 0,
    //     items: [
    //       { id: 101, productId: "gtg-dt-01", quantity: 2, unitPrice: 0 },
    //       { id: 102, productId: "gtg-dt-02", quantity: 1, unitPrice: 0 },
    //     ],
    //   },
    // ]);
    fetchData();
  }, []);

  // 2. Logic cập nhật đơn giá trong Modal
  const handleItemPriceChange = (index: number, price: number) => {
    if (!selectedQuotation) return;
    const updatedItems = [...selectedQuotation.items];
    updatedItems[index].unitPrice = price;

    const newTotal = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    setSelectedQuotation({
      ...selectedQuotation,
      items: updatedItems,
      totalPrice: newTotal,
    });
  };

  // 3. Logic lưu (Gửi về Backend NestJS)
  // Fix lỗi tham số (parameter) có kiểu 'any' ngầm định
  const saveDetailedPrice = async (
    customerName: string,
    items: QuotationItemType[],
    quotationId: number,
    totalPrice: number,
  ) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/quotations/admin/update-details`,
        {
          quotationId,
          totalPrice,
          items: items,
        },
      );

      setQuotations((prev) =>
        prev.map((q) =>
          q.id === quotationId
            ? { ...q, status: "sent", totalPrice, items }
            : q,
        ),
      );

      setIsModalOpen(false);
      navigate("/form-bao-gia", {
        state: {
          quotationData: { customerName, items, quotationId },
        },
      });
    } catch (error) {
      alert("Lỗi khi cập nhật báo giá!" + error);
    }
  };

  // 4. Logic In ấn chuyên nghiệp
  const handlePrint = (q: QuotationType) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>In Báo Giá - ${q.customerName}</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="text-align: center;">BÁO GIÁ SẢN PHẨM</h1>
          <p>Khách hàng: <b>${q.customerName}</b> - ĐT: ${q.customerPhone}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #eee;">
                <th style="border: 1px solid #ddd; padding: 8px;">Sản phẩm</th>
                <th style="border: 1px solid #ddd; padding: 8px;">SL</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Đơn giá</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${q.items
                .map(
                  (i) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${i.productId}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${Number(i.unitPrice).toLocaleString()}đ</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${(i.quantity * i.unitPrice).toLocaleString()}đ</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <h3 style="text-align: right; color: blue;">Tổng cộng: ${q.totalPrice.toLocaleString()}đ</h3>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Quản lý Báo giá
          </h1>
        </div>

        {/* BẢNG DANH SÁCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 ">
                    <div className="font-semibold">{q.customerName}</div>
                    <div className="text-xs text-slate-500">
                      {q.customerPhone}
                    </div>
                    {/* <div className="text-xs text-slate-500">
                      {q.customerEmail}
                    </div> */}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {q.items.length} món
                  </td>
                  <td className="p-4 font-bold text-blue-600">
                    {Number(q.totalPrice).toLocaleString()}đ
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${q.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          /* API update status confirmed */
                        }}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuotation(q);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handlePrint(q)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg"
                      >
                        <Printer size={18} />
                      </button>
                      {/* <PrintTemplate
                        customerName="vinh"
                        items={[{ name: "sp1" }]}
                        totalPrice={20000}
                      /> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NHẬP GIÁ */}
      {isModalOpen && selectedQuotation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Chi tiết báo giá #{selectedQuotation.id}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X />
              </button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b">
                    <th className="pb-3 text-left">Mã sản phẩm</th>
                    <th className="pb-3 text-left">Tên sản phẩm</th>
                    <th className="pb-3 text-center">Số lượng</th>
                    <th className="pb-3 text-right">Đơn giá niêm yết</th>
                    <th className="pb-3 text-right">Đơn giá (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedQuotation.items.map((item: any, idx: number) => {
                    const vi_name = item.product?.translations.find(
                      (i: any) => i.languageCode === "vi",
                    );

                    return (
                      <tr key={item.id}>
                        <td className="py-4 font-medium">{item.productId}</td>
                        <td className="py-4 font-medium">{vi_name?.name}</td>
                        <td className="py-4 text-center">{item.quantity}</td>
                        <td className="py-4 text-center">
                          {Number(item.product?.price || 0).toLocaleString(
                            "vi-VN",
                            {
                              style: "currency",
                              currency: "VND",
                            },
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <input
                            type="number"
                            className="border rounded-lg px-3 py-1.5 w-32 text-right focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            // value={item.unitPrice}
                            onChange={(e) =>
                              handleItemPriceChange(idx, Number(e.target.value))
                            }
                            required
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                <span className="font-semibold text-blue-800">
                  Tổng tiền dự kiến:
                </span>
                <span className="text-2xl font-black text-blue-600">
                  {selectedQuotation.totalPrice.toLocaleString()}đ
                </span>
              </div>
              <div className=" flex flex-row items-center gap-2 mt-4">
                Trạng thái hiện tại:{" "}
                <span
                  className={`px-5 py-1.5 rounded-full text-sm font-medium 
                      ${selectedQuotation.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {selectedQuotation.status}
                </span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setOrderFormOpen(true)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Tạo đơn hàng
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (
                    !selectedQuotation.items.every(
                      (item) =>
                        item.unitPrice !== undefined && item.unitPrice > 0,
                    )
                  ) {
                    alert(
                      "Vui lòng nhập đầy đủ đơn giá cho tất cả các sản phẩm.",
                    );
                    return;
                  }
                  saveDetailedPrice(
                    selectedQuotation.customerName,
                    selectedQuotation.items,
                    selectedQuotation.id,
                    selectedQuotation.totalPrice,
                  );
                }}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Lưu & Gửi Báo Giá
              </button>
            </div>
          </div>
        </div>
      )}
      <ManualOrderForm
        isOpen={orderFormOpen}
        onClose={() => setOrderFormOpen(false)}
        onSuccess={() => {
          setOrderFormOpen(false);
          setSelectedQuotation(null);
        }}
        customerData={selectedQuotation}
      />
    </div>
  );
}
