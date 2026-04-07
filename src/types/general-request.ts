import type { EmployeeItem } from "./employee";

export interface GeneralRequest {
  id: number;
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  approverEmployeeId: number;
  requesterEmployeeId: number;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
  approver?: {
    id: number;
    name: string;
    code: string;
  };
  requester?: {
    id: number;
    name: string;
    code: string;
  };
  employee: EmployeeItem; // Thêm thông tin nhân viên để hiển thị tên người yêu cầu
}

export interface CreateGeneralRequestPayload {
  title: string;
  content: string;
  approverEmployeeId: number;
}

export interface ReviewGeneralRequestPayload {
  status: "approved" | "rejected";
  decisionNote?: string;
}

export interface GeneralRequestPaginatedResponse {
  data: GeneralRequest[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}
