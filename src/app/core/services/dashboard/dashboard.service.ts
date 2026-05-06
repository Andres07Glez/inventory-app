import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../config/environment';
import { map, Observable } from 'rxjs';
import { DashboardStats } from '../../models/dashboard-stats.model';


interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http     = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/v1/dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.endpoint}/stats`)
      .pipe(map(r => r.data));
  }

  constructor() { }

}
