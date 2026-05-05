// ─────────────────────────────────────────────────────────────────────────────
// catalog.model.ts
// Modelos para los catálogos de Proveedores y Categorías (SP-08).
// ─────────────────────────────────────────────────────────────────────────────

// ── Proveedores ───────────────────────────────────────────────────────────────

export interface SupplierResponseDTO {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequestDTO {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// ── Categorías ────────────────────────────────────────────────────────────────

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

// ── Paginación ────────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ── Modo del diálogo ──────────────────────────────────────────────────────────

export type DialogMode = 'create' | 'edit';