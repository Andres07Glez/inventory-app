export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'WARRANTY';
export type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';

export interface MaintenanceSummary {
  id: number;
  assetId: number;
  inventoryNumber: string;
  incidentId: number | null;
  maintenanceType: MaintenanceType;
  performedBy: string | null;
  performedDate: string; // ISO date string 'YYYY-MM-DD'
  cost: number | null;
  conditionBefore: ConditionStatus | null;
  conditionAfter: ConditionStatus | null;
  createdByName: string;
}

export interface MaintenanceResponse extends MaintenanceSummary {
  assetDescription: string;
  description: string;
  createdAt: string; // ISO datetime
}

export interface MaintenanceCreateRequest {
  assetId: number;
  incidentId: number | null;
  maintenanceType: MaintenanceType;
  description: string;
  performedBy: string | null;
  performedDate: string; // 'YYYY-MM-DD'
  cost: number | null;
  conditionBefore: ConditionStatus | null;
  conditionAfter: ConditionStatus | null;
}

// ── Helpers de presentación ──────────────────────────────────────────────────

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  WARRANTY:   'Garantía',
};

export const MAINTENANCE_TYPE_SEVERITY: Record<MaintenanceType, string> = {
  PREVENTIVE: 'info',
  CORRECTIVE: 'warn',
  WARRANTY:   'success',
};

export const CONDITION_LABELS: Record<ConditionStatus, string> = {
  GOOD:    'Bueno',
  REGULAR: 'Regular',
  BAD:     'Malo',
};

export const CONDITION_SEVERITY: Record<ConditionStatus, string> = {
  GOOD:    'success',
  REGULAR: 'warn',
  BAD:     'danger',
};
