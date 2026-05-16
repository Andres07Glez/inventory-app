import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../config/environment';
import { AssetImageDTO } from '../../models/asset.model';


interface ApiResponse<T> { success: boolean; message: string; data: T; }


@Injectable({
  providedIn: 'root',
})
export class AssetImageService {
  private readonly http = inject(HttpClient);

  private endpoint(assetId: number): string {
    return `${environment.apiUrl}/assets/${assetId}/images`;
  }

  getImages(assetId: number): Observable<AssetImageDTO[]> {
    return this.http
      .get<ApiResponse<AssetImageDTO[]>>(this.endpoint(assetId))
      .pipe(map(r => r.data));
  }

  /** Envía el archivo YA comprimido como FormData */
  upload(assetId: number, file: File): Observable<AssetImageDTO> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<AssetImageDTO>>(this.endpoint(assetId), form)
      .pipe(map(r => r.data));
  }

  delete(assetId: number, imageId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.endpoint(assetId)}/${imageId}`)
      .pipe(map(() => void 0));
  }

  setPrimary(assetId: number, imageId: number): Observable<AssetImageDTO> {
    return this.http
      .patch<ApiResponse<AssetImageDTO>>(
        `${this.endpoint(assetId)}/${imageId}/primary`, {}
      )
      .pipe(map(r => r.data));
  }
}
