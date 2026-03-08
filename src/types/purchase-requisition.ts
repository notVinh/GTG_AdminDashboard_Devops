import type { EmployeeItem } from './employee';
import type { FactoryItem } from './factory';
import type { MisaOrder } from './misa-order';
import type { MisaSaOrder } from '../api/misa-data-source';

export interface PurchaseRequisition {
  id: number;
  requisitionNumber: string;
  misaOrderId: number | null; // Nullable cho backward compatibility
  misaSaOrderId?: number | null; // Link đến MisaSaOrder từ MISA sync
  factoryId: number;
  notes?: string;

  createdByEmployeeId: number;

  approvedByEmployeeId?: number;
  approvedAt?: string;
  approvalNotes?: string;

  // Status: pending (chờ duyệt), approved (đã duyệt), rejected (từ chối), revision_required (yêu cầu chỉnh sửa), purchase_confirmed (đã mua hàng)
  status: 'pending' | 'approved' | 'rejected' | 'revision_required' | 'purchase_confirmed';

  // Revision fields
  revisionReason?: string | null;
  revisionRequestedByEmployeeId?: number | null;
  revisionRequestedAt?: string | null;

  // Purchase confirmation fields
  purchaseConfirmedByEmployeeId?: number | null;
  purchaseConfirmedAt?: string | null;
  purchaseConfirmNotes?: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  createdBy?: EmployeeItem;
  approvedBy?: EmployeeItem;
  revisionRequestedBy?: EmployeeItem;
  purchaseConfirmedBy?: EmployeeItem;
  misaOrder?: MisaOrder;
  misaSaOrder?: MisaSaOrder; // Relation đến MisaSaOrder
  factory?: FactoryItem;
}

export interface CreatePurchaseRequisitionDto {
  requisitionNumber: string;
  misaOrderId?: number | null;
  misaSaOrderId?: number | null;
  notes?: string;
}

export interface ApprovePurchaseRequisitionDto {
  notes?: string;
}

export interface RejectPurchaseRequisitionDto {
  reason: string;
}

export interface RequestRevisionPurchaseRequisitionDto {
  reason: string;
}

export interface ResubmitPurchaseRequisitionDto {
  notes?: string;
}
