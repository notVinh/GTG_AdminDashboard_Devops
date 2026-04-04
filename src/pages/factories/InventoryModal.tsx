"use client";

import React from "react";
import {
  X,
  Warehouse,
  MapPin,
  Tag,
  Package,
  Boxes,
  Fingerprint,
  Info,
} from "lucide-react";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  inventoryData: any[];
}

const InventoryModal = ({
  isOpen,
  onClose,
  productName,
  inventoryData,
}: InventoryModalProps) => {
  if (!isOpen) return null;

  // // Lọc trùng theo stockCode để hiển thị danh sách kho duy nhất
  // const uniqueStocks = inventoryData.reduce((acc: any[], current) => {
  //   const x = acc.find((item) => item.stockCode === current.stockCode);
  //   if (!x) return acc.concat([current]);
  //   return acc;
  // }, []);

  // const totalQty = uniqueStocks.reduce(
  //   (sum, s) => sum + (s.closingQuantity || 0),
  //   0,
  // );

  // 1. Tính tổng tất cả số lượng từ 294 dòng
  const totalQty = inventoryData.reduce(
    (sum, item) => sum + (Number(item.closingQuantity) || 0),
    0,
  );

  // 2. Không lọc trùng nữa, dùng luôn mảng gốc
  const displayData = inventoryData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 ">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative max-h-[98vh] bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Warehouse size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest leading-none">
                Báo cáo chi tiết vật tư theo kho
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-bold flex items-center gap-1.5">
                <Info size={12} className="text-indigo-400" /> Dữ liệu tồn kho
                thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Summary Banner */}
          <div className="mb-6 p-5 bg-blue-900 rounded-[1.5rem] text-white flex items-center justify-between shadow-xl shadow-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Boxes size={24} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                  Tổng tồn tích lũy
                </p>
                <h4 className="text-xs font-bold text-indigo-200 mt-0.5 uppercase">
                  {productName}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-white">{totalQty}</span>
              <span className="text-[10px] font-bold ml-1.5 text-slate-400 uppercase tracking-tighter">
                Bộ
              </span>
            </div>
          </div>

          {/* Danh sách thẻ kho chi tiết */}
          <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
            {displayData.map((item, idx) => (
              <div
                key={item.id || idx} // Nên dùng id từ API nếu có để tối ưu render
                className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-300 hover:shadow-xl transition-all"
              >
                {/* Bên trái: Kho & Vật tư */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-indigo-500 font-mono border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                        {item.stockCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 uppercase ml-2 inline-block">
                        {item.stockName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 ml-11">
                    <div className="flex items-center gap-2">
                      <Fingerprint size={14} className="text-slate-400" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Mã VT:{" "}
                        <span className="text-slate-900 font-mono">
                          {item.inventoryItemCode}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-slate-400" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Tên VT:{" "}
                        <span className="text-slate-700">
                          {item.inventoryItemName}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bên phải: Số lượng */}
                <div className="mt-4 md:mt-0 md:pl-6 md:border-l md:border-slate-50 flex flex-col items-end justify-center min-w-[120px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Số lượng tồn
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-600">
                      {item.closingQuantity}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      {item.unitName || "Bộ"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
