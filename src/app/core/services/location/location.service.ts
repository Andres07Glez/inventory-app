import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../config/environment';
import { Campus } from '../../models/location.model';

export interface LocationRequest {
  name:        string;
  building?:   string | null;
  campus:      Campus;           // obligatorio (NotNull en el backend)
  description?: string | null;
}
 
export interface LocationResponse {
  id:          number;
  name:        string;
  building:    string | null;
  campus:      Campus | null;
  description: string | null;
  isActive:    boolean;
}
 
export interface SpringPage<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;   // página actual (0-based)
  size:          number;
}
 
@Injectable({ providedIn: 'root' })
export class LocationService {
 
  private readonly base = environment.apiUrl;
 
  constructor(private http: HttpClient) {}
 
  // GET /v1/locations  →  Page<LocationResponseDTO>
  getAll(page = 0, size = 10, sort = 'name,asc'): Observable<SpringPage<LocationResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<SpringPage<LocationResponse>>(
      `${this.base}/locations`, { params }
    );
  }
 
  // GET /v1/locations/search?q=
  search(q: string, page = 0, size = 10): Observable<SpringPage<LocationResponse>> {
    const params = new HttpParams()
      .set('q', q.trim())
      .set('page', page)
      .set('size', size);
    return this.http.get<SpringPage<LocationResponse>>(
      `${this.base}/locations/search`, { params }
    );
  }
 
  // GET /v1/locations/by-campus?campus=LOMA_BONITA
  getByCampus(campus: Campus, page = 0, size = 10): Observable<SpringPage<LocationResponse>> {
    const params = new HttpParams()
      .set('campus', campus)
      .set('page', page)
      .set('size', size);
    return this.http.get<SpringPage<LocationResponse>>(
      `${this.base}/locations/by-campus`, { params }
    );
  }
 
  // GET /v1/locations/campuses  →  Campus[]
  getCampuses(): Observable<Campus[]> {
    return this.http.get<{ data: Campus[] }>(`${this.base}/locations/campuses`)
      .pipe(map(res => res.data));
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