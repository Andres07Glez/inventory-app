import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../config/environment';

export interface LocationRequest {
  name: string;
  building?: string | null;
  campus?: string | null;
  description?: string | null;
}

export interface LocationResponse {
  id: number;
  name: string;
  building: string | null;
  campus: string | null;
  description: string | null;
  isActive: boolean;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // página actual (0-based)
  size: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // GET /v1/locations  →  Page<LocationResponseDTO>  (sin wrapper ApiResponse)
  getAll(page = 0, size = 10, sort = 'name,asc'): Observable<SpringPage<LocationResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<SpringPage<LocationResponse>>(
      `${this.base}/locations`, { params }
    );
  }

  // GET /v1/locations/search?q=  →  Page<LocationResponseDTO>  (sin wrapper ApiResponse)
  search(q: string, page = 0, size = 10): Observable<SpringPage<LocationResponse>> {
    const params = new HttpParams()
      .set('q', q.trim())
      .set('page', page)
      .set('size', size);
    return this.http.get<SpringPage<LocationResponse>>(
      `${this.base}/locations/search`, { params }
    );
  }

  // POST /v1/locations  →  ApiResponse<LocationResponseDTO>
  create(payload: LocationRequest): Observable<LocationResponse> {
    return this.http
      .post<{ success: boolean; data: LocationResponse }>(
        `${this.base}/locations`, payload
      )
      .pipe(map(res => res.data));
  }

  // PUT /v1/locations/{id}  →  ApiResponse<LocationResponseDTO>
  update(id: number, payload: LocationRequest): Observable<LocationResponse> {
    return this.http
      .put<{ success: boolean; data: LocationResponse }>(
        `${this.base}/locations/${id}`, payload
      )
      .pipe(map(res => res.data));
  }

  // DELETE /v1/locations/{id}  →  204 No Content
  deactivate(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/locations/${id}`)
      .pipe(map(() => void 0));
  }
}