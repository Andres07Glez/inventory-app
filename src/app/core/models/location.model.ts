// ─────────────────────────────────────────────────────────────────────────────
// location.model.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Valores válidos del enum Campus (espejo del enum Java). */
export type Campus = 'LOMA_BONITA' | 'TUXTEPEC';

/** Etiquetas legibles para mostrar en la UI. */
export const CAMPUS_LABELS: Record<Campus, string> = {
  LOMA_BONITA: 'Loma Bonita',
  TUXTEPEC:    'Tuxtepec',
};

/** Opciones para p-select / p-dropdown. */
export const CAMPUS_OPTIONS: { label: string; value: Campus }[] = [
  { label: 'Loma Bonita', value: 'LOMA_BONITA' },
  { label: 'Tuxtepec',    value: 'TUXTEPEC'    },
];

// ── Interfaces de respuesta ───────────────────────────────────────────────────

export interface Location {
  id:          number;
  name:        string;
  building:    string | null;
  campus:      Campus | null;
  description: string | null;
  isActive:    boolean;
  assetCount?: number;
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
}

export interface ApiResponse<T> {
  data:    T;
  message: string;
  status:  number;
}