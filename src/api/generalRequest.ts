import { http } from "./client";
import type {
  GeneralRequest,
  CreateGeneralRequestPayload,
  ReviewGeneralRequestPayload,
  GeneralRequestPaginatedResponse,
} from "../types/general-request";

const API_PATH = "/general-requests";

export const generalRequestApi = {
  createRequest: async (payload: CreateGeneralRequestPayload): Promise<GeneralRequest> => {
    const response = await http<any>(API_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  getMyRequests: async (
    page: number,
    limit: number,
  ): Promise<{ data: GeneralRequest[]; meta: any }> => {
    const response = await http<any>(
      `${API_PATH}/my-requests?page=${page}&limit=${limit}`,
    );
    const result = response.data;
    return {
      data: result?.data || [],
      meta: result?.meta || { total: 0 },
    };
  },

  getAssignedToMe: async (
    page: number,
    limit: number,
  ): Promise<{ data: GeneralRequest[]; meta: any }> => {
    const response = await http<any>(
      `${API_PATH}/assigned-to-me?page=${page}&limit=${limit}`,
    );
    const result = response.data;
    return {
      data: result?.data || [],
      meta: result?.meta || { total: 0 },
    };
  },

  getDetail: async (id: number): Promise<GeneralRequest> => {
    const response = await http<any>(`${API_PATH}/${id}`);
    return response.data;
  },

  reviewRequest: async (
    id: number,
    payload: ReviewGeneralRequestPayload,
  ): Promise<GeneralRequest> => {
    const response = await http<any>(`${API_PATH}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteRequest: async (id: number): Promise<void> => {
    await http<any>(`${API_PATH}/${id}`, {
      method: "DELETE",
    });
  },
};

export type {
  GeneralRequest,
  CreateGeneralRequestPayload,
  ReviewGeneralRequestPayload,
};
