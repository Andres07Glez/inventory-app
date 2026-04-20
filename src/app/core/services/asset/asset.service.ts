// ─────────────────────────────────────────────────────────────────────────────
// asset.service.ts
// Servicio de acceso a la API REST de bienes.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetQueryParams, AssetResponseDTO, PageResponse } from '../../models/asset.model';
import { environment } from '../../../config/environment';

// ---------------------------------------------------------------------------
// En tu proyecto real importa desde environments/environment.ts:
// import { environment } from '../../environments/environment';
// ---------------------------------------------------------------------------
const API_BASE_URL = environment.apiBaseUrl;  // ← cambia según tu entorno

@Injectable({ providedIn: 'root' })
export class AssetService {

  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/v1/assets`;

  /**
   * Obtiene la lista paginada de bienes con filtros opcionales.
   *
   * @param params Filtros y opciones de paginación
   * @returns Observable con la página de bienes
   */
  getAssets(params: AssetQueryParams = {}): Observable<PageResponse<AssetResponseDTO>> {
    let httpParams = new HttpParams();

    if (params.conditionStatus) {
      httpParams = httpParams.set('conditionStatus', params.conditionStatus);
    }
    if (params.lifecycleStatus) {
      httpParams = httpParams.set('lifecycleStatus', params.lifecycleStatus);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<AssetResponseDTO>>(this.endpoint, { params: httpParams });
  }
}