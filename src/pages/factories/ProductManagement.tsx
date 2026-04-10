import React, { useState, useEffect, use } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  GlobeIcon,
  SettingsIcon,
  ListIcon,
  PackageIcon,
} from "lucide-react";
import axios from "axios";
import TiptapEditor from "../../components/TipTapEditor";
import ImageUploadGrid from "../../components/ImageUploadGrid";
import {
  languageListItem,
  type CategoryType,
  type ProductTranslationType,
  type ProductType,
} from "../../types/quotation";
import { formatNumber, parseNumber } from "../../lib/changevnd";
import InventoryModal from "./InventoryModal";

const API_URL = `${import.meta.env.VITE_API_URL}`;

const languageList = [...languageListItem];

const createListTemp = [
  {
    languageCode: "vi",
    name: "",
    description: "",
    price: "Liên hệ",
    features: [""],
    specs: [{ label: "", value: "" }],
    slug: "",
  },
  {
    languageCode: "en",
    name: "",
    description: "",
    price: "Contact",
    features: [""],
    specs: [{ label: "", value: "" }],
    slug: "",
  },
  {
    languageCode: "zh",
    name: "",
    description: "",
    price: "联系我们",
    features: [""],
    specs: [{ label: "", value: "" }],
    slug: "",
  },
  {
    languageCode: "cn",
    name: "",
    description: "",
    price: "联系我们",
    features: [""],
    specs: [{ label: "", value: "" }],
    slug: "",
  },
];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductType | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLang, setSelectedLang] = useState("vi"); // Ngôn ngữ hiển thị bảng

  // const raw = localStorage.getItem("employee_info");
  // const parsed = raw ? JSON.parse(raw) : { permissions: [] };

  // const fetchData = async () => {
  //   try {
  //     // Lấy sản phẩm kèm tham số lang để hiển thị đúng tên trên bảng
  //     const prodRes = await axios.get(
  //       `${API_URL}/products?lang=${selectedLang}`,
  //     );
  //     setProducts(prodRes.data.data || prodRes.data);

  //     const cateRes = await axios.get(`${API_URL}/categories`);

  //     setCategories(cateRes.data);
  //     console.log(cateRes);
  //   } catch (error) {
  //     console.error("Lỗi load dữ liệu:", error);
  //   }
  // };

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const fetchData = async (page = 1) => {
    // Chạy cả 2 cùng lúc, không cái nào đợi cái nào
    const fetchProducts = axios
      .get(
        `${API_URL}/products?lang=${selectedLang}&page=${page}&limit=${pagination.limit}`,
      )
      .then((res) => {
        setProducts(res.data.data || res.data);
        if (res.data.meta) {
          setPagination((prev) => ({
            ...prev,
            currentPage: res.data.meta.page,
            totalItems: res.data.meta.total,
            limit: res.data.meta.limit,
            totalPages: Math.ceil(res.data.meta.total / res.data.meta.limit),
          }));
        }
      })
      .catch((err) => console.error("Lỗi load sản phẩm:", err));

    const fetchCategories = axios
      .get(`${API_URL}/categories`)
      .then((res) => setCategories(res.data.data))
      .catch((err) => console.error("Lỗi load danh mục:", err));

    await Promise.all([fetchProducts, fetchCategories]);
  };

  useEffect(() => {
    fetchData(pagination.currentPage);
  }, [selectedLang, pagination.currentPage]); // Re-fetch khi đổi ngôn ngữ hiển thị

  // Xử lý tìm kiếm Debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm) {
        const res = await axios.get(
          `${API_URL}/products/search?search=${searchTerm}&lang=${selectedLang}`,
        );
        setProducts(res.data);
      } else {
        fetchData();
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleDelete = async (id: any) => {
    if (
      window.confirm("Xác nhận xóa máy này? Toàn bộ bản dịch sẽ bị xóa theo.")
    ) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchData();
      } catch (error) {
        alert("Lỗi khi xóa sản phẩm" + error);
      }
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Sản phẩm
            </h1>
            <p className="text-gray-500 mt-1">Quản lý sản phẩm đa ngôn ngữ</p>
            {/* Bộ lọc ngôn ngữ hiển thị trên bảng */}
            <div className="flex bg-white border border-gray-200 rounded-full p-1 shadow-sm mt-4 w-fit ">
              {languageList.map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLang(l)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase transition ${
                    selectedLang === l
                      ? "bg-indigo-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentProduct(null);

                setIsModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl uppercase text-sm"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>

        <div className="mb-6 relative max-w-md">
          <SearchIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Tìm kiếm tên máy (${selectedLang.toUpperCase()})...`}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã Máy
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tên Thiết Bị ({selectedLang})
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Danh Mục
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Thương Hiệu
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod: ProductType) => (
                <tr key={prod.id} className="hover:bg-indigo-50/30 transition">
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                    {prod.id}
                  </td>
                  <td className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors overflow-hidden ml-7">
                    {prod.images?.length > 0 ? (
                      <img
                        src={(prod?.images as any[])[0]}
                        alt="hinhanh"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PackageIcon className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {/* displayName được service backend bóc tách theo lang gửi lên */}
                    {prod?.translations?.find(
                      (t) => t.languageCode === selectedLang,
                    )?.name || "N.A"}
                  </td>
                  <td className="px-3 py-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                      {prod.category?.translations?.find(
                        (t: any) => t.languageCode === selectedLang,
                      )?.name || "Chưa phân loại"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium text-center">
                    {prod.brand}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1  flex flex-row items-center justify-center">
                    <button
                      onClick={() => {
                        setCurrentProduct(prod);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination UI */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-medium">
              Hiển thị{" "}
              <span className="text-indigo-600 font-bold">
                {products.length}
              </span>{" "}
              trên <span className="font-bold">{pagination.totalItems}</span>{" "}
              sản phẩm
            </div>

            <div className="flex gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: p.currentPage - 1,
                  }))
                }
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setPagination((p) => ({ ...p, currentPage: i + 1 }))
                  }
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    pagination.currentPage === i + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: p.currentPage + 1,
                  }))
                }
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={currentProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          refreshData={fetchData}
        />
      )}
    </div>
  );
};

//   );
// };

const ProductModal = ({
  product,
  categories,
  onClose,
  refreshData,
}: {
  product: ProductType | null;
  categories: CategoryType[];
  onClose: () => void;
  refreshData: () => void;
}) => {
  const [activeTab, setActiveTab] = useState("vi");

  const [formData, setFormData] = useState<{
    id: string | number;
    brand: string;
    price: number;
    originalPrice: number;
    categoryId: string | number;
    images: string[];
    videos: string[];
    translations: ProductTranslationType[];
    model: string;
    misaModel?: string;
    inventoryBalance?: any[];
  }>({
    id: product?.id || "",
    brand: product?.brand || "",
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    categoryId: product?.category?.id || "",
    images: product?.images || [],
    videos: product?.videos || [],
    translations: product?.translations || createListTemp,
    model: product?.model || "",
    misaModel: product?.misaModel || "",
    inventoryBalance: product?.inventoryBalance || [],
  });

  const [selectedInventory, setSelectedInventory] = useState<any[] | null>(
    null,
  );

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await axios.get(`${API_URL}/products/${product?.id}`);
      setFormData({ ...formData, inventoryBalance: res.data.inventoryBalance });
    };
    fetchProduct();
  }, [product?.id]);

  console.log(formData);

  // --- Logic Xử lý Features (Mảng String) ---
  const handleFeatureChange = (lang: string, index: number, value: string) => {
    const newTrans = formData.translations.map((t) => {
      if (t.languageCode === lang) {
        const newFeats = [...t.features];
        newFeats[index] = value;
        return { ...t, features: newFeats };
      }
      return t;
    });
    setFormData({ ...formData, translations: newTrans });
  };

  const addFeature = (lang: string) => {
    const newTrans = formData.translations.map((t) => {
      if (t.languageCode === lang) {
        // Kiểm tra nếu t.features là null/undefined thì gán là [], sau đó mới spread
        const currentFeatures = Array.isArray(t.features) ? t.features : [];
        return { ...t, features: [...currentFeatures, ""] };
      }
      return t;
    });
    setFormData({ ...formData, translations: newTrans });
  };

  // --- Logic Xử lý Specs (Mảng Object {label, value}) ---
  const handleSpecChange = (
    lang: string,
    index: number,
    field: string,
    value: string,
  ) => {
    const newTrans = formData.translations.map((t) => {
      if (t.languageCode === lang) {
        const newSpecs = [...t.specs];
        newSpecs[index][field] = value;
        return { ...t, specs: newSpecs };
      }
      return t;
    });
    setFormData({ ...formData, translations: newTrans });
  };

  const addSpec = (lang: string) => {
    const newTrans = formData.translations.map((t) => {
      if (t.languageCode === lang) {
        // Kiểm tra nếu t.features là null/undefined thì gán là [], sau đó mới spread
        const currentSpecs = Array.isArray(t.specs) ? t.specs : [];
        return { ...t, specs: [...currentSpecs, { label: "", value: "" }] };
      }

      return t;
    });
    setFormData({ ...formData, translations: newTrans });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);

    try {
      if (product) {
        await axios.patch(`${API_URL}/products/${product.id}`, formData);
      } else {
        await axios.post(`${API_URL}/products`, formData);
      }
      refreshData();
      onClose();
    } catch (error) {
      alert("Lỗi lưu dữ liệu: " + error);
    }
  };

  const currentT = formData.translations.find(
    (t) => t.languageCode === activeTab,
  );

  // Nếu không tìm thấy (trường hợp hiếm), bạn có thể gán mặc định để tránh crash
  if (!currentT) return null;

  const handleUploadImage = async (file: any) => {
    const uploadFormData = new FormData();
    // QUAN TRỌNG: Tên field phải là 'file' giống trong @UseInterceptors(FileInterceptor('file'))
    uploadFormData.append("file", file);

    try {
      const token = localStorage.getItem("auth_token"); // Hoặc nơi bạn lưu JWT

      const res = await axios.post(
        `${API_URL}/files/upload-product-file`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Thêm token vì Backend của bạn có AuthGuard
            "x-folder-name": "product", // Chỉ định rõ ràng thư mục muốn lưu
          },
        },
      );

      // Theo cấu hình Backend của bạn, URL nằm ở res.data.data.path
      console.log("Ảnh đã upload:", res.data.data.path);
      return res.data.data.path;
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Bạn cần đăng nhập hoặc kiểm tra quyền upload ảnh!");
      return null;
    }
  };

  const updateTranslationField = (lang: string, field: string, value: any) => {
    const newTrans = formData.translations.map((t) => {
      if (t.languageCode === lang) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setFormData({ ...formData, translations: newTrans });
  };

  const totalQty = formData.inventoryBalance?.reduce(
    (sum, s) => sum + (s.closingQuantity || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header với Tabs Ngôn ngữ */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {product ? "Cập nhật thiết bị" : "Cấu hình thiết bị GTG mới"}
          </h2>
          <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
            {languageList.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === lang
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 overflow-y-auto grid grid-cols-12 gap-8"
        >
          {/* CỘT TRÁI: THÔNG TIN CHUNG (4/12) */}
          <div className="col-span-4 space-y-6 border-r pr-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
              <SettingsIcon className="w-4 h-4 mr-2" /> Thông số gốc
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Mã sản phẩm (ID)
              </label>
              <input
                disabled={!!product}
                required
                className="w-full bg-slate-100 border-none rounded-2xl p-4 font-mono text-indigo-600 font-bold "
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Model
              </label>
              <input
                className="w-full bg-slate-100 border-none rounded-2xl p-4 font-mono text-indigo-600 font-bold "
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Misa Model
              </label>
              <input
                className="w-full bg-slate-100 border-none rounded-2xl p-4 font-mono text-indigo-600 font-bold "
                value={formData.misaModel}
                onChange={(e) =>
                  setFormData({ ...formData, misaModel: e.target.value })
                }
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex">
              Tồn kho: {totalQty || 0} {totalQty > 0 ? "sản phẩm" : ""}
              <div
                onClick={() => {
                  setSelectedInventory(formData.inventoryBalance || []);
                }}
              >
                <span className="text-[10px] font-black uppercase text-indigo-600 ml-4 cursor-pointer hover:underline">
                  Xem kho
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Thương hiệu
              </label>
              <input
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 focus:border-indigo-500 outline-none"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>{" "}
            {/* <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Giá gốc
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 focus:border-indigo-500 outline-none"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: Number(e.target.value),
                  })
                }
              />
            </div>{" "} */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Giá gốc
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 focus:border-indigo-500 outline-none"
                // Khi load từ DB, formData.originalPrice là số, hàm formatNumber sẽ biến nó thành "1.000.000"
                value={formatNumber(formData.originalPrice)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Chỉ cho phép nhập số và dấu chấm (để format trực tiếp)
                  const numberValue = parseNumber(value);

                  setFormData({
                    ...formData,
                    originalPrice: numberValue, // Lưu vào DB vẫn là kiểu Number nguyên bản
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Giá bán (tham khảo)
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 focus:border-indigo-500 outline-none"
                value={formatNumber(formData.price)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Chỉ cho phép nhập số và dấu chấm (để format trực tiếp)
                  const numberValue = parseNumber(value);

                  setFormData({
                    ...formData,
                    price: numberValue, // Lưu vào DB vẫn là kiểu Number nguyên bản
                  });
                }}
              />
            </div>
            {/* <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Giá niêm yết
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 focus:border-indigo-500 outline-none"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div> */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Danh mục
              </label>
              <select
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 outline-none"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: Number(e.target.value),
                  })
                }
              >
                <option value="">Chọn danh mục...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.translations.find((t) => t.languageCode === activeTab)
                      ?.name ||
                      c.translations[0]?.name ||
                      "---"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-3 tracking-wider uppercase">
                Album Hình ảnh (IDC)
              </label>

              <ImageUploadGrid
                images={formData.images}
                setImages={(newImages) => {
                  // Vì setImages trong grid trả về mảng mới hoặc hàm cập nhật
                  const nextImages =
                    typeof newImages === "function"
                      ? newImages(formData.images)
                      : newImages;
                  setFormData({ ...formData, images: nextImages });
                }}
                onUpload={handleUploadImage}
                multiple={true}
              />

              <p className="text-[10px] text-slate-400 mt-2 italic">
                * Ảnh sẽ được lưu tự động vào thư mục /product trên Cloud
                Storage.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider">
                Video (URL)
              </label>
              {formData.videos.map((img, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 mb-2 justify-center"
                >
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-xs"
                    value={img}
                    onChange={(e) => {
                      const newImgs = [...formData.videos];
                      newImgs[i] = e.target.value;
                      setFormData({ ...formData, videos: newImgs });
                    }}
                  />
                  {/* Nút xóa */}
                  <button
                    type="button"
                    onClick={() => {
                      const newVideos = formData.videos.filter(
                        (_, index) => index !== i,
                      );
                      setFormData({ ...formData, videos: newVideos });
                    }}
                    className="p-1 my-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa link"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, videos: [...formData.videos, ""] })
                }
                className="text-xs text-indigo-600 font-bold"
              >
                + Thêm link video
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: NỘI DUNG ĐA NGÔN NGỮ (8/12) */}
          <div className="col-span-8 space-y-8">
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-6">
              <h3 className="font-black text-indigo-600 flex items-center uppercase text-sm">
                <GlobeIcon className="w-5 h-5 mr-2" /> Nội dung Tiếng{" "}
                {activeTab === "vi"
                  ? "Việt"
                  : activeTab === "en"
                    ? "Anh"
                    : "Trung"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border-2 border-white p-3 shadow-sm outline-none focus:border-indigo-400 bg-white"
                    value={currentT?.name}
                    onChange={(e) => {
                      const newTrans = formData.translations.map((t) =>
                        t.languageCode === activeTab
                          ? { ...t, name: e.target.value }
                          : t,
                      );
                      setFormData({ ...formData, translations: newTrans });
                    }}
                  />
                </div>
                <div className="col-span-2 mt-4">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Mô tả chi tiết ({activeTab})
                  </label>
                  <TiptapEditor
                    // Thêm key theo activeTab để Force Re-render editor khi đổi ngôn ngữ
                    key={activeTab}
                    value={currentT?.description || ""}
                    onUploadImage={handleUploadImage}
                    onChange={(html: string) =>
                      updateTranslationField(activeTab, "description", html)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Slug
                  </label>
                  <input
                    className="w-full rounded-2xl border-2 border-white p-3 shadow-sm outline-none font-mono text-xs bg-white"
                    value={currentT?.slug}
                    onChange={(e) => {
                      const newTrans = formData.translations.map((t) =>
                        t.languageCode === activeTab
                          ? { ...t, slug: e.target.value }
                          : t,
                      );
                      setFormData({ ...formData, translations: newTrans });
                    }}
                  />
                </div>
              </div>

              {/* FEATURES LIST */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center uppercase">
                  <ListIcon className="w-3 h-3 mr-1" /> Đặc điểm nổi bật
                </label>
                {(currentT?.features || []).map((feat: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      className="flex-1 rounded-xl border-2 border-white p-2 text-sm shadow-sm bg-white"
                      value={feat}
                      onChange={(e) =>
                        handleFeatureChange(activeTab, idx, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeats = currentT?.features.filter(
                          (_: string, i: number) => i !== idx,
                        );
                        setFormData({
                          ...formData,
                          translations: formData.translations.map((t) =>
                            t.languageCode === activeTab
                              ? { ...t, features: newFeats }
                              : t,
                          ),
                        });
                      }}
                    >
                      <TrashIcon className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFeature(activeTab)}
                  className="text-xs font-bold text-indigo-500"
                >
                  + Thêm dòng đặc điểm
                </button>
              </div>

              {/* SPECS LIST */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center uppercase">
                  <SettingsIcon className="w-3 h-3 mr-1" /> Thông số kỹ thuật
                </label>
                {(currentT?.specs || []).map((spec: any, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      placeholder="Tên thông số"
                      className="w-1/3 rounded-xl border-2 border-white p-2 text-sm shadow-sm font-bold bg-white"
                      value={spec.label}
                      onChange={(e) =>
                        handleSpecChange(
                          activeTab,
                          idx,
                          "label",
                          e.target.value,
                        )
                      }
                    />
                    <input
                      placeholder="Giá trị"
                      className="flex-1 rounded-xl border-2 border-white p-2 text-sm shadow-sm bg-white"
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecChange(
                          activeTab,
                          idx,
                          "value",
                          e.target.value,
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = currentT?.specs.filter(
                          (_: any, i: number) => i !== idx,
                        );
                        setFormData({
                          ...formData,
                          translations: formData.translations.map((t) =>
                            t.languageCode === activeTab
                              ? { ...t, specs: newSpecs }
                              : t,
                          ),
                        });
                      }}
                      className="p-1"
                    >
                      <TrashIcon className="w-4 h-4 text-red-300 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSpec(activeTab)}
                  className="text-xs font-bold text-indigo-500"
                >
                  + Thêm thông số kỹ thuật
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 text-slate-400 font-bold hover:text-slate-600 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition uppercase tracking-widest"
              >
                Lưu hệ thống
              </button>
            </div>
          </div>
          <InventoryModal
            isOpen={!!selectedInventory}
            onClose={() => setSelectedInventory(null)}
            productName={formData?.translations?.[0]?.name || "Sản phẩm"}
            inventoryData={formData?.inventoryBalance || []}
          />
        </form>
      </div>
    </div>
  );
};

export default ProductManagement;
