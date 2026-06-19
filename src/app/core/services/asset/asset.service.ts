import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AssetDetailResponseDTO, AssetQueryParams, AssetResponseDTO, AssetSearchItemDTO, AssignmentHistoryDTO, PageResponse, UpdateConditionRequest, UpdateConditionResponse } from '../../models/asset.model';
import { environment } from '../../../config/environment';


interface ApiResponse<T> { success: boolean; message: string; data: T; }
const API_BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AssetService {

  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/assets`;

  /**
   * Obtiene la lista paginada de bienes con filtros opcionales.
   *
   * @param params Filtros y opciones de paginación
   * @returns Observable con la página de bienes
   */
  getAssets(params: AssetQueryParams = {}): Observable<PageResponse<AssetResponseDTO>> {
    let httpParams = new HttpParams();

    if (params.conditionStatus) httpParams = httpParams.set('conditionStatus', params.conditionStatus);
    if (params.lifecycleStatus) httpParams = httpParams.set('lifecycleStatus', params.lifecycleStatus);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<ApiResponse<PageResponse<AssetResponseDTO>>>(this.endpoint, { params: httpParams })
      .pipe(map(r => r.data));
  }
  getAssetById(id: number): Observable<AssetDetailResponseDTO> {
    return this.http
      .get<ApiResponse<AssetDetailResponseDTO>>(`${this.endpoint}/${id}`)
      .pipe(map(r => r.data));
  }

  getAssignmentHistory(assetId: number): Observable<AssignmentHistoryDTO[]> {
    return this.http
      .get<ApiResponse<AssignmentHistoryDTO[]>>(`${this.endpoint}/${assetId}/assignments`)
      .pipe(map(r => r.data));
  }

  updateCondition(id: number, request: UpdateConditionRequest): Observable<UpdateConditionResponse> {
    return this.http
      .patch<ApiResponse<UpdateConditionResponse>>(`${this.endpoint}/${id}/condition`, request)
      .pipe(map(r => r.data));
  }
  findByInventoryNumber(inventoryNumber: string): Observable<AssetDetailResponseDTO> {
    return this.http
      .get<ApiResponse<AssetDetailResponseDTO>>(
        `${this.endpoint}/inventory-number/${encodeURIComponent(inventoryNumber)}`
      )
      .pipe(map(r => r.data));
  }
  searchAssets(keyword: string, size = 8): Observable<PageResponse<AssetSearchItemDTO>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', '0')
      .set('size', size.toString());

    return this.http.get<PageResponse<AssetSearchItemDTO>>(
      `${this.endpoint}/search`, { params }
    );
  }
}
