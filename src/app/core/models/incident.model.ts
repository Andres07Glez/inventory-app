// ── Enums ─────────────────────────────────────────────────────────────────────

export type IncidentStatus  = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type RepairType      = 'INTERNAL' | 'EXTERNAL';
/**
 * SP-16: DECOMMISSION eliminado. La baja es un proceso independiente.
 * Solo queda STANDARD como único tipo de cierre de incidencia.
 */
export type ClosureType     = 'STANDARD';
export type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';
export type LifecycleStatus =
  | 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED'
  | 'IN_MAINTENANCE' | 'IN_WARRANTY' | 'DECOMMISSIONED';

// ── UI helpers ────────────────────────────────────────────────────────────────

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN:        'Abierta',
  IN_PROGRESS: 'En proceso',
  RESOLVED:    'Resuelta',
  CLOSED:      'Cerrada',
};

export const INCIDENT_STATUS_SEVERITY: Record<IncidentStatus, string> = {
  OPEN:        'warn',
  IN_PROGRESS: 'info',
  RESOLVED:    'success',
  CLOSED:      'secondary',
};

export const REPAIR_TYPE_LABEL: Record<RepairType, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Externo',
};

// ── Asset search ──────────────────────────────────────────────────────────────

export interface AssetSearchResult {
  id:              number;
  inventoryNumber: string;
  description:     string;
  brandName:       string;
  model:           string;
  serialNumber:    string;
  conditionStatus: ConditionStatus;
  lifecycleStatus: LifecycleStatus;
  categoryName:    string;
  locationName:    string;
}

// ── Incident images ───────────────────────────────────────────────────────────

export interface IncidentImageDTO {
  id:             number;
  fileName:       string;
  url:            string;
  mimeType:       string;
  uploadedAt:     string;
  uploadedByName: string;
}

// ── Summary (listado / pestaña) ───────────────────────────────────────────────

export interface IncidentSummary {
  id:                  number;
  folio:               string;
  description:         string;
  status:              IncidentStatus;
  conditionAtIncident: ConditionStatus;
  repairType:          RepairType | null;
  closureType:         ClosureType | null;
  incidentDate:        string;
  createdAt:           string;
  createdByName:       string;
}

// ── Detail ────────────────────────────────────────────────────────────────────

/**
 * SP-16: decommissionJustification y decommissionDocumentUrl eliminados.
 * Esa información ahora vive en DecommissionDetail (decommission.model.ts).
 */
export interface IncidentDetail {
  id:                   number;
  folio:                string;
  assetId:              number;
  assetInventoryNumber: string;
  assetDescription:     string;
  description:          string;
  repairType:           RepairType | null;
  status:               IncidentStatus;
  conditionAtIncident:  ConditionStatus;
  incidentDate:         string;
  resolutionNotes:      string | null;
  resolvedAt:           string | null;
  resolvedByName:       string | null;
  closureType:          ClosureType | null;
  createdAt:            string;
  createdByName:        string;
  images:               IncidentImageDTO[];
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export interface Page<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface IncidentCreateRequest {
  assetId:             number;
  description:         string;
  conditionAtIncident: ConditionStatus;
  repairType:          RepairType | null;
  incidentDate: string | null;
}

export interface IncidentStatusUpdateRequest {
  status:          IncidentStatus;
}

export interface IncidentCloseRequest {
  resolutionNotes: string;
}
