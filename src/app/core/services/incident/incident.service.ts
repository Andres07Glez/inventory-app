import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../config/environment';
import { IncidentCloseRequest, IncidentCreateRequest, IncidentDetail, IncidentStatusUpdateRequest, IncidentSummary, Page } from '../../models/incident.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class IncidentService {

  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;

  // ── Consultas ─────────────────────────────────────────────────────────────

  list(page = 0, size = 20, status?: string, assetId?: number, folio?: string): Observable<Page<IncidentSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status)  params = params.set('status', status);
    if (assetId) params = params.set('assetId', assetId);
    if (folio?.trim()) params = params.set('folio', folio.trim());

    return this.http
      .get<ApiResponse<Page<IncidentSummary>>>(`${this.api}/incidents`, { params })
      .pipe(map(r => r.data));
  }

  listByAsset(assetId: number): Observable<IncidentSummary[]> {
    return this.http
      .get<ApiResponse<IncidentSummary[]>>(`${this.api}/assets/${assetId}/incidents`)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<IncidentDetail> {
    return this.http
      .get<ApiResponse<IncidentDetail>>(`${this.api}/incidents/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Mutaciones ────────────────────────────────────────────────────────────

  create(payload: IncidentCreateRequest): Observable<IncidentDetail> {
    return this.http
      .post<ApiResponse<IncidentDetail>>(`${this.api}/incidents`, payload)
      .pipe(map(r => r.data));
  }

  /**
   * SP-16: repairType eliminado del payload de updateStatus.
   * El tipo de reparación se define solo al crear la incidencia.
   */
  updateStatus(id: number, payload: IncidentStatusUpdateRequest): Observable<IncidentDetail> {
    return this.http
      .patch<ApiResponse<IncidentDetail>>(`${this.api}/incidents/${id}/status`, payload)
      .pipe(map(r => r.data));
  }

  close(id: number, payload: IncidentCloseRequest): Observable<IncidentDetail> {
    return this.http
      .post<ApiResponse<IncidentDetail>>(`${this.api}/incidents/${id}/close`, payload)
      .pipe(map(r => r.data));
  }
}
