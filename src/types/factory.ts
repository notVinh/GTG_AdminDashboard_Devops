// Factory-related interfaces

export interface FactoryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface FactoryItem {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  location?: { latitude?: number; longitude?: number } | null;
  hourStartWork?: string | null;
  hourEndWork?: string | null;
  maxEmployees?: number | null;
  workDays?: number[];
  branchLocations?: Array<{
    name?: string;
    latitude: number;
    longitude: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}
