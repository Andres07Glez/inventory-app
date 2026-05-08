import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PageResponse } from '../../models/asset-assignment.model';
import { Observable } from 'rxjs';
import { CategoryRequestDTO, CategoryResponseDTO } from '../../models/category.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

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
