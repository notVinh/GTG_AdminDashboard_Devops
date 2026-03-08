import React from "react";
import { PlusIcon, TrashIcon } from "lucide-react";

interface ImageUploadGridProps {
  images: string[]; // Mảng các URL ảnh
  setImages: React.Dispatch<React.SetStateAction<string[]>>; // Hàm cập nhật state
  onUpload: (file: File) => Promise<string | null>; // Hàm upload trả về URL hoặc null
}

const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  images,
  setImages,
  onUpload,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    // Sử dụng Promise.all để upload song song sẽ nhanh hơn vòng lặp for
    const uploadPromises = files.map(async (file) => {
      const uploadedPath = await onUpload(file);
      return uploadedPath;
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(
      (path): path is string => path !== null,
    );

    if (successfulUploads.length > 0) {
      setImages((prev) => [...prev, ...successfulUploads]);
    }

    // Reset value để có thể chọn lại cùng một file nếu cần
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {images
        .filter((img) => img)
        .map((img, i) => (
          <div
            key={`${img}-${i}`} // Dùng key kết hợp để tránh trùng lặp
            className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm"
          >
            <img
              src={img}
              alt="Product"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        ))}

      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer group">
        <PlusIcon className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 mt-1 uppercase">
          Tải ảnh
        </span>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
      </label>
    </div>
  );
};

export default ImageUploadGrid;
