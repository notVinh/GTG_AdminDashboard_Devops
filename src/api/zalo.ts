import { http } from "./client";
import type {
  ZaloOA,
  ZaloMessageTemplate,
  ZaloMessage,
  ZaloMessageRecipient,
  SendMessageToUsersRequest,
  SendMessageToUsersResponse
} from "../types";

export const zaloApi = {
  // Lấy thông tin Zalo OA của nhà máy
  getMyZaloOA: async (): Promise<ZaloOA> => {
    const response = await http<any>("/zalo/oa/info");
    return response.data;
  },

  // Lấy factoryId của user hiện tại
  getMyFactoryId: async (): Promise<number> => {
    const response = await http<any>("/zalo/oa/factory-id");
    return response.data;
  },

  // Lấy danh sách template tin nhắn
  getMessageTemplates: async (): Promise<ZaloMessageTemplate[]> => {
    const response = await http<any>("/zalo/templates");
    return response.data;
  },

  // Tạo template tin nhắn mới
  createMessageTemplate: async (data: {
    name: string;
    content: string;
    type: "notification" | "reminder" | "announcement" | "custom";
  }): Promise<ZaloMessageTemplate> => {
    const response = await http<any>("/zalo/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Lấy lịch sử tin nhắn
  getMessageHistory: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: ZaloMessage[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await http<any>(
      `/zalo/messages/history?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Lấy chi tiết tin nhắn
  getMessageDetails: async (
    messageId: number
  ): Promise<ZaloMessage & { recipients: ZaloMessageRecipient[] }> => {
    const response = await http<any>(`/zalo/messages/${messageId}`);
    return response.data;
  },

  // Gửi tin nhắn cho users
  sendMessageToUsers: async (
    data: SendMessageToUsersRequest
  ): Promise<SendMessageToUsersResponse> => {
    const response = await http<any>("/zalo/send-message-to-users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Yêu cầu thông tin user từ Zalo
  requestUserInfo: async (data: {
    userId: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string;
  }): Promise<any> => {
    const response = await http<any>("/zalo/request-user-info", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Zalo OA Management
  getZaloOAs: async () => {
    const response = await http<any>("/zalo/oa", {
      method: "GET",
    });
    return response;
  },

  createZaloOA: async (data: any) => {
    const response = await http<any>("/zalo/oa/setup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateZaloOA: async (id: number, data: any) => {
    const response = await http<any>(`/zalo/oa/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteZaloOA: async (id: number) => {
    const response = await http<any>(`/zalo/oa/${id}`, {
      method: "DELETE",
    });
    return response.data;
  },

  // Upload file trực tiếp lên Zalo và lấy file token
  uploadFile: async (file: File, accessToken: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://openapi.zalo.me/v2.0/oa/upload/file', {
      method: 'POST',
      headers: {
        'access_token': accessToken,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error === 0) {
      return {
        success: true,
        fileToken: data.data?.token || data.token,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        message: 'Upload file thành công'
      };
    } else {
      throw new Error(data.message || data.error_description || 'Upload file thất bại');
    }
  },

  // Gửi tin nhắn kèm file
  sendMessageWithFile: async (data: any) => {
    const response = await http<any>("/zalo/send-message-with-file", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },
};
