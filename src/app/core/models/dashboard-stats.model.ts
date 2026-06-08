import { Campus, CAMPUS_LABELS } from './location.model';

export interface LocationStat {
  locationName: string;
  campus:       Campus | null;
  assetCount:   number;
}

/** Helper: devuelve la etiqueta legible del campus o cadena vacía. */
export function campusLabel(campus: Campus | null): string {
  return campus ? CAMPUS_LABELS[campus] : '';
}

export interface DashboardStats {
  totalAssets:          number;
  availableAssets:      number;
  assignedAssets:       number;
  inMaintenanceAssets:  number;
  goodCondition:        number;
  regularCondition:     number;
  badCondition:         number;
  openIncidents:        number;
  maintenanceThisMonth: number;
  topLocations:         LocationStat[];
}