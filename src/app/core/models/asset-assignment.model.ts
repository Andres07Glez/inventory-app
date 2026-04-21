// ─────────────────────────────────────────────────────────────────────────────
// asset-assignment.model.ts
// Modelos, DTOs e interfaces del módulo de asignaciones de bienes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Request ──────────────────────────────────────────────────────────────────

export interface AssetAssignmentRequestDTO {
    assetId: number;
    guardianId: number;
    locationId: number;
    assignedBy: number;   // temporal — será reemplazado por el JWT
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
    assignedAt: string;   // ISO datetime
    returnedAt: string | null;
}

// ── Catálogos (para poblar los selects del formulario) ───────────────────────

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

/** Resultado del endpoint /v1/assets/lookup usado para previsualizar el bien */
export interface AssetPreview {
    id: number;
    inventoryNumber: string;
    description: string;
    brand: string;
    model: string;
    conditionStatus: string;
    lifecycleStatus: string;
    locationName: string;
    categoryName: string;
}