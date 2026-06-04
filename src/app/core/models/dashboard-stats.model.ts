export interface LocationStat {
  locationName: string;
  campus:string | null;
  assetCount:   number;
}

export interface DashboardStats {
  totalAssets:number;
  availableAssets:number;
  assignedAssets:number;
  inMaintenanceAssets:  number;
  goodCondition:number;
  regularCondition:number;
  badCondition: number;
  openIncidents: number;
  maintenanceThisMonth:number;
  topLocations:LocationStat[];
}
