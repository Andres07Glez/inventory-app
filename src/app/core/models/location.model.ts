export interface Location {
  id: number;
  name: string;
  building: string;
  floor: string | null;
  room: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assetCount?: number;
}

export interface LocationRequest {
  name: string;
  building: string;
  floor: string | null;
  room: string | null;
  description: string | null;
  isActive: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}