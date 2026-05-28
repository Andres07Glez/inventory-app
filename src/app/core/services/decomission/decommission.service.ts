import { inject, Injectable } from '@angular/core';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

// Re-uso del Page genérico del modelo de incidencias
import { Page as IncidentPage } from '../../models/incident.model';
import { DecommissionCreateRequest, DecommissionDetail, DecommissionStatus, DecommissionSummary } from '../../models/decommission.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../config/environment';
import { map, Observable } from 'rxjs';
type DecommissionPage = IncidentPage<DecommissionSummary>;

@Injectable({ providedIn: 'root' })
export class DecommissionService {

  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;

  // ── Consultas ─────────────────────────────────────────────────────────────

  list(page = 0, size = 20, status?: DecommissionStatus): Observable<DecommissionPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);

    return this.http
      .get<ApiResponse<DecommissionPage>>(`${this.api}/decommissions`, { params })
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<DecommissionDetail> {
    return this.http
      .get<ApiResponse<DecommissionDetail>>(`${this.api}/decommissions/${id}`)
      .pipe(map(r => r.data));
  }

  /**
   * Baja registrada para un bien específico (si existe).
   * Usado en el tab de detalle de un bien.
   * Devuelve 404 si el bien no tiene baja registrada.
   */
  getByAsset(assetId: number): Observable<DecommissionDetail> {
    return this.http
      .get<ApiResponse<DecommissionDetail>>(`${this.api}/assets/${assetId}/decommission`)
      .pipe(map(r => r.data));
  }

  // ── Mutaciones ────────────────────────────────────────────────────────────

  /**
   * Inicia un proceso de baja (estado PENDING).
   * Envía multipart/form-data porque el documento PDF es opcional.
   *
   * @param request  datos del formulario
   * @param document acta PDF opcional
   */
  create(request: DecommissionCreateRequest, document: File | null): Observable<DecommissionDetail> {
    const form = new FormData();
    // El backend espera la parte 'request' como JSON dentro del multipart
    form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (document) {
      form.append('document', document);
    }

    return this.http
      .post<ApiResponse<DecommissionDetail>>(`${this.api}/decommissions`, form)
      .pipe(map(r => r.data));
  }

  /**
   * Confirma la baja definitiva (PENDING → CONFIRMED).
   * Solo ADMIN puede ejecutar esta operación. El backend responde 403 si no.
   */
  confirm(id: number): Observable<DecommissionDetail> {
    return this.http
      .patch<ApiResponse<DecommissionDetail>>(`${this.api}/decommissions/${id}/confirm`, {})
      .pipe(map(r => r.data));
  }
}

