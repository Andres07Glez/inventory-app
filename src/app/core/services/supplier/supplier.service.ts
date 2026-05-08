import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PageResponse } from '../../models/asset-assignment.model';
import { SupplierRequestDTO, SupplierResponseDTO } from '../../models/supplier.model';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);

  getSuppliers(page = 0, size = 10, sort = 'name,asc'): Observable<PageResponse<SupplierResponseDTO>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PageResponse<SupplierResponseDTO>>(`${API_BASE_URL}/v1/suppliers`, { params });
  }

  searchSuppliers(q: string, page = 0, size = 10): Observable<PageResponse<SupplierResponseDTO>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http.get<PageResponse<SupplierResponseDTO>>(`${API_BASE_URL}/v1/suppliers/search`, { params });
  }

  createSupplier(dto: SupplierRequestDTO): Observable<{ data: SupplierResponseDTO }> {
    return this.http.post<{ data: SupplierResponseDTO }>(`${API_BASE_URL}/v1/suppliers`, dto);
  }

  updateSupplier(id: number, dto: SupplierRequestDTO): Observable<{ data: SupplierResponseDTO }> {
    return this.http.put<{ data: SupplierResponseDTO }>(`${API_BASE_URL}/v1/suppliers/${id}`, dto);
  }

  deactivateSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/v1/suppliers/${id}`);
  }
}