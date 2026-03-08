import { http } from './client';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types';

type BaseResponse<T> = {
  message?: string | Record<string, string>;
  data?: T;
};

export const usersApi = {
  // Lấy danh sách user với phân trang (tự động detect nhiều format từ backend)
  getUsers: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number; hasNextPage?: boolean }> => {
    // Backend hiện trả về InfinityPaginationResultType: { data: User[]; hasNextPage: boolean }
    // Một số nơi có thể bọc theo BaseResponse hoặc trả về dạng { items, total, page, limit }
    const res = await http<any>(`/users?page=${page}&limit=${limit}`, {
      method: 'GET',
      // Tránh cache 304 khiến payload bị trống trong một số trình duyệt
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    });

    // Các trường hợp có thể gặp
    // 1) { data: User[], hasNextPage: boolean }
    if (res && Array.isArray(res.data)) {
      return { data: res.data as User[], total: res.data.length, page, limit, hasNextPage: !!res.hasNextPage };
    }
    // 2) { items: User[], total, page, limit }
    if (res && Array.isArray(res.items)) {
      return { data: res.items as User[], total: Number(res.total) || 0, page: Number(res.page) || page, limit: Number(res.limit) || limit };
    }
    // 3) BaseResponse bọc { data: {...} }
    if (res && res.data) {
      const inner = res.data;
      if (Array.isArray(inner)) {
        return { data: inner as User[], total: inner.length, page, limit };
      }
      if (Array.isArray(inner.items)) {
        return { data: inner.items as User[], total: Number(inner.total) || 0, page: Number(inner.page) || page, limit: Number(inner.limit) || limit };
      }
      if (Array.isArray(inner.data)) {
        return { data: inner.data as User[], total: inner.data.length, page, limit, hasNextPage: !!inner.hasNextPage };
      }
    }
    // Fallback an toàn
    return { data: [], total: 0, page, limit };
  },

  // Lấy user theo ID
  getUserById: async (id: number): Promise<User> => {
    const res = await http<BaseResponse<User>>(`/users/${id}`, {
      method: 'GET',
    });
    return res?.data as User;
  },

  // Tạo user mới
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const res = await http<BaseResponse<User>>(`/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data as User;
  },

  // Cập nhật user
  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await http<BaseResponse<User>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res?.data as User;
  },

  // Xóa user
  deleteUser: async (id: number): Promise<void> => {
    await http(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Lấy thông tin nhà máy của user hiện tại
  getMyFactory: async (): Promise<any> => {
    const res = await http<any>(`/users/me/factory`, {
      method: 'GET',
    });
    return res?.data ?? null;
  },
};
