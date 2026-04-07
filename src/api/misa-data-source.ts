import { http } from "./client";

export type MisaApiConfig = {
  id: number;
  name: string;
  baseUrl: string;
  tenantId: string;
  tenantCode: string;
  databaseId: string;
  branchId: string | null;
  userId: string | null;
  workingBook: number;
  language: string;
  includeDependentBranch: string;
  dbType: number;
  authType: number;
  hasAgent: boolean;
  userType: number;
  art: number;
  isc: boolean;
  deviceId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MisaDataSource = {
  id: number;
  apiConfigId: number | null;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  apiEndpoint: string | null;
  view: string;
  dataType: string;
  defaultFilter: string | null;
  defaultSort: string | null;
  useSp: boolean;
  isGetTotal: boolean;
  isFilterBranch: boolean;
  isMultiBranch: boolean;
  isDependent: boolean;
  loadMode: number;
  stockItemState: number | null;
  summaryColumns: string | null;
  extraParams: Record<string, any> | null;
  requestBodyTemplate: Record<string, any> | null;
  pageSize: number;
  syncEnabled: boolean;
  displayOrder: number;
  isActive: boolean;
  apiConfig?: MisaApiConfig;
  createdAt: string;
  updatedAt: string;
};

export type MisaSyncLogEntry = {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
};

export type MisaInventoryBalance = {
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  unitName: string;
  balanceQuantity: number;
  openingQuantity: number;
  closingQuantity: number;
  totalInQuantity: number;
  totalOutQuantity: number;
  stockId: string;
  stockCode: string;
  stockName: string;
};

export type MisaStock = {
  id: number;
  stockId: string;
  stockCode: string;
  stockName: string;
  description: string | null;
  branchId: string | null;
  branchName: string | null;
  inactive: boolean;
  isGroup: boolean;
  isValid: boolean;
  inventoryAccount: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  misaCreatedDate: string | null;
  misaModifiedDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MisaSaOrder = {
  id: number;
  refId: string;
  refNo: string;
  refType: number;
  crmId: string | null;
  refDate: string;
  status: number;
  journalMemo: string | null;
  accountObjectId: string | null;
  accountObjectCode: string | null;
  accountObjectName: string | null;
  accountObjectAddress: string | null;
  accountObjectTaxCode: string | null;
  branchId: string | null;
  branchName: string | null;
  currencyId: string;
  totalAmountOc: number;
  totalSaleAmount: number;
  totalSaleAmountOc: number;
  totalVatAmount: number;
  totalDiscountAmount: number;
  totalDiscountAmountOc: number;
  receivableAmount: number;
  receivableAmountOc: number;
  receiptedAmount: number;
  receiptedAmountOc: number;
  totalReceiptedAmount: number;
  totalReceiptedAmountOc: number;
  payRefundAmount: number;
  payRefundAmountOc: number;
  totalInvoiceAmount: number;
  totalInvoiceAmountOc: number;
  receiptAmountFinance: number;
  receiptAmountOcFinance: number;
  deliveredStatus: number;
  revenueStatus: number;
  isInvoiced: boolean;
  isInvoiceEnum: number;
  isCreateVoucher: boolean;
  isCalculatedCost: boolean;
  hasCreateContract: boolean;
  isArisedBeforeUseSoftware: boolean;
  wesignDocumentText: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  employeeName: string | null;
  misaCreatedDate: string | null;
  misaModifiedDate: string | null;
  editVersion: number | null;
  // Các trường LOCAL - Sale Admin/Kế toán nhập
  requestedDeliveryDate: string | null; // Ngày yêu cầu giao
  actualExportDate: string | null; // Ngày thực tế xuất kho
  goodsStatus: string | null; // Tình trạng hàng hóa/Ghi chú
  machineType: string | null; // Phân loại máy: Máy cũ, Máy mới
  region: string | null; // Khu vực: Miền Bắc, Miền Trung, Miền Nam
  priority: string | null; // Độ ưu tiên: Thường, Gấp, Rất Gấp
  localDeliveryStatus: string | null; // Tình trạng giao hàng: Đã giao, Chưa giao
  saleType: string | null; // Loại: Bán, Cho thuê, Cho mượn, Đổi
  backDate: number | null; // Ngày trả hàng (dự kiến hoặc thực tế)
  receiverName: string | null; // Tên người nhận
  receiverPhone: string | null; // SĐT người nhận
  specificAddress: string | null; // Địa chỉ cụ thể
  province: string | null; // Tỉnh/Thành phố
  // Các trường Workflow Tracking
  orderWorkflowStatus: string; // Trạng thái workflow: draft, waiting_export, in_preparation, in_delivery, in_installation, completed, cancelled
  saleAdminId: number | null; // ID của Sale Admin xử lý
  saleAdminName: string | null; // Tên Sale Admin xử lý
  saleAdminSubmittedAt: string | null; // Thời điểm gửi duyệt
  // Lịch sử duyệt được lưu trong bảng MisaSaOrderWorkflowHistory
  // Đặt thêm hàng
  needsAdditionalOrder: boolean; // Có cần đặt thêm hàng không
  additionalOrderNote: string | null; // Nội dung ghi chú đặt thêm hàng
  createdAt: string;
  updatedAt: string;
};

// Các trạng thái workflow
export const ORDER_WORKFLOW_STATUS = {
  draft: { label: "Chờ nhập thông tin", color: "gray" },
  waiting_approval: { label: "Chờ duyệt", color: "yellow" },
  approved: { label: "BGĐ Đã duyệt", color: "green" },
  waiting_export: { label: "Chờ xuất kho", color: "yellow" },
  in_preparation: { label: "Xuất kho + kiểm tra máy", color: "indigo" },
  waiting_delivery: { label: "Chờ giao hàng", color: "yellow" },
  in_delivery: { label: "Đang giao hàng", color: "purple" },
  waiting_installation: { label: "Chờ lắp đặt", color: "yellow" },
  in_installation: { label: "Đang lắp đặt", color: "pink" },
  pending_completion: { label: "Chờ xác nhận hoàn tất", color: "blue" },
  completed: { label: "Hoàn thành", color: "green" },
  rejected: { label: "BGĐ Từ chối", color: "red" },
  cancelled: { label: "Đã hủy", color: "red" },
} as const;

// Mapping từ workflow status sang task type (hỗ trợ nhiều task type cho 1 trạng thái)
export const WORKFLOW_STATUS_TO_TASK_TYPES: Record<string, string[]> = {
  waiting_export: ["warehouse_export"],
  in_preparation: ["warehouse_export", "technical_check"], // Có thể giao thêm xuất kho hoặc kiểm tra kỹ thuật
  waiting_delivery: ["delivery"],
  in_delivery: ["delivery"], // Có thể giao thêm giao hàng
  waiting_installation: ["installation"],
  in_installation: ["installation"], // Có thể giao thêm lắp đặt
};

// Helper: Lấy danh sách task types có thể giao từ workflow status
export function getTaskTypesFromWorkflowStatus(
  workflowStatus: string,
): string[] {
  return WORKFLOW_STATUS_TO_TASK_TYPES[workflowStatus] || [];
}

// Helper: Lấy task type mặc định từ workflow status (task type đầu tiên)
export function getTaskTypeFromWorkflowStatus(
  workflowStatus: string,
): string | null {
  const types = WORKFLOW_STATUS_TO_TASK_TYPES[workflowStatus];
  return types && types.length > 0 ? types[0] : null;
}

// Helper: Kiểm tra xem đơn hàng có thể giao việc hay không
export function canAssignTask(workflowStatus: string): boolean {
  return workflowStatus in WORKFLOW_STATUS_TO_TASK_TYPES;
}

// Type cho update local fields
export type MisaSaOrderLocalFieldsUpdate = {
  requestedDeliveryDate?: string | null;
  actualExportDate?: string | null;
  goodsStatus?: string | null;
  machineType?: string | null;
  region?: string | null;
  priority?: string | null;
  localDeliveryStatus?: string | null;
  saleType?: string | null;
  backDate?: number | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  specificAddress?: string | null;
  province?: string | null;
  needsAdditionalOrder?: boolean;
  additionalOrderNote?: string | null;
};

export type MisaPuOrder = {
  id: number;
  refId: string;
  refNo: string;
  refType: number;
  refOrder: number | null;
  refDate: string;
  status: number;
  journalMemo: string | null;
  accountObjectId: string | null;
  accountObjectCode: string | null;
  accountObjectName: string | null;
  accountObjectAddress: string | null;
  accountObjectTaxCode: string | null;
  employeeId: string | null;
  employeeName: string | null;
  branchId: string | null;
  branchName: string | null;
  currencyId: string;
  exchangeRate: number;
  totalAmount: number;
  totalAmountOc: number;
  totalOrderAmount: number;
  alreadyDoneAmount: number;
  totalVatAmount: number;
  totalVatAmountOc: number;
  discountType: number;
  discountRateVoucher: number;
  totalDiscountAmount: number;
  totalDiscountAmountOc: number;
  isCreatedPuContract: boolean;
  isCreatedPuService: boolean;
  isCreatedPuMultiple: boolean;
  wesignDocumentText: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  misaCreatedDate: string | null;
  misaModifiedDate: string | null;
  editVersion: number | null;
  // Local fields (quản lý nội bộ)
  localStatus: string; // new, waiting_goods, goods_arrived
  expectedArrivalDate: string | null; // Ngày về dự kiến
  purchaseRequisitionId: number | null; // ID DXMH liên kết
  saOrderId: number | null; // ID Đơn bán hàng (từ DXMH)
  saOrderRefNo?: string | null; // Số đơn bán hàng (join từ MisaSaOrder)
  confirmedArrivalDate: string | null; // Ngày xác nhận hàng về
  confirmedById: number | null;
  confirmedByName: string | null;
  localNotes: string | null; // Ghi chú nội bộ
  updatedById: number | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MisaPuOrderDetail = {
  id: number;
  refId: string;
  inventoryItemCode: string | null;
  description: string | null;
  stockCode: string | null;
  unitName: string | null;
  quantity: number;
  quantityReceipt: number;
  unitPrice: number;
  amountOc: number;
  vatRate: number;
  vatAmountOc: number;
  isDescription: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// PU Order status labels (MISA status)
export const PU_ORDER_STATUS: Record<number, { label: string; color: string }> =
  {
    1: { label: "Chưa thực hiện", color: "yellow" },
    2: { label: "Đang thực hiện", color: "blue" },
    3: { label: "Hoàn thành", color: "green" },
  };

// PU Order local status (trạng thái nội bộ)
export const PU_ORDER_LOCAL_STATUS = {
  new: { label: "Mới", color: "gray" },
  waiting_goods: { label: "Chờ hàng về", color: "yellow" },
  goods_arrived: { label: "Hàng đã về", color: "green" },
} as const;

// Type for update PU Order local fields
export type MisaPuOrderLocalFieldsUpdate = {
  expectedArrivalDate?: string | null;
  purchaseRequisitionId?: number | null;
  saOrderId?: number | null;
  localNotes?: string | null;
};

export type MisaSaOrderDetail = {
  id: number;
  refId: string;
  inventoryItemCode: string | null;
  description: string | null;
  stockCode: string | null;
  unitName: string | null;
  quantity: number;
  quantityDeliveredSa: number;
  quantityDeliveredIn: number;
  unitPrice: number;
  amountOc: number;
  vatRate: number;
  vatAmountOc: number;
  organizationUnitCode: string | null;
  isCombo: boolean;
  isDescription: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MisaCustomer = {
  id: number;
  accountObjectId: string;
  accountObjectCode: string;
  accountObjectName: string;
  address: string | null;
  taxCode: string | null;
  tel: string | null;
  country: string | null;
  provinceOrCity: string | null;
  district: string | null;
  wardOrCommune: string | null;
  contactName: string | null;
  contactMobile: string | null;
  contactEmail: string | null;
  shippingAddresses: any[] | null;
  accountObjectType: number;
  isCustomer: boolean;
  isVendor: boolean;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MisaSupplier = {
  id: number;
  accountObjectId: string;
  accountObjectCode: string;
  accountObjectName: string;
  address: string | null;
  taxCode: string | null;
  tel: string | null;
  country: string | null;
  provinceOrCity: string | null;
  district: string | null;
  wardOrCommune: string | null;
  contactName: string | null;
  contactMobile: string | null;
  contactEmail: string | null;
  accountObjectType: number;
  isCustomer: boolean;
  isVendor: boolean;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ========== Assignment & Task Report Types ==========

export const TASK_TYPE = {
  WAREHOUSE_EXPORT: "warehouse_export",
  TECHNICAL_CHECK: "technical_check",
  DELIVERY: "delivery",
  INSTALLATION: "installation",
  CUSTOMER_TRAINING: "customer_training",
} as const;

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE];

export const TASK_TYPE_LABELS: Record<string, string> = {
  [TASK_TYPE.WAREHOUSE_EXPORT]: "Kho xuất máy",
  [TASK_TYPE.TECHNICAL_CHECK]: "Kiểm tra kỹ thuật",
  [TASK_TYPE.DELIVERY]: "Giao hàng",
  [TASK_TYPE.INSTALLATION]: "Lắp đặt",
  [TASK_TYPE.CUSTOMER_TRAINING]: "Đào tạo khách hàng",
};

export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  INCOMPLETE: "incomplete",
  BLOCKED: "blocked",
  REASSIGNED: "reassigned",
  CANCELLED: "cancelled",
} as const;

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export const ASSIGNMENT_STATUS_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  [ASSIGNMENT_STATUS.PENDING]: { label: "Chờ xử lý", color: "gray" },
  [ASSIGNMENT_STATUS.IN_PROGRESS]: { label: "Đang thực hiện", color: "blue" },
  [ASSIGNMENT_STATUS.COMPLETED]: { label: "Hoàn thành", color: "green" },
  [ASSIGNMENT_STATUS.INCOMPLETE]: { label: "Chưa hoàn thành", color: "orange" },
  [ASSIGNMENT_STATUS.BLOCKED]: { label: "Tạm dừng", color: "red" },
  [ASSIGNMENT_STATUS.REASSIGNED]: { label: "Đã chuyển giao", color: "purple" },
  [ASSIGNMENT_STATUS.CANCELLED]: { label: "Đã hủy", color: "red" },
};

export const REPORT_TYPE = {
  DAILY_PROGRESS: "daily_progress",
  COMPLETION: "completion",
  ISSUE: "issue",
  RETRY: "retry",
} as const;

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export const REPORT_TYPE_LABELS: Record<string, string> = {
  [REPORT_TYPE.DAILY_PROGRESS]: "Báo cáo tiến độ",
  [REPORT_TYPE.COMPLETION]: "Báo cáo hoàn thành",
  [REPORT_TYPE.ISSUE]: "Báo cáo sự cố",
  [REPORT_TYPE.RETRY]: "Giao tiếp việc",
};

export const REPORT_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  INCOMPLETE: "incomplete",
  BLOCKED: "blocked",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const REPORT_STATUS_LABELS: Record<string, string> = {
  [REPORT_STATUS.IN_PROGRESS]: "Đang thực hiện",
  [REPORT_STATUS.COMPLETED]: "Hoàn thành",
  [REPORT_STATUS.INCOMPLETE]: "Chưa hoàn thành",
  [REPORT_STATUS.BLOCKED]: "Tạm dừng",
};

export type MisaSaOrderAssignment = {
  id: number;
  orderId: number;
  taskType: string;
  assignedToId: number;
  assignedToName: string | null;
  assignedById: number;
  assignedByName: string | null;
  assignedAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  completionNotes: string | null;
  incompleteReason: string | null;
  attachments: string[] | null;
  reassignedFromId: number | null;
  reassignReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  assignedTo?: {
    id: number;
    fullName: string;
    email: string;
  };
  assignedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  order?: MisaSaOrder;
  reports?: MisaSaOrderTaskReport[];
};

export type MisaSaOrderTaskReport = {
  id: number;
  assignmentId: number;
  orderId: number;
  reportedById: number;
  reportedByName: string | null;
  reportedAt: string;
  reportDate: string;
  reportType: string;
  status: string;
  progressPercent: number | null;
  description: string;
  attachments: string[] | null;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  reportedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  assignment?: MisaSaOrderAssignment;
};

// DTOs for creating/updating
export type CreateAssignmentDto = {
  taskType: string;
  assignedToId?: number; // Single employee (backward compatible)
  assignedToIds?: number[]; // Multiple employees
  scheduledAt?: string;
  notes?: string;
};

// Response type for create assignments
export type CreateAssignmentsResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  assignment?: MisaSaOrderAssignment; // Single
  assignments?: MisaSaOrderAssignment[]; // Multiple
};

export type CompleteAssignmentDto = {
  completionNotes?: string;
  attachments?: string[];
};

export type IncompleteAssignmentDto = {
  incompleteReason: string;
  attachments?: string[];
};

export type ReassignTaskDto = {
  newAssignedToId: number;
  reassignReason?: string;
  scheduledAt?: string;
  notes?: string;
};

export type RetryAssignmentDto = {
  notes?: string;
  scheduledAt?: string;
};

// Response type for assignment actions (includes all assignments)
export type AssignmentActionResponse = {
  assignment?: MisaSaOrderAssignment;
  assignments?: MisaSaOrderAssignment[];
};

export type CreateDailyReportDto = {
  reportType: string;
  status: string;
  progressPercent?: number;
  description: string;
  attachments?: string[];
  blockedReason?: string;
};

export type ManualOrderDetail = {
  inventoryItemCode: string;
  description?: string;
  stockCode?: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
};

export type CreateManualOrderData = {
  refNo: string;
  refDate?: string;
  accountObjectId?: string;
  accountObjectName?: string;
  accountObjectCode?: string;
  accountObjectAddress?: string;
  accountObjectTaxCode?: string;
  journalMemo?: string;
  requestedDeliveryDate?: string;
  goodsStatus?: string;
  machineType?: string;
  region?: string;
  priority?: string;
  saleType?: string;
  receiverName?: string;
  receiverPhone?: string;
  specificAddress?: string;
  details?: ManualOrderDetail[];
};

export type MisaProduct = {
  id: number;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  inventoryItemType: number;
  unitId: string | null;
  unitName: string | null;
  unitPrice: number;
  salePrice1: number;
  salePrice2: number;
  salePrice3: number;
  fixedSalePrice: number;
  fixedUnitPrice: number;
  saleDescription: string | null;
  purchaseDescription: string | null;
  image: string | null;
  branchId: string | null;
  branchName: string | null;
  inactive: boolean;
  minimumStock: number;
  closingQuantity: number;
  closingAmount: number;
  inventoryAccount: string | null;
  cogsAccount: string | null;
  saleAccount: string | null;
  returnAccount: string | null;
  discountAccount: string | null;
  saleOffAccount: string | null;
  inventoryItemSource: string | null;
  inventoryItemCategoryIdList: string | null;
  inventoryItemCategoryCodeList: string | null;
  inventoryItemCategoryNameList: string | null;
  isFollowSerialNumber: boolean;
  isDrug: boolean;
  isSystem: boolean;
  createdBy: string | null;
  modifiedBy: string | null;
  misaCreatedDate: string | null;
  misaModifiedDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MisaSyncHistory = {
  id: number;
  dataSourceId: number;
  status: "pending" | "running" | "success" | "failed";
  source: "manual" | "scheduled";
  startedAt: string | null;
  completedAt: string | null;
  totalRecords: number;
  syncedRecords: number;
  createdRecords: number;
  updatedRecords: number;
  errorMessage: string | null;
  logs: MisaSyncLogEntry[];
  changedDetails: {
    created: Array<{ code: string; name: string }>;
    updated: Array<{
      code: string;
      name: string;
      changes: Record<string, { old: any; new: any }>;
    }>;
    detailUpdated?: Array<{ code: string; name: string }>; // Đơn có chi tiết thay đổi
  } | null;
  lastRequest: Record<string, any> | null;
  lastResponseSample: Record<string, any> | null;
  dataSource?: MisaDataSource;
  createdAt: string;
};

const API_PATH = "/misa-data-source";

export const misaDataSourceApi = {
  // Get all data sources
  getAll: async (): Promise<MisaDataSource[]> => {
    const response = await http<any>(API_PATH);
    return response.data;
  },

  // Get a single data source
  getById: async (id: number): Promise<MisaDataSource> => {
    const response = await http<any>(`${API_PATH}/${id}`);
    return response.data;
  },

  // Get data source by code
  getByCode: async (code: string): Promise<MisaDataSource> => {
    const response = await http<any>(`${API_PATH}/code/${code}`);
    return response.data;
  },

  // Create data source
  create: async (data: Partial<MisaDataSource>): Promise<MisaDataSource> => {
    const response = await http<any>(API_PATH, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update data source
  update: async (
    id: number,
    data: Partial<MisaDataSource>,
  ): Promise<MisaDataSource> => {
    const response = await http<any>(`${API_PATH}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete data source
  delete: async (id: number): Promise<void> => {
    await http<any>(`${API_PATH}/${id}`, {
      method: "DELETE",
    });
  },

  // Reorder data sources
  reorder: async (
    orders: { id: number; displayOrder: number }[],
  ): Promise<void> => {
    await http<any>(`${API_PATH}/reorder`, {
      method: "POST",
      body: JSON.stringify({ orders }),
    });
  },

  // Get API config
  getApiConfig: async (): Promise<MisaApiConfig | null> => {
    const response = await http<any>(`${API_PATH}/api-config`);
    return response.data;
  },

  // Save API config
  saveApiConfig: async (
    data: Partial<MisaApiConfig>,
  ): Promise<MisaApiConfig> => {
    const response = await http<any>(`${API_PATH}/api-config`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get sync history for a data source
  getSyncHistory: async (
    dataSourceId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: MisaSyncHistory[]; total: number }> => {
    const response = await http<any>(
      `${API_PATH}/${dataSourceId}/sync-history?page=${page}&limit=${limit}`,
    );
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Get sync history by sync ID
  getSyncHistoryById: async (
    syncId: number,
  ): Promise<MisaSyncHistory | null> => {
    const response = await http<any>(`${API_PATH}/sync-history/${syncId}`);
    return response.data;
  },

  // Start sync for a data source
  startSync: async (
    dataSourceId: number,
  ): Promise<{
    success: boolean;
    message: string;
    syncId?: number;
    data?: any;
    total?: number;
  }> => {
    const response = await http<any>(`${API_PATH}/${dataSourceId}/sync`, {
      method: "POST",
    });
    return response.data;
  },

  // Test fetch data from MISA (without saving to history)
  testFetch: async (
    dataSourceId: number,
    pageIndex = 1,
    pageSize = 20,
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
    total?: number;
  }> => {
    const response = await http<any>(
      `${API_PATH}/${dataSourceId}/test-fetch?pageIndex=${pageIndex}&pageSize=${pageSize}`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  // ========== Product APIs ==========

  // Get all products
  getProducts: async (
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ data: MisaProduct[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    const response = await http<any>(`${API_PATH}/products/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Get product by ID
  getProductById: async (id: number): Promise<MisaProduct> => {
    const response = await http<any>(`${API_PATH}/products/${id}`);
    return response.data;
  },

  // ========== Stock APIs ==========

  // Get all stocks
  getStocks: async (
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ data: MisaStock[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    const response = await http<any>(`${API_PATH}/stocks/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Get stock by ID
  getStockById: async (id: number): Promise<MisaStock> => {
    const response = await http<any>(`${API_PATH}/stocks/${id}`);
    return response.data;
  },

  // ========== Sales Order APIs ==========

  // Get all sales orders
  getSaOrders: async (
    page = 1,
    limit = 50,
    search?: string,
    startDate?: string,
    endDate?: string,
    province?: string,
    reqDeliveryStartDate?: string,
    reqDeliveryEndDate?: string,
    actualExportStartDate?: string,
    actualExportEndDate?: string,
  ): Promise<{
    data: MisaSaOrder[];
    total: number;
    meta?: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (province) params.append("province", province);
    if (reqDeliveryStartDate)
      params.append("reqDeliveryStartDate", reqDeliveryStartDate);
    if (reqDeliveryEndDate)
      params.append("reqDeliveryEndDate", reqDeliveryEndDate);
    if (actualExportStartDate)
      params.append("actualExportStartDate", actualExportStartDate);
    if (actualExportEndDate)
      params.append("actualExportEndDate", actualExportEndDate);
    const response = await http<any>(`${API_PATH}/sa-orders/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
      meta: result.meta,
    };
  },

  // Get sales order by ID
  getSaOrderById: async (id: number): Promise<MisaSaOrder> => {
    const response = await http<any>(`${API_PATH}/sa-orders/${id}`);
    return response.data;
  },

  // Get sales order with details
  getSaOrderWithDetails: async (
    id: number,
  ): Promise<{ order: MisaSaOrder | null; details: MisaSaOrderDetail[] }> => {
    const response = await http<any>(`${API_PATH}/sa-orders/${id}/details`);
    return response.data;
  },

  // Update local fields for sales order (Sale Admin/Kế toán nhập)
  updateSaOrderLocalFields: async (
    id: number,
    data: MisaSaOrderLocalFieldsUpdate,
  ): Promise<MisaSaOrder> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/${id}/local-fields`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  },

  // ========== Workflow APIs ==========

  // Sale Admin gửi đơn hàng để BGĐ duyệt
  submitOrderForApproval: async (
    id: number,
    needsAdditionalOrder?: boolean,
    additionalOrderNote?: string,
  ): Promise<{ success: boolean; message: string; order?: MisaSaOrder }> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/${id}/submit-for-approval`,
      {
        method: "POST",
        body: JSON.stringify({ needsAdditionalOrder, additionalOrderNote }),
      },
    );
    // Check if response has error (statusCode >= 400 but HTTP 200)
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // BGĐ duyệt hoặc từ chối đơn hàng
  approveOrRejectOrder: async (
    id: number,
    approved: boolean,
    note?: string,
  ): Promise<{ success: boolean; message: string; order?: MisaSaOrder }> => {
    const response = await http<any>(`${API_PATH}/sa-orders/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approved, note }),
    });
    // Handle case where backend returns error with statusCode but no data
    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Lấy danh sách đơn hàng theo trạng thái workflow
  getSaOrdersByWorkflowStatus: async (
    status: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: MisaSaOrder[]; total: number }> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/workflow/${status}?page=${page}&limit=${limit}`,
    );
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // ========== Manual Order APIs ==========

  // Tạo đơn hàng thủ công
  createManualOrder: async (
    data: CreateManualOrderData,
  ): Promise<{
    success: boolean;
    message: string;
    order?: MisaSaOrder;
    details?: MisaSaOrderDetail[];
  }> => {
    const response = await http<any>(`${API_PATH}/sa-orders/manual`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // ========== Customer APIs ==========

  // Lấy danh sách khách hàng
  getCustomers: async (
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ data: MisaCustomer[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    const response = await http<any>(`${API_PATH}/customers/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Lấy danh sách nhà cung cấp
  getSuppliers: async (
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ data: MisaSupplier[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    const response = await http<any>(`${API_PATH}/suppliers/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Tạo đơn mua hàng thủ công
  createManualPurchaseOrder: async (
    data: any,
  ): Promise<{
    success: boolean;
    message: string;
    order?: MisaPuOrder;
    details?: MisaPuOrderDetail[];
  }> => {
    const response = await http<any>(`${API_PATH}/pu-orders/manual`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // ========== Assignment APIs ==========

  // Tạo assignments cho nhiều nhân viên (1 API call)
  createAssignments: async (
    orderId: number,
    data: CreateAssignmentDto,
  ): Promise<MisaSaOrderAssignment[]> => {
    const response = await http<CreateAssignmentsResponse>(
      `${API_PATH}/sa-orders/${orderId}/assignments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    // Handle both single and multiple response
    if (response.assignments) {
      return response.assignments;
    }
    if (response.assignment) {
      return [response.assignment];
    }
    return [];
  },

  // Tạo assignment mới cho đơn hàng (backward compatible - single employee)
  createAssignment: async (
    orderId: number,
    data: CreateAssignmentDto,
  ): Promise<MisaSaOrderAssignment> => {
    const results = await misaDataSourceApi.createAssignments(orderId, data);
    if (results.length === 0) {
      throw new Error("Không thể tạo assignment");
    }
    return results[0];
  },

  // Lấy danh sách assignments của đơn hàng
  getOrderAssignments: async (
    orderId: number,
  ): Promise<MisaSaOrderAssignment[]> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/${orderId}/assignments`,
    );
    return response.data;
  },

  // Bắt đầu thực hiện assignment
  startAssignment: async (
    assignmentId: number,
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/start`,
      {
        method: "PATCH",
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Hoàn thành assignment
  completeAssignment: async (
    assignmentId: number,
    data: CompleteAssignmentDto,
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/complete`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Đánh dấu assignment chưa hoàn thành
  markAssignmentIncomplete: async (
    assignmentId: number,
    data: IncompleteAssignmentDto,
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/incomplete`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Giao lại công việc cho người khác
  reassignTask: async (
    assignmentId: number,
    data: ReassignTaskDto,
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/reassign`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Tiếp tục giao việc (sau khi chưa hoàn thành)
  retryAssignment: async (
    assignmentId: number,
    data?: RetryAssignmentDto,
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/retry`,
      {
        method: "POST",
        body: JSON.stringify(data || {}),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Giao lại việc cho cả nhóm (tạo lần mới) - đánh dấu TẤT CẢ assignments cũ là REASSIGNED
  retryTaskGroup: async (
    orderId: number,
    data: {
      taskType: string;
      retryEmployeeIds: number[];
      newEmployeeIds: number[];
      notes?: string;
    },
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/${orderId}/retry-task-group`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Báo sự cố tạm dừng công việc
  markAssignmentBlocked: async (
    assignmentId: number,
    data: { blockedReason: string; attachments?: string[] },
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/blocked`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Bắt đầu lại công việc sau khi tạm dừng
  resumeAssignment: async (
    assignmentId: number,
    data?: { notes?: string },
  ): Promise<AssignmentActionResponse> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/resume`,
      {
        method: "PATCH",
        body: JSON.stringify(data || {}),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Xóa assignment
  deleteAssignment: async (assignmentId: number): Promise<void> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}`,
      {
        method: "DELETE",
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
  },

  // ========== Task Report APIs ==========

  // Tạo báo cáo tiến độ/hoàn thành
  createDailyReport: async (
    assignmentId: number,
    data: CreateDailyReportDto,
  ): Promise<MisaSaOrderTaskReport> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/reports`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Lấy danh sách reports của assignment
  getAssignmentReports: async (
    assignmentId: number,
  ): Promise<MisaSaOrderTaskReport[]> => {
    const response = await http<any>(
      `${API_PATH}/assignments/${assignmentId}/reports`,
    );
    return response.data;
  },

  // Lấy danh sách reports của đơn hàng
  getOrderReports: async (
    orderId: number,
  ): Promise<MisaSaOrderTaskReport[]> => {
    const response = await http<any>(
      `${API_PATH}/sa-orders/${orderId}/reports`,
    );
    return response.data;
  },

  // ========== Purchase Order APIs ==========

  // Get all purchase orders
  getPuOrders: async (
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ data: MisaPuOrder[]; total: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    const response = await http<any>(`${API_PATH}/pu-orders/list?${params}`);
    const result = response.data;
    return {
      data: result.data || [],
      total: result.meta?.total || result.total || 0,
    };
  },

  // Get purchase order by ID
  getPuOrderById: async (id: number): Promise<MisaPuOrder> => {
    const response = await http<any>(`${API_PATH}/pu-orders/${id}`);
    return response.data;
  },

  // Get purchase order with details
  getPuOrderWithDetails: async (
    id: number,
  ): Promise<{ order: MisaPuOrder | null; details: MisaPuOrderDetail[] }> => {
    const response = await http<any>(`${API_PATH}/pu-orders/${id}/details`);
    return response.data;
  },

  // Update local fields for purchase order
  updatePuOrderLocalFields: async (
    id: number,
    data: MisaPuOrderLocalFieldsUpdate,
  ): Promise<MisaPuOrder> => {
    const response = await http<any>(
      `${API_PATH}/pu-orders/${id}/local-fields`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Confirm purchase order goods arrival
  confirmPuOrderArrival: async (
    id: number,
    notes?: string,
  ): Promise<{ success: boolean; message: string; order?: MisaPuOrder }> => {
    const response = await http<any>(
      `${API_PATH}/pu-orders/${id}/confirm-arrival`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      },
    );
    if (response.statusCode >= 400) {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
    return response.data;
  },

  // Get inventory balance for a stock
  getInventoryBalance: async (
    stockId: string,
  ): Promise<MisaInventoryBalance[]> => {
    const response = await http<any>(
      `${API_PATH}/inventory-balance/${stockId}`,
    );
    return response.data;
  },
};
