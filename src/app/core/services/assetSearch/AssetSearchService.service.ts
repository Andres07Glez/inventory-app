import { inject, Injectable } from '@angular/core';
import { environment } from '../../../config/environment';
import { map, Observable } from 'rxjs';
import { AssetSearchResult } from '../../models/asset-assignment.model';
import { HttpClient, HttpParams } from '@angular/common/http';

interface ApiResponse<T> { success: boolean; message: string; data: T; }
 
@Injectable({ providedIn: 'root' })
export class AssetSearchService {
 
  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;
 
  /**
   * Búsqueda typeahead sobre número de inventario, descripción, serie y código de barras.
   * Excluye bienes con lifecycleStatus = DECOMMISSIONED.
   *
   * @param q     Término (mínimo 2 caracteres aplicado en el componente)
   * @param limit Máximo de resultados; default 10
   */
  search(q: string, limit = 10): Observable<AssetSearchResult[]> {
    const params = new HttpParams().set('q', q).set('limit', limit);
    return this.http
      .get<ApiResponse<AssetSearchResult[]>>(`${this.api}/assets/search/typeahead`, { params })
      .pipe(map(r => r.data));
  }
}
