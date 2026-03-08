// Zalo-related interfaces

export interface ZaloOA {
  id: number;
  oaId: string;
  oaName: string;
  isActive: boolean;
  factoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMessageTemplate {
  id: number;
  name: string;
  content: string;
  type: "notification" | "reminder" | "announcement" | "custom";
  isActive: boolean;
  factoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMessage {
  id: number;
  content: string;
  templateId?: number;
  templateName?: string;
  messageType: "text" | "image" | "file" | "template";
  status: "pending" | "sent" | "failed" | "delivered";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  factoryId: number;
  createdBy: number;
  zaloOaId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMessageRecipient {
  id: number;
  messageId: number;
  employeeId: number;
  factoryId: number;
  phoneNumber: string;
  zaloUserId?: string;
  status: "pending" | "sent" | "failed" | "delivered" | "read";
  zaloMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  employee: {
    id: number;
    userId: number;
    positionId: number;
    salary: number;
    status: string;
    startDateJob: string;
    endDateJob?: string;
    user: {
      id: number;
      fullName: string;
      phone: string;
      email: string;
    };
  };
}

export interface SendMessageToUsersRequest {
  userIds: number[];
  message: string;
  factoryId: number;
}

export interface SendMessageToUsersResponse {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    userId: number;
    fullName: string | null;
    phone: string | null;
    zaloUserId?: string;
    status: string;
    messageId?: string;
    error?: string;
  }>;
}
