import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../config/environment';

export interface BrandRequest {
  name: string;
}

export interface BrandResponse {
  id: number;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class BrandService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BrandResponse[]> {
    return this.http
      .get<{ success: boolean; data: BrandResponse[] }>(`${this.base}/brands`)
      .pipe(map(res => res.data));
  }

  create(payload: BrandRequest): Observable<BrandResponse> {
    return this.http
      .post<{ success: boolean; data: BrandResponse }>(`${this.base}/brands`, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: BrandRequest): Observable<BrandResponse> {
    return this.http
      .put<{ success: boolean; data: BrandResponse }>(`${this.base}/brands/${id}`, payload)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<{ success: boolean; data: null }>(`${this.base}/brands/${id}`)
      .pipe(map(() => void 0));
  }
}