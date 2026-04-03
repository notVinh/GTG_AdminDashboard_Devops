export interface CategoryTranslationType {
  id: number;
  languageCode: string;
  description: string;
  name: string;
  slug: string;
  categoryId: number;
}

export interface CategoryType {
  id: number;
  parentId: number | null;
  level: number;
  translations: CategoryTranslationType[];
  image?: string;
  products: any[]; // Hoặc Product interface nếu có
  children?: CategoryType[];
  order: number;
}

export interface ProductType {
  id: string;
  price: number;
  originalPrice: number;
  brand: string;
  specs: any;
  translations: ProductTranslationType[];
  images: [];
  videos: [];
  category: any;
  categoryId: number;
  order: number;
  model: string;
  misaModel?: string;
  inventoryBalance?: any[]; // Thêm trường này để lưu thông tin tồn kho nếu cần
}

export interface ProductTranslationType {
  languageCode: string;
  name: string;
  features: any;
  specs: any;
  description: string;
  slug: string;
}

export interface QuotationItemType {
  id: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: {
    translations: ProductTranslationType[];
  };
}

export interface QuotationType {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: "pending" | "sent" | "confirmed";
  totalPrice: number;
  items: QuotationItemType[];
}

export const languageListItem: string[] = ["vi", "en", "zh"];
