import { inject, Injectable } from '@angular/core';
import { AssetAssignmentRequestDTO, AssetAssignmentResponseDTO, AssetSearchResult, GuardianOption, PageResponse } from '../../models/asset-assignment.model';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';


const API_BASE_URL = 'http://localhost:8080';
 
@Injectable({ providedIn: 'root' })
export class AssetAssignmentService {
 
  private readonly http = inject(HttpClient);
 
  // ── Asignaciones ───────────────────────────────────────────────────────────
 
  /**
   * POST /v1/assets/assign
   * La ubicación ya NO se envía: el backend la hereda de guardian.location.
   */
  createAssignment(request: AssetAssignmentRequestDTO): Observable<AssetAssignmentResponseDTO> {
    return this.http.post<AssetAssignmentResponseDTO>(
      `${API_BASE_URL}/v1/assets/assign`,
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
 
  /**
   * GET /api/v1/guardians — activos con paginación desactivada para el select.
   * El DTO ahora incluye locationId y locationName (heredados en la asignación).
   */
  getGuardians(): Observable<GuardianOption[]> {
    const params = new HttpParams().set('size', '500').set('sort', 'fullName,asc');
    return this.http.get<GuardianOption[]>(`${API_BASE_URL}/v1/guardians`, { params });
  }
  // getLocations() eliminado: la ubicación se hereda automáticamente del resguardante
}
