// ── Enums ─────────────────────────────────────────────────────────────────────

export type IncidentStatus  = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type RepairType      = 'INTERNAL' | 'EXTERNAL';
export type ClosureType     = 'STANDARD' | 'DECOMMISSION';
export type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';
export type LifecycleStatus =
  | 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED'
  | 'IN_MAINTENANCE' | 'IN_WARRANTY' | 'DECOMMISSIONED';

// ── UI helpers (etiquetas y severities) ───────────────────────────────────────

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

export const CLOSURE_TYPE_LABEL: Record<ClosureType, string> = {
  STANDARD:     'Resolución normal',
  DECOMMISSION: 'Daño Irreparable / Baja definitiva',
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
  createdAt:           string;
  createdByName:       string;
}

// ── Detail (vista completa) ───────────────────────────────────────────────────

export interface IncidentDetail {
  id:                        number;
  folio:                     string;
  assetId:                   number;
  assetInventoryNumber:      string;
  assetDescription:          string;
  description:               string;
  repairType:                RepairType | null;
  status:                    IncidentStatus;
  conditionAtIncident:       ConditionStatus;
  resolutionNotes:           string | null;
  resolvedAt:                string | null;
  resolvedByName:            string | null;
  closureType:               ClosureType | null;
  decommissionJustification: string | null;
  decommissionDocumentUrl:   string | null;
  createdAt:                 string;
  createdByName:             string;
  images:                    IncidentImageDTO[];
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export interface Page<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
}

// ── Payloads de request ───────────────────────────────────────────────────────

export interface IncidentCreateRequest {
  assetId:             number;
  description:         string;
  conditionAtIncident: ConditionStatus;
  repairType:          RepairType | null;
}

export interface IncidentStatusUpdateRequest {
  status:          IncidentStatus;
  resolutionNotes: string | null;
  repairType:      RepairType | null;
}

export interface IncidentCloseRequest {
  resolutionNotes: string;
  repairType:      RepairType | null;
}