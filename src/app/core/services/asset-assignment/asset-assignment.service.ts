import { inject, Injectable } from '@angular/core';
import { AssetAssignmentRequestDTO, AssetAssignmentResponseDTO, AssetSearchResult, GuardianOption, LocationOption, PageResponse } from '../../models/asset-assignment.model';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

const API_BASE_URL = 'http://localhost:8080';
 
@Injectable({ providedIn: 'root' })
export class AssetAssignmentService {
 
  private readonly http = inject(HttpClient);
 
  // ── Asignaciones ───────────────────────────────────────────────────────────
 
  /** POST /api/v1/assignments */
  createAssignment(request: AssetAssignmentRequestDTO): Observable<AssetAssignmentResponseDTO> {
    return this.http.post<AssetAssignmentResponseDTO>(
      `${API_BASE_URL}/v1/assignments`,
      request
    );
  }
 
  // ── Búsqueda de bienes ────────────────────────────────────────────────────
 
  /**
   * Búsqueda paginada por nombre, marca, categoría, número de inventario, etc.
   * GET /v1/assets/search?keyword=...&page=0&size=8
   * Retorna AssetSearchResponseDTO con currentGuardianName incluido.
   */
  searchAssets(
    keyword: string,
    page = 0,
    size = 8
  ): Observable<PageResponse<AssetSearchResult>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());
 
    return this.http.get<PageResponse<AssetSearchResult>>(
      `${API_BASE_URL}/v1/assets/search`,
      { params }
    );
  }
 
// ── Catálogos ──────────────────────────────────────────────────────────────
 
  /** GET /api/v1/guardians — todos los activos */
  getGuardians(): Observable<GuardianOption[]> {
    const params = new HttpParams().set('size', '500').set('sort', 'fullName,asc');
    // Le decimos que reciba el PageResponse, y extraemos solo el 'content'
    return this.http.get<PageResponse<GuardianOption>>(`${API_BASE_URL}/v1/guardians`, { params })
      .pipe(map(response => response.content));
  }
 
  /** GET /api/v1/locations — todas las activas */
  getLocations(): Observable<LocationOption[]> {
    const params = new HttpParams().set('size', '500').set('sort', 'name,asc');
    // Hacemos lo mismo para las ubicaciones
    return this.http.get<PageResponse<LocationOption>>(`${API_BASE_URL}/v1/locations`, { params })
      .pipe(map(response => response.content));
  }
}
