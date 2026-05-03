// ─────────────────────────────────────────────────────────────────────────────
// asset-assignment.model.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Request ──────────────────────────────────────────────────────────────────

export interface AssetAssignmentRequestDTO {
  assetId: number;
  guardianId: number;
  locationId: number;
  assignedById: number;   // temporal — reemplazar por JWT
  notes?: string;
}

// ── Response ─────────────────────────────────────────────────────────────────

export interface AssetAssignmentResponseDTO {
  id: number;
  assetInventoryNumber: string;
  assetDescription: string;
  guardianName: string;
  locationName: string;
  notes: string;
  assignedAt: string;
  returnedAt: string | null;
}

// ── Catálogos ─────────────────────────────────────────────────────────────────

export interface GuardianOption {
  id: number;
  fullName: string;
  employeeNumber: string;
  department: string;
}

export interface LocationOption {
  id: number;
  name: string;
  building: string;
  campus: string;
}

// ── Búsqueda de bienes ───────────────────────────────────────────────────────

/**
 * Mapea AssetSearchResponseDTO del backend.
 * Resultado del endpoint GET /v1/assets/search?keyword=...
 * Incluye el resguardante activo y la ubicación actual.
 */
export interface AssetSearchResult {
  id: number;
  inventoryNumber: string;
  description: string;
  brand: string;
  model: string;
  categoryName: string;
  conditionStatus: string;            // GOOD | REGULAR | BAD
  lifecycleStatus: string;            // REGISTERED | AVAILABLE | ASSIGNED | ...
  locationName: string;
  currentGuardianName: string | null; // null si no tiene asignación activa
}

/** Wrapper Spring Page<T> */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}