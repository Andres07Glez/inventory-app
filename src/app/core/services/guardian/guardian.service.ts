import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../config/environment';

// ── Interfaces propias del módulo ─────────────────────────────────────────────

export interface GuardianRequest {
  employeeNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  locationId?: number | null;
}

export interface GuardianResponse {
  id: number;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  locationId: number | null;
  locationName: string;
  isActive: boolean;
}

export interface LocationOption {
  id: number;
  name: string;
  building?: string;
  campus?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GuardianService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /** GET /v1/guardians  — listado paginado de resguardantes activos */
  getGuardians(page = 0, size = 10, sort = 'fullName,asc'): Observable<PageResponse<GuardianResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<PageResponse<GuardianResponse>>(`${this.base}/guardians`, { params });
  }

  /** GET /v1/guardians/search?q=  — búsqueda por nombre, número de empleado o departamento */
  searchGuardians(q: string, page = 0, size = 10): Observable<PageResponse<GuardianResponse>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<GuardianResponse>>(`${this.base}/guardians/search`, { params });
  }

  /** POST /v1/guardians  — crear resguardante */
  createGuardian(payload: GuardianRequest): Observable<GuardianResponse> {
    return this.http
      .post<{ data: GuardianResponse }>(`${this.base}/guardians`, payload)
      .pipe(map(res => res.data));
  }

  /** PUT /v1/guardians/:id  — actualizar resguardante */
  updateGuardian(id: number, payload: GuardianRequest): Observable<GuardianResponse> {
    return this.http
      .put<{ data: GuardianResponse }>(`${this.base}/guardians/${id}`, payload)
      .pipe(map(res => res.data));
  }

  /** DELETE /v1/guardians/:id  — baja lógica */
  deactivateGuardian(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/guardians/${id}`);
  }

  /** GET /v1/catalogs/locations  — ubicaciones para el select */
  getLocations(): Observable<LocationOption[]> {
    return this.http
      .get<{ success: boolean; data: LocationOption[] }>(`${this.base}/catalogs/locations`)
      .pipe(map(res => res.data));
  }
}