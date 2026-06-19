// ─────────────────────────────────────────────────────────────────────────────
// asset-assignment.model.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Request ──────────────────────────────────────────────────────────────────

export interface AssetAssignmentRequestDTO {
  assetId: number;
  guardianId: number;
  assignedBy: number;   // temporal — reemplazar por JWT. Renombrado de assignedById
  notes?: string;
  // locationId eliminado: la ubicación se hereda automáticamente de guardian.location
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
  locationId: number | null;    // nuevo campo: ubicación base del resguardante
  locationName: string | null;  // nuevo campo: nombre de la ubicación base
}

// LocationOption eliminada: la ubicación se hereda del resguardante, no se selecciona

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