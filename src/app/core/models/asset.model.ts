// ─────────────────────────────────────────────────────────────────────────────
// asset.model.ts
// Modelos e interfaces del módulo de bienes.
// ─────────────────────────────────────────────────────────────────────────────

export type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';
export type LifecycleStatus =
  | 'REGISTERED'
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'IN_MAINTENANCE'
  | 'IN_WARRANTY'
  | 'DECOMMISSIONED';

export interface AssetResponseDTO {
  id: number;
  inventoryNumber: string;
  description: string;
  brand: string;
  model: string;
  categoryName: string;
  locationName: string;
  conditionStatus: ConditionStatus;
  lifecycleStatus: LifecycleStatus;
}

/** Wrapper de Spring Page<T> */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página actual (0-indexed)
  first: boolean;
  last: boolean;
}

/** Parámetros de filtrado y paginación que se envían al backend */
export interface AssetQueryParams {
  conditionStatus?: ConditionStatus;
  lifecycleStatus?: LifecycleStatus;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Opciones para los dropdowns de filtro ────────────────────────────────────

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export const CONDITION_STATUS_OPTIONS: SelectOption<ConditionStatus>[] = [
  { label: 'Bueno', value: 'GOOD' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Malo', value: 'BAD' },
];

export const LIFECYCLE_STATUS_OPTIONS: SelectOption<LifecycleStatus>[] = [
  { label: 'Registrado', value: 'REGISTERED' },
  { label: 'Disponible', value: 'AVAILABLE' },
  { label: 'Asignado', value: 'ASSIGNED' },
  { label: 'En mantenimiento', value: 'IN_MAINTENANCE' },
  { label: 'En garantía', value: 'IN_WARRANTY' },
  { label: 'Dado de baja', value: 'DECOMMISSIONED' },
];