import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../config/environment';
import { PageResponse } from '../../models/asset.model';
import { UserSummary, UserDetail, CreateUserRequest, UpdateUserRoleRequest, UserRole } from '../../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/users`;

  findAll(params: {
    search?:   string;
    role?:     UserRole | null;
    isActive?: boolean | null;
    page:      number;
    size:      number;
  }): Observable<PageResponse<UserSummary>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    if (params.search?.trim())   httpParams = httpParams.set('search',   params.search.trim());
    if (params.role    != null)  httpParams = httpParams.set('role',     params.role);
    if (params.isActive != null) httpParams = httpParams.set('isActive', params.isActive);

    return this.http.get<PageResponse<UserSummary>>(this.base, { params: httpParams });
  }

  findById(id: number): Observable<UserDetail> {
    return this.http
      .get<ApiResponse<UserDetail>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  create(request: CreateUserRequest): Observable<UserDetail> {
    return this.http
      .post<ApiResponse<UserDetail>>(this.base, request)
      .pipe(map(r => r.data));
  }

  updateRole(id: number, request: UpdateUserRoleRequest): Observable<UserDetail> {
    return this.http
      .patch<ApiResponse<UserDetail>>(`${this.base}/${id}/role`, request)
      .pipe(map(r => r.data));
  }

  toggleStatus(id: number): Observable<UserDetail> {
    return this.http
      .patch<ApiResponse<UserDetail>>(`${this.base}/${id}/status`, {})
      .pipe(map(r => r.data));
  }
  resetPassword(id: number): Observable<UserDetail> {
    return this.http
      .post<ApiResponse<UserDetail>>(`${this.base}/${id}/reset-password`, {})
      .pipe(map(r => r.data));
  }
}
