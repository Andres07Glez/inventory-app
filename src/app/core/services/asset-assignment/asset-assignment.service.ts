import { inject, Injectable } from '@angular/core';
import { AssetAssignmentRequestDTO, AssetAssignmentResponseDTO, AssetPreview, GuardianOption, LocationOption } from '../../models/asset-assignment.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../config/enviroment';

// En tu proyecto real, importa desde environments/environment.ts
const API_BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AssetAssignmentService {

  private readonly http = inject(HttpClient);

  // ── Asignaciones ───────────────────────────────────────────────────────────

  /**
   * Crea una nueva asignación de bien a resguardante.
   * POST /api/v1/assignments
   */
  createAssignment(request: AssetAssignmentRequestDTO): Observable<AssetAssignmentResponseDTO> {
    return this.http.post<AssetAssignmentResponseDTO>(
      `${API_BASE_URL}/assignments`,
      request
    );
  }

  // ── Catálogos ──────────────────────────────────────────────────────────────

  /**
   * Busca un bien por código (inventario o código de barras).
   * GET /v1/assets/lookup?q={code}
   */
  lookupAsset(code: string): Observable<{ data: AssetPreview }> {
    return this.http.get<{ data: AssetPreview }>(
      `${API_BASE_URL}/assets/lookup`,
      { params: { q: code } }
    );
  }
  lookupAssetById(id: number): Observable<{ data: AssetPreview }> {
    return this.http.get<{ data: AssetPreview }>(`${API_BASE_URL}/assets/${id}`);
  }

  /**
   * Obtiene la lista de resguardantes disponibles.
   * GET /api/v1/guardians
   */
  getGuardians(): Observable<GuardianOption[]> {
    return this.http.get<GuardianOption[]>(`${API_BASE_URL}/guardians`);
  }

  /**
   * Obtiene la lista de ubicaciones disponibles.
   * GET /api/v1/locations
   */
  getLocations(): Observable<LocationOption[]> {
    return this.http.get<LocationOption[]>(`${API_BASE_URL}/locations`);
  }
}
