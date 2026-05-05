import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../../models/asset-assignment.model';
import { CategoryRequestDTO, CategoryResponseDTO, SupplierRequestDTO, SupplierResponseDTO } from '../../models/catalog.model';

const API_BASE_URL = 'http://localhost:8080'; // ← cambiar según entorno
 
@Injectable({ providedIn: 'root' })
export class CatalogService {
 
  private readonly http = inject(HttpClient);
 
  // ══════════════════════════════════════════════════════════════════════════
  // PROVEEDORES  /v1/suppliers
  // ══════════════════════════════════════════════════════════════════════════
 
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
 
  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORÍAS  /v1/categories
  // ══════════════════════════════════════════════════════════════════════════
 
  getCategories(page = 0, size = 10, sort = 'name,asc'): Observable<PageResponse<CategoryResponseDTO>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PageResponse<CategoryResponseDTO>>(`${API_BASE_URL}/v1/categories`, { params });
  }
 
  searchCategories(q: string, page = 0, size = 10): Observable<PageResponse<CategoryResponseDTO>> {
    const params = new HttpParams().set('q', q).set('page', page).set('size', size);
    return this.http.get<PageResponse<CategoryResponseDTO>>(`${API_BASE_URL}/v1/categories/search`, { params });
  }
 
  createCategory(dto: CategoryRequestDTO): Observable<{ data: CategoryResponseDTO }> {
    return this.http.post<{ data: CategoryResponseDTO }>(`${API_BASE_URL}/v1/categories`, dto);
  }
 
  updateCategory(id: number, dto: CategoryRequestDTO): Observable<{ data: CategoryResponseDTO }> {
    return this.http.put<{ data: CategoryResponseDTO }>(`${API_BASE_URL}/v1/categories/${id}`, dto);
  }
 
  deactivateCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/v1/categories/${id}`);
  }
}
