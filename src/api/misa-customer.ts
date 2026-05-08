import { http } from "./client";

export interface MisaCustomer {
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
  legalRepresentative: string | null;
  invoiceReceiver: string | null;
  invoiceReceiverPhone: string | null;
  invoiceReceiverEmail: string | null;
  shippingAddresses: any[] | null;
  accountObjectType: number;
  isCustomer: boolean;
  isVendor: boolean;
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
  rank: string | null;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetCustomersResponse {
  data: MisaCustomer[];
  total: number;
}

const API_PATH = "/misa-data-source";

export const misaCustomerApi = {
  getCustomers: async (
    params: GetCustomersParams = {},
  ): Promise<GetCustomersResponse> => {
    const { page = 1, limit = 50, search } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));
    if (search) {
      queryParams.append("search", search);
    }
    const response = await http<any>(
      `${API_PATH}/customers/list?${queryParams.toString()}`,
    );
    return response.data;
  },

  getCustomerById: async (id: number): Promise<MisaCustomer> => {
    const response = await http<any>(`${API_PATH}/customers/${id}`);
    return response.data;
  },
};
