import type { EmployeeItem } from './employee';
import type { FactoryItem } from './factory';

// Alias for backward compatibility
type Employee = EmployeeItem;
type Factory = FactoryItem;

export interface MisaOrderItem {
  id: number;
  misaOrderId: number;
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

export interface OrderAssignment {
  id: number;
  orderId: number;
  employeeId: number;
  assignedByEmployeeId?: number;
  step: string; // Workflow step
  revision: number; // Revision number for re-assignments
  notes?: string;
  assignedAt: string;

  // Shipping company info (for shipping_company step)
  shippingCompanyName?: string;
  shippingCompanyPhone?: string;
  shippingCompanyAddress?: string;
  trackingNumber?: string;

  // Relations
  assignedBy?: Employee;
  employee?: Employee;
}

export interface MisaOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  customerCode?: string;

  // Product summary (for list view)
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;

  // Additional order info
  deliveryDate?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  currentStep?: string; // Current workflow step
  notes?: string;

  createdByEmployeeId: number;
  approvedByEmployeeId?: number;
  approvedAt?: string;
  assignedToEmployeeId?: number;
  assignedAt?: string;
  completedByEmployeeId?: number;
  completedAt?: string;

  status: 'pendingApproval' | 'approved' | 'assigned' | 'processing' | 'completed' | 'cancelled';

  factoryId: number;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  createdBy?: Employee;
  approvedBy?: Employee;
  assignedTo?: Employee;
  completedBy?: Employee;
  factory?: Factory;
  items?: MisaOrderItem[];
  assignments?: OrderAssignment[]; // Assignment history
}

export interface ParsedMisaOrderItemDto {
  productCode?: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ParsedMisaOrderDto {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  items: ParsedMisaOrderItemDto[];
}

export interface CreateMisaOrderItemDto {
  productCode?: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface CreateMisaOrderDto {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  factoryId: number;
  fileUrl?: string;
  notes?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  items: CreateMisaOrderItemDto[];
}
