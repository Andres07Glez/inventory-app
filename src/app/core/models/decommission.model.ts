// ── Enums ─────────────────────────────────────────────────────────────────────

export type DecommissionStatus = 'PENDING' | 'CONFIRMED';

// ── UI helpers ────────────────────────────────────────────────────────────────

export const DECOMMISSION_STATUS_LABEL: Record<DecommissionStatus, string> = {
  PENDING:   'Pendiente',
  CONFIRMED: 'Confirmada',
};

export const DECOMMISSION_STATUS_SEVERITY: Record<DecommissionStatus, string> = {
  PENDING:   'warn',
  CONFIRMED: 'danger',
};

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface DecommissionSummary {
  id:                   number;
  assetId:              number;
  assetInventoryNumber: string;
  assetDescription:     string;
  status:               DecommissionStatus;
  decommissionDate:     string;
  createdAt:            string;
  createdByName:        string;
  hasLinkedIncident:    boolean;
}

export interface DecommissionDetail {
  id:                     number;
  assetId:                number;
  assetInventoryNumber:   string;
  assetDescription:       string;
  /** null si la baja no proviene de una incidencia */
  incidentId:             number | null;
  /** null si la baja no proviene de una incidencia */
  incidentFolio:          string | null;
  justification:          string;
  /** null si no se subió documento */
  decommissionDocumentUrl: string | null;
  decommissionDate:       string;
  status:                 DecommissionStatus;
  createdAt:              string;
  createdByName:          string;
  confirmedAt:            string | null;
  confirmedByName:        string | null;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface DecommissionCreateRequest {
  assetId:          number;
  /** Opcional: vincular la baja a una incidencia existente */
  incidentId?:      number | null;
  justification:    string;
  /** ISO date string. Si no se envía, el backend usa la fecha actual. */
  decommissionDate?: string | null;
}
