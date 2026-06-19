// supplier.model.ts

export interface SupplierResponseDTO {
    id: number;
    name: string;
    rfc: string | null;
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
    rfc?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
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