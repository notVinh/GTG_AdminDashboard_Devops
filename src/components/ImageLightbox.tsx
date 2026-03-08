interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  label: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageUrl,
  label,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: ImageLightboxProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={imageUrl} alt="Xem ảnh" className="max-h-[80vh] max-w-full object-contain" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-md hover:bg-black/80 transition-colors cursor-pointer"
        >
          Đóng
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
          {label} {index + 1}/{total}
        </div>
        {total > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute top-1/2 -translate-y-1/2 left-3 bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={onNext}
              className="absolute top-1/2 -translate-y-1/2 right-3 bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

