import type { Employee, FactoryItem } from './index';

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productCode?: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierTaxCode?: string;

  // Additional order info
  deliveryDate?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  notes?: string;

  createdByEmployeeId: number;

  // Người nhập ngày dự kiến hàng về
  confirmedByEmployeeId?: number;
  confirmedAt?: string;
  expectedDeliveryDate?: string;
  daysUntilDelivery?: number;

  receivedByEmployeeId?: number;
  receivedAt?: string;
  completedByEmployeeId?: number;
  completedAt?: string;

  // Status: pending (chờ nhập ngày), waiting (chờ hàng về), received (đã nhận), completed (hoàn thành), cancelled (đã hủy)
  status: 'pending' | 'waiting' | 'received' | 'completed' | 'cancelled';

  factoryId: number;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  createdBy?: Employee;
  confirmedBy?: Employee;
  receivedBy?: Employee;
  completedBy?: Employee;
  factory?: FactoryItem;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemDto {
  productCode?: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface CreatePurchaseOrderDto {
  orderNumber: string;
  orderDate: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierTaxCode?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface ConfirmExpectedDateDto {
  expectedDeliveryDate: string;
  notes?: string;
}

export interface ConfirmReceivedDto {
  notes?: string;
}

export interface UpdatePurchaseOrderStatusDto {
  status: 'completed' | 'cancelled';
  notes?: string;
}
