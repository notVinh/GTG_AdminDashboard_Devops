"use client";

import axios from "axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PrintTemplate = () => {
  //   const today = new Date();

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();

  const data = location.state?.quotationData;

  const handleSend = async () => {
    setIsLoading(true);
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/quotations/send-email/${data.quotationId}`,
    );

    setIsLoading(false);
    alert(res.data.message);
    navigate("/danh-sach-bao-gia");
  };

  return (
    <>
      <div
        //   ref={ref}
        className="bg-white p-[10mm] w-[210mm] min-h-[297mm] mx-auto text-black text-[11px] leading-tight font-sans"
      >
        {/* HEADER: LOGO & CONTACT INFO */}
        <div className="flex items-center justify-between border-b border-gray-300 pb-2">
          <div className="w-1/4">
            <span className="text-yellow-400 text-5xl font-black italic">
              GTG
            </span>
          </div>
          <div className="w-3/4 text-right">
            <h2 className="text-red-600 font-bold text-[14px] uppercase">
              Giang Thành chuyên cung cấp máy công nghệ sử dụng trong ngành dệt
              may
            </h2>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 text-[9px] text-gray-700">
          <div>
            <p>
              VP Hà Nội: TT03-03, Số 190 Phố Sài Đồng, P. Phúc Lợi, Q. Long
              Biên, TP. Hà Nội
            </p>
            <p>VP HCM: Số 330 Bùi Văn Ngữ, P. Tân Thới Hiệp, Q.12, TP. HCM</p>
            <p>
              VP Đà Nẵng: Số 5 đường Võ Như Hưng, P. Điện Bàn Đông, TP. Đà Nẵng
            </p>
            <p>
              VP Gia Lai: Số 5 đường Trường Thị, P. An Nhơn Nam, Tỉnh Gia Lai
            </p>
          </div>
          <div className="text-right">
            <p>Máy: 0961 230 808 – Linh kiện: 0963 322 227</p>
            <p>Email: vanlien@maymaygiangthanh.com</p>
            <p>Website: maymaygiangthanh.com / gtgsew.com</p>
          </div>
        </div>
        {/* TIÊU ĐỀ BÁO GIÁ */}
        <div className="mt-6 text-center">
          <h1 className="text-xl font-bold uppercase underline">BÁO GIÁ</h1>
          <p className="mt-1 font-bold">
            Kính gửi: {data.customerName?.toUpperCase() || "QUÝ KHÁCH HÀNG"}
          </p>
          <div className="flex justify-end mt-1 italic text-[10px]">
            <span>
              Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{" "}
              {new Date().getFullYear()}
            </span>
          </div>
        </div>
        <p className="mt-4 italic text-[10px]">
          Trước hết chúng tôi chân thành cảm ơn sự quan tâm và tin dùng các sản
          phẩm và dịch vụ của Công ty Cổ Phần Đầu Tư phát triển Giang Thành. Nhà
          cung cấp giải pháp CAD/CAM, và máy móc công nghệ hàng đầu cho ngành
          May mặc. Chúng tôi hân hạnh gửi đến Quý công ty Bảng báo giá về máy
          công nghệ ngành may như sau:
        </p>
        {/* BẢNG BÁO GIÁ ĐÚNG CỘT TRONG ẢNH */}
        <table className="w-full mt-4 border-collapse border border-black">
          <thead className="bg-[#d9ead3] text-[9px] font-bold uppercase">
            <tr>
              <th className="border border-black p-1 w-8">STT</th>
              <th className="border border-black p-1">Loại thiết bị</th>
              <th className="border border-black p-1">Hình ảnh</th>
              <th className="border border-black p-1 w-16">Thương Hiệu</th>
              <th className="border border-black p-1 w-16">Model</th>
              <th className="border border-black p-1">Thông tin máy</th>
              <th className="border border-black p-1 w-12">Số lượng</th>
              <th className="border border-black p-1 w-16">Đơn giá (USD)</th>
              <th className="border border-black p-1 w-16">Thành tiền (USD)</th>
              <th className="border border-black p-1 w-16">
                Thời gian đặt hàng
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item: any, index: number) => (
              <tr key={index} className="min-h-[100px] text-[10px]">
                <td className="border border-black p-1 text-center">
                  {index + 1}
                </td>
                <td className="border border-black p-1 font-bold">
                  {
                    item.product.translations.find(
                      (i: any) => i.languageCode === "vi",
                    ).name
                  }
                </td>
                <td className="border border-black p-1">
                  <div className="w-full h-16  flex items-center justify-center text-[8px] text-gray-400 italic">
                    <img
                      src={item.product.images[0]}
                      alt="Product"
                      className="w-20 h-auto"
                    />
                  </div>
                </td>
                <td className="border border-black p-1 text-center font-bold">
                  {item.brand || "GTG"}
                </td>
                <td className="border border-black p-1 text-center italic">
                  {item.product.id}
                </td>
                <td className="border border-black p-1 text-[9px]">
                  {item.specs}
                </td>
                <td className="border border-black p-1 text-center">
                  {item.quantity}
                </td>
                <td className="border border-black p-1 text-right">
                  {item.unitPrice.toLocaleString()}
                </td>
                <td className="border border-black p-1 text-right font-bold italic">
                  {(item.quantity * item.unitPrice)?.toLocaleString()}
                </td>
                <td className="border border-black p-1 text-center text-red-600 font-bold">
                  {item.leadTime || "Hàng có sẵn"}
                </td>
              </tr>
            ))}
            {/* Fill thêm hàng trống cho đủ khung 4 dòng như ảnh */}
            {[...Array(Math.max(0, 4 - (data.items?.length || 0)))].map(
              (_, i) => (
                <tr key={`empty-${i}`} className="h-24 border border-black">
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black font-bold text-center">
                    -
                  </td>
                  <td className="border border-black"></td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {/* ĐIỀU KHOẢN KHÁC */}
        <div className="mt-4 text-[10px] leading-tight">
          <p className="font-bold underline italic text-gray-800">
            Điều khoản khác:
          </p>
          <ul className="list-none mt-1 space-y-0.5">
            <li>- Báo giá trên có giá trị: 15 ngày kể từ khi báo giá.</li>
            <li>- Giá trên chưa bao gồm thuế VAT.</li>
            <li>- Hàng mới 100%, bảo hành 12 tháng</li>
            <li>- Giao hàng tại nhà máy của quý Công ty.</li>
            <li>
              - Thanh toán: Trước 70% giá trị đơn hàng ngay sau khi ký hợp đồng,
              30% ngay sau khi lắp đặt máy.
            </li>
            <li>
              - Tỷ giá: Áp dụng theo{" "}
              <span className="text-red-600 font-bold italic underline">
                Tỷ giá bán ra
              </span>{" "}
              của ngân hàng Vietcombank tại Thời điểm làm hợp đồng
            </li>
            <li>
              - Thời gian đặt hàng: 30 ngày không tính Thứ 7- Chủ nhật và các
              ngày Lễ.
            </li>
          </ul>
        </div>
        {/* THÔNG TIN THANH TOÁN */}
        <div className="mt-4 text-[10px]">
          <p className="font-bold underline">Thông tin thanh toán:</p>
          <p>Đơn vị hưởng: CÔNG TY CỔ PHẦN ĐẦU TƯ PHÁT TRIỂN GIANG THÀNH</p>
          <p>
            Tài khoản số: 1059558688 tại Ngân hàng TMCP Ngoại Thương Việt Nam –
            Chi nhánh Hà Thành
          </p>
          <p className="mt-2 font-bold italic">
            Mọi chi tiết liên hệ:{" "}
            <span className="text-red-600">Mr. Liên 0967 118 879</span>
          </p>
        </div>
        {/* CHỮ KÝ & CON DẤU */}
        <div className="mt-4 flex justify-end">
          <div className="text-center w-80 relative">
            <p className="uppercase font-bold text-[9px] mb-10">
              CÔNG TY CP ĐẦU TƯ PHÁT TRIỂN GIANG THÀNH
            </p>

            {/* Khu vực con dấu & chữ ký đè lên nhau như ảnh */}
            <div className="relative h-24 flex items-center justify-center">
              {/* Bạn có thể thay bằng thẻ <img> con dấu đỏ đã tách nền */}
              <img src="/sign.png" alt="GDsign" />
              {/* <div className="absolute w-24 h-24 border-2 border-red-500 rounded-full opacity-30 flex items-center justify-center text-[8px] text-red-500 font-bold text-center">
                MẪU DẤU <br /> GIANG THÀNH
              </div>
              <span className="text-blue-600 font-serif italic text-2xl z-10 translate-x-4">
                Lien
              </span> */}
            </div>

            {/* <p className="font-bold text-red-600 underline">CHỦ TỊCH HĐQT</p>
            <p className="font-bold text-red-600 italic text-lg uppercase">
              Phạm Văn Liên
            </p> */}
          </div>
        </div>
      </div>
      <div className="w-full flex flex-row justify-center px-20 my-2">
        <button
          className="bg-blue-500 text-white rounded-xl py-3 px-7 cursor-pointer hover:opacity-80"
          onClick={handleSend}
        >
          {isLoading ? "Dang gui" : "Gui bao gia"}
        </button>
      </div>
    </>
  );
};

export default PrintTemplate;
