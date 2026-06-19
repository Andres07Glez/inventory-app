// category.model.ts

export interface CategoryResponseDTO {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  parentName: string | null;
  isActive: boolean;
}

export interface CategoryRequestDTO {
  name: string;
  description?: string;
  parentId?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export type DialogMode = 'create' | 'edit';