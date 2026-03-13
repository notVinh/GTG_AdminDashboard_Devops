import React from "react";
import { PlusIcon, TrashIcon } from "lucide-react";

interface ImageUploadGridProps {
  // Chấp nhận cả mảng (Sản phẩm) hoặc chuỗi đơn (Danh mục)
  images: string[] | string;
  // Dispatch có thể nhận mảng hoặc chuỗi
  setImages: (val: any) => void;
  onUpload: (file: File) => Promise<string | null>;
  multiple?: boolean; // Thêm để phân biệt chế độ
}

const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  images,
  setImages,
  onUpload,
  multiple = true, // Mặc định là true để không hỏng code cũ bên Product
}) => {
  // Chuẩn hóa: Luôn biến thành mảng để render giao diện đồng nhất
  const imageList = Array.isArray(images)
    ? images.filter((img) => img)
    : images
      ? [images]
      : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    if (!multiple) {
      // Chế độ Single: Chỉ lấy file đầu tiên
      const uploadedPath = await onUpload(files[0]);
      if (uploadedPath) {
        setImages(uploadedPath); // Trả về 1 string duy nhất
      }
    } else {
      // Chế độ Multiple: Upload tất cả
      const uploadPromises = files.map(async (file) => await onUpload(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(
        (path): path is string => path !== null,
      );

      if (successfulUploads.length > 0) {
        setImages((prev: string[]) => [
          ...(Array.isArray(prev) ? prev : []),
          ...successfulUploads,
        ]);
      }
    }

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    if (!multiple) {
      setImages(""); // Xóa string
    } else {
      setImages((prev: string[]) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {imageList.map((img, i) => (
        <div
          key={`${img}-${i}`}
          className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm"
        >
          <img src={img} alt="Upload" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removeImage(i)}
            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Ẩn nút "Tải ảnh" nếu là single và đã có ảnh */}
      {(multiple || imageList.length < 1) && (
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer group">
          <PlusIcon className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 mt-1 uppercase">
            Tải ảnh
          </span>
          <input
            type="file"
            multiple={multiple} // Cho phép chọn nhiều file hay không tùy vào mode
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
      )}
    </div>
  );
};

export default ImageUploadGrid;
