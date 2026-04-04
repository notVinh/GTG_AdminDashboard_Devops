import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FolderPlusIcon,
  EyeIcon,
  PackageIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Warehouse,
} from "lucide-react";
import axios from "axios";
import {
  languageListItem,
  type CategoryType,
  type ProductType,
} from "../../types/quotation";
import ImageUploadGrid from "../../components/ImageUploadGrid";
import TiptapEditor from "../../components/TipTapEditor";
import TableSkeleton from "../../components/TableSkeleton";
import InventoryModal from "./InventoryModal";

const API_URL = import.meta.env.VITE_API_URL;
const categoryLanguageList = languageListItem;

const ProductCategoryManagement = () => {
  const [categories, setCategories] = useState([]); // Dữ liệu thô từ API
  const [displayLang, setDisplayLang] = useState("vi");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(
    null,
  );
  const [productsInCategory, setProductsInCategory] = useState<ProductType[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Lấy hết toàn bộ không phân trang
      const response = await axios.get(`${API_URL}/categories`);
      // Nếu server trả về dạng { data: [...] } thì lấy .data, nếu trả về mảng thẳng thì lấy response.data
      const rawData = Array.isArray(response.data)
        ? response.data
        : response.data.data;
      setCategories(rawData || []);
    } catch (error) {
      console.error("Lỗi fetch:", error);
    } finally {
      setIsLoading(false); // Luôn tắt loading kể cả lỗi
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Logic lấy sản phẩm cho Detail Modal
  useEffect(() => {
    if (currentCategory && isDetailModalOpen) {
      axios
        .get(`${API_URL}/categories/${currentCategory.id}/products`)
        .then((res) => setProductsInCategory(res.data.products || []))
        .catch((err) => console.error(err));
    }
  }, [currentCategory, isDetailModalOpen]);

  const getTrans = (cat: CategoryType, field: string) => {
    const t = cat.translations?.find(
      (item) => item.languageCode === displayLang,
    );
    return t
      ? (t as Record<string, any>)[field]
      : (cat.translations?.[0] as Record<string, any>)?.[field] || "---";
  };

  // --- LOGIC DỰNG CÂY VÀ SẮP XẾP ---
  const buildTree = (data: CategoryType[]) => {
    const map: Record<number, any> = {};
    const tree: any[] = [];

    data.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    data.forEach((item) => {
      const parentId = item.parentId;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[item.id]);
        map[parentId].children.sort(
          (a: any, b: any) => (a.order || 0) - (b.order || 0),
        );
      } else {
        tree.push(map[item.id]);
      }
    });

    return tree.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // --- LOGIC ĐỔI CHỖ (SWAP ORDER) ---
  const handleMove = async (
    currentCat: any,
    direction: "up" | "down",
    siblings: any[],
  ) => {
    const currentIndex = siblings.findIndex((s) => s.id === currentCat.id);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetCat = siblings[targetIndex];

    // Hoán đổi giá trị order
    const currentOrder = currentCat.order || 0;
    const targetOrder = targetCat.order || 0;

    try {
      // Cập nhật UI nhanh (Local)
      setCategories((prev: any) =>
        prev.map((c: any) => {
          if (c.id === currentCat.id) return { ...c, order: targetOrder };
          if (c.id === targetCat.id) return { ...c, order: currentOrder };
          return c;
        }),
      );

      // Gọi API cập nhật cả hai danh mục
      await Promise.all([
        axios.patch(`${API_URL}/categories/${currentCat.id}`, {
          order: targetOrder,
        }),
        axios.patch(`${API_URL}/categories/${targetCat.id}`, {
          order: currentOrder,
        }),
      ]);
    } catch (error) {
      console.error("Lỗi khi di chuyển:", error);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Xóa danh mục này sẽ ảnh hưởng đến các sản phẩm bên trong. Tiếp tục?",
      )
    ) {
      await axios.delete(`${API_URL}/categories/${id}`);
      fetchData();
    }
  };

  // --- RENDER DÒNG BẢNG (ĐỆ QUY ĐỂ THỤT LỀ) ---
  const renderCategoryRows = (items: CategoryType[], depth = 0) => {
    return items.map((cat, index) => (
      <React.Fragment key={cat.id}>
        <tr className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50">
          <td
            className={`px-6 py-4 text-xs  font-mono ${depth === 0 ? "text-indigo-500 font-semibold" : "text-gray-400"}`}
          >
            #{cat.order}
          </td>
          <td className="px-6 py-4">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${depth * 28}px` }}
            >
              {depth > 0 && <span className="text-slate-300 mr-2">└─</span>}
              <span
                className={`w-2 h-2 rounded-full mr-3 ${depth === 0 ? "bg-indigo-500" : "bg-slate-300"}`}
              ></span>
              <span
                className={`text-sm ${depth === 0 ? "font-black uppercase" : "font-bold"} text-slate-700`}
              >
                {getTrans(cat, "name")}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 text-center">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">
              {cat.products.length || 0} SP
            </span>
          </td>
          <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={index === 0}
                onClick={() => handleMove(cat, "up", items)}
                className={`p-1.5 rounded-lg transition ${index === 0 ? "text-slate-200" : "text-indigo-600 hover:bg-indigo-100"}`}
              >
                <ChevronUpIcon className="w-4 h-4" />
              </button>
              <button
                disabled={index === items.length - 1}
                onClick={() => handleMove(cat, "down", items)}
                className={`p-1.5 rounded-lg transition ${index === items.length - 1 ? "text-slate-200" : "text-indigo-600 hover:bg-indigo-100"}`}
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </td>
          <td className="px-6 py-4 text-right flex justify-end gap-1">
            <button
              onClick={() => {
                setCurrentCategory(cat);
                setIsDetailModalOpen(true);
              }}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentCategory(cat);
                setIsProductModalOpen(true);
              }}
              className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition"
            >
              <FolderPlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentCategory(cat);
                setIsModalOpen(true);
              }}
              className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </td>
        </tr>
        {cat.children &&
          cat.children.length > 0 &&
          renderCategoryRows(cat.children, depth + 1)}
      </React.Fragment>
    ));
  };

  const handleMoveProduct = async (
    currentProd: ProductType,
    direction: "up" | "down",
    siblings: ProductType[],
  ) => {
    const currentIndex = siblings.findIndex((p) => p.id === currentProd.id);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    console.log(currentProd);

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetProd = siblings[targetIndex];

    // Hoán đổi giá trị order
    const currentOrder = currentProd.order || 0;
    const targetOrder = targetProd.order || 0;

    try {
      // 1. Cập nhật UI local để mượt mà
      const updatedProducts = [...siblings];
      updatedProducts[currentIndex] = { ...currentProd, order: targetOrder };
      updatedProducts[targetIndex] = { ...targetProd, order: currentOrder };

      // Sắp xếp lại mảng local theo order mới
      updatedProducts.sort((a, b) => (a.order || 0) - (b.order || 0));
      setProductsInCategory(updatedProducts);

      // 2. Gọi API cập nhật (Giả định bạn có endpoint patch product)
      await Promise.all([
        axios.patch(`${API_URL}/products/${currentProd.id}`, {
          order: targetOrder,
        }),
        axios.patch(`${API_URL}/products/${targetProd.id}`, {
          order: currentOrder,
        }),
      ]);
    } catch (error) {
      console.error("Lỗi khi sắp xếp sản phẩm:", error);
      // Nếu lỗi thì fetch lại để đồng bộ
      if (currentCategory) {
        const res = await axios.get(
          `${API_URL}/categories/${currentCategory.id}/products`,
        );
        setProductsInCategory(res.data.products || []);
      }
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Danh mục
            </h1>
            <p className="text-gray-500 mt-1">
              Quản lý danh mục sản phẩm đa ngôn ngữ
            </p>
            {/* <div className="flex gap-2 mt-4 bg-white p-1 rounded-2xl border w-fit shadow-sm">
              {categoryLanguageList.map((l) => (
                <button
                  key={l}
                  onClick={() => setDisplayLang(l)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition ${displayLang === l ? "bg-slate-900 text-white" : "text-slate-400"}`}
                >
                  {l}
                </button>
              ))}
            </div> */}
            <div className="flex bg-white border border-gray-200 rounded-full p-1 shadow-sm mt-4 w-fit ">
              {categoryLanguageList.map((l) => (
                <button
                  key={l}
                  onClick={() => setDisplayLang(l)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase transition ${
                    displayLang === l
                      ? "bg-indigo-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentCategory(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl uppercase text-sm"
          >
            + Thêm danh mục
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">
                  STT
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">
                  Cấu trúc danh mục ({displayLang})
                </th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">
                  Sản phẩm
                </th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">
                  Thứ tự
                </th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            {/* <tbody>{renderCategoryRows(buildTree(categories))}</tbody> */}
            <tbody className="relative">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : (
                renderCategoryRows(buildTree(categories))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SỬA/THÊM - Tab ngôn ngữ */}
      {isModalOpen && (
        <CategoryModal
          category={currentCategory}
          allCategories={categories}
          onClose={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* RENDER CÁC MODAL KHÁC (DetailModal, AddProductToCategoryModal) NHƯ CŨ... */}
      {isDetailModalOpen && (
        <DetailModal
          category={currentCategory}
          products={productsInCategory}
          onClose={() => setIsDetailModalOpen(false)}
          currentLang={displayLang}
          onMoveProduct={handleMoveProduct}
        />
      )}
      {isProductModalOpen && (
        <AddProductToCategoryModal
          category={currentCategory}
          onClose={() => {
            setIsProductModalOpen(false);
            fetchData();
          }}
          currentLang={displayLang}
        />
      )}
    </div>
  );
};

// Component Modal chỉnh sửa (Giữ Tab ngôn ngữ như bạn yêu cầu)
const CategoryModal = ({
  category,
  allCategories,
  onClose,
}: {
  category: CategoryType | null;
  allCategories: CategoryType[];
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState("vi");
  const [formData, setFormData] = useState(() => {
    const initialTrans = categoryLanguageList.map((lang) => {
      const ex = category?.translations?.find((t) => t.languageCode === lang);
      return ex
        ? { ...ex }
        : { languageCode: lang, name: "", description: "", slug: "" };
    });
    return {
      parentId: category?.parentId || "",
      image: category?.image || "",
      translations: initialTrans,
    };
  });

  const createSlug = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD") // Chuẩn hóa Unicode để tách dấu
      .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu sau khi tách
      .replace(/[đĐ]/g, "d") // Xử lý riêng chữ đ
      .replace(/([^0-9a-z-\s])/g, "") // Xóa ký tự đặc biệt
      .replace(/(\s+)/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, "-") // Tránh nhiều dấu gạch ngang liền nhau
      .replace(/^-+|-+$/g, ""); // Xóa dấu gạch ngang ở đầu và cuối
  };

  // const handleUpdateField = (field: string, value: string) => {
  //   setFormData({
  //     ...formData,
  //     translations: formData.translations.map((t) =>
  //       t.languageCode === activeTab ? { ...t, [field]: value } : t,
  //     ),
  //   });
  // };
  // Tìm hàm này trong CategoryModal của bạn và thay thế:
  const handleUpdateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => {
        if (t.languageCode === activeTab) {
          const updatedNode = { ...t, [field]: value };

          // TỰ ĐỘNG SINH SLUG KHI NHẬP TÊN
          if (field === "name") {
            updatedNode.slug = createSlug(value);
          }

          return updatedNode;
        }
        return t;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: formData.parentId ? Number(formData.parentId) : null,
    };
    if (category)
      await axios.patch(`${API_URL}/categories/${category.id}`, payload);
    else await axios.post(`${API_URL}/categories`, payload);
    onClose();
  };

  const currentT = formData.translations.find(
    (t) => t.languageCode === activeTab,
  );

  // Nếu không tìm thấy (trường hợp hiếm), bạn có thể gán mặc định để tránh crash
  if (!currentT) return null;

  const handleUploadImage = async (file: any) => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file); // 'file' phải khớp với NestJS FileInterceptor

    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(
        `${API_URL}/files/upload-product-file`, // Dùng chung endpoint upload
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "x-folder-name": "category", // Lưu vào folder category
          },
        },
      );

      console.log("Ảnh danh mục đã upload:", res.data.data.path);
      return res.data.data.path;
    } catch (error) {
      console.error("Lỗi upload ảnh danh mục:", error);
      alert("Lỗi upload! Kiểm tra đăng nhập hoặc quyền hạn.");
      return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md  ">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50 ">
          <h2 className="font-black uppercase italic tracking-tighter">
            Cấu hình danh mục
          </h2>
          <div className="flex bg-slate-200 p-1 rounded-xl">
            {categoryLanguageList.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setActiveTab(l)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${activeTab === l ? "bg-white text-indigo-600" : "text-slate-400"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                Cấp cha
              </label>
              <select
                className="w-full bg-slate-100 border-none rounded-2xl p-4 font-bold"
                value={formData.parentId}
                onChange={(e) =>
                  setFormData({ ...formData, parentId: e.target.value })
                }
              >
                <option value="">Cấp cao nhất</option>
                {allCategories
                  .filter((c) => c.id !== category?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.translations?.find((t) => t.languageCode === "vi")
                        ?.name || c.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="ml-5">
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">
                Ảnh đại diện danh mục
              </label>

              <ImageUploadGrid
                // 1. images lúc này là 1 string duy nhất (ví dụ: formData.image)
                images={formData.image}
                // 2. setImages nhận thẳng giá trị string mới hoặc ""
                setImages={(val) => setFormData({ ...formData, image: val })}
                onUpload={handleUploadImage}
                // 3. Quan trọng: Tắt chế độ nhiều ảnh
                multiple={false}
              />

              <p className="text-[10px] text-slate-400 mt-2 italic">
                * Chỉ chọn 1 ảnh duy nhất làm đại diện.
              </p>
            </div>
          </div>
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-indigo-400 uppercase">
                  Tên ({activeTab})
                </label>
                <input
                  required
                  className="w-full bg-white rounded-xl p-3 shadow-sm outline-none focus:ring-2 ring-indigo-500"
                  value={currentT.name}
                  onChange={(e) => handleUpdateField("name", e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-indigo-400 uppercase">
                  Slug
                </label>
                <input
                  className="w-full bg-white rounded-xl p-3 shadow-sm font-mono text-xs"
                  value={currentT.slug}
                  onChange={(e) => handleUpdateField("slug", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase">
                  Mô tả
                </label>
                {/* <textarea
                  className="w-full bg-white rounded-xl p-3 shadow-sm h-20"
                  value={currentT.description}
                  onChange={(e) =>
                    handleUpdateField("description", e.target.value)
                  }
                /> */}
                <TiptapEditor
                  // Thêm key theo activeTab để Force Re-render editor khi đổi ngôn ngữ
                  key={activeTab}
                  value={currentT?.description || ""}
                  onUploadImage={handleUploadImage}
                  onChange={(html: string) =>
                    handleUpdateField("description", html)
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="font-black text-slate-400 uppercase text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs"
            >
              Lưu dữ liệu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailModal = ({
  category,
  products,
  onClose,
  currentLang,
  onMoveProduct, // Thêm prop này
}: {
  category: CategoryType | null;
  products: ProductType[];
  onClose: () => void;
  currentLang: string;
  onMoveProduct: (
    p: ProductType,
    dir: "up" | "down",
    list: ProductType[],
  ) => void;
}) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase opacity-60">
              Danh mục sản phẩm
            </p>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              {category?.translations?.find(
                (t) => t.languageCode === currentLang,
              )?.name || "Category"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 p-2 rounded-full hover:bg-white/40"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50">
          {products.length > 0 ? (
            products.map((prod, index) => {
              const totalQty = prod?.inventoryBalance?.reduce(
                (sum, s) => sum + (s.closingQuantity || 0),
                0,
              );
              return (
                <div
                  key={prod.id}
                  className="flex items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group"
                >
                  <div className="text-gray-500 text-sm">#{prod.order}</div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-indigo-600 transition-colors ml-4">
                    {prod.images?.length > 0 ? (
                      <img src={(prod?.images as any[])[0]} alt="hinhanh" />
                    ) : (
                      <PackageIcon className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 uppercase text-sm">
                      {prod.translations?.find(
                        (t) => t.languageCode === currentLang,
                      )?.name ||
                        prod.translations[0]?.name ||
                        "N.A"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ID: #{prod.id}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Model: {prod.model}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono flex">
                      Tồn kho: {totalQty || 0}{" "}
                      {totalQty > 0 ? "sản phẩm" : "hết hàng"}
                      <div onClick={() => setSelectedProduct(prod)}>
                        <span className="text-[10px] font-black uppercase text-indigo-600 ml-4 cursor-pointer hover:underline">
                          Xem kho
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-indigo-600 font-black text-sm mr-20">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(prod.originalPrice)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => onMoveProduct(prod, "up", products)}
                      className={`p-1.5 rounded-lg transition ${index === 0 ? "text-slate-200" : "text-indigo-600 hover:bg-indigo-100"}`}
                    >
                      <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      disabled={index === products.length - 1}
                      onClick={() => onMoveProduct(prod, "down", products)}
                      className={`p-1.5 rounded-lg transition ${index === products.length - 1 ? "text-slate-200" : "text-indigo-600 hover:bg-indigo-100"}`}
                    >
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 font-bold uppercase text-xs">
              Chưa có sản phẩm nào
            </div>
          )}
        </div>
      </div>
      <InventoryModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        productName={selectedProduct?.translations?.[0]?.name || "Sản phẩm"}
        inventoryData={selectedProduct?.inventoryBalance || []}
      />
    </div>
  );
};

const AddProductToCategoryModal = ({
  category,
  onClose,
  currentLang,
}: {
  category: CategoryType | null;
  onClose: () => void;
  currentLang: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        const res = await axios.get(
          `${API_URL}/products/search?search=${searchTerm}&lang=${currentLang}`,
        );
        setSearchResults(res.data || []);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAssign = async () => {
    try {
      await axios.patch(`${API_URL}/products/assign-category`, {
        productIds: selectedProducts.map((p) => p.id),
        categoryId: category?.id,
      });
      onClose();
    } catch (err) {
      alert("Lỗi khi gán sản phẩm" + err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b bg-slate-50/50">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            Thêm sản phẩm vào mục
          </h2>
          <p className="text-indigo-600 text-[10px] font-black uppercase mt-1">
            Mục ID: {category?.id}
          </p>
        </div>
        <div className="p-8 space-y-5">
          <input
            type="text"
            placeholder="Tìm tên thiết bị..."
            className="w-full p-5 bg-slate-100 rounded-2xl outline-none font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-2">
            {searchResults.map((prod: ProductType) => (
              <div
                key={prod.id}
                onClick={() =>
                  !selectedProducts.find((p) => p.id === prod.id) &&
                  setSelectedProducts([...selectedProducts, prod])
                }
                className="p-4 hover:bg-indigo-50 cursor-pointer rounded-2xl flex justify-between items-center bg-slate-50 border border-transparent hover:border-indigo-100"
              >
                <span className="text-xs font-black uppercase text-slate-600">
                  {prod.translations?.find(
                    (t) => t.languageCode === currentLang,
                  )?.name ||
                    prod.translations[0]?.name ||
                    "N.A"}
                </span>
                <PlusIcon className="w-4 h-4 text-indigo-400" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {selectedProducts.map((p) => (
              <span
                key={p.id}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center uppercase italic"
              >
                {p.translations?.find((t) => t.languageCode === currentLang)
                  ?.name ||
                  p.translations[0]?.name ||
                  "N.A"}
                <button
                  onClick={() =>
                    setSelectedProducts(
                      selectedProducts.filter((i) => i.id !== p.id),
                    )
                  }
                  className="ml-2"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="p-8 flex justify-end gap-3 bg-slate-50 border-t">
          <button
            onClick={onClose}
            className="font-black text-slate-400 uppercase text-xs px-4"
          >
            Đóng
          </button>
          <button
            onClick={handleAssign}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition uppercase text-xs"
          >
            Xác nhận gán
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryManagement;
