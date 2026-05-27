import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../config/environment';
import { MaintenanceCreateRequest, MaintenanceResponse, MaintenanceSummary, MaintenanceType } from '../../models/maintenance.model';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Lista global con filtro opcional por tipo. */
  getAll(type?: MaintenanceType): Observable<MaintenanceSummary[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http
      .get<ApiResponse<MaintenanceSummary[]>>(`${this.apiUrl}/maintenance`, { params })
      .pipe(map(r => r.data));
  }

  /** Lista los mantenimientos de un bien específico (tab del bien). */
  getByAssetId(assetId: number): Observable<MaintenanceSummary[]> {
    return this.http
      .get<ApiResponse<MaintenanceSummary[]>>(`${this.apiUrl}/assets/${assetId}/maintenance`)
      .pipe(map(r => r.data));
  }

  /** Detalle completo de un registro. */
  getById(id: number): Observable<MaintenanceResponse> {
    return this.http
      .get<ApiResponse<MaintenanceResponse>>(`${this.apiUrl}/maintenance/${id}`)
      .pipe(map(r => r.data));
  }

  /** Registra un nuevo mantenimiento. */
  create(request: MaintenanceCreateRequest): Observable<MaintenanceResponse> {
    return this.http
      .post<ApiResponse<MaintenanceResponse>>(`${this.apiUrl}/maintenance`, request)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/maintenance/${id}`);
  }

}
