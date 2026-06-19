import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../config/environment';
import { map, Observable } from 'rxjs';
import { IncidentImageDTO } from '../../models/incident.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }
 
@Injectable({ providedIn: 'root' })
export class IncidentImageService {
 
  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;
 
  getImages(incidentId: number): Observable<IncidentImageDTO[]> {
    return this.http
      .get<ApiResponse<IncidentImageDTO[]>>(`${this.api}/incidents/${incidentId}/images`)
      .pipe(map(r => r.data));
  }
 
  upload(incidentId: number, file: File): Observable<IncidentImageDTO> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<IncidentImageDTO>>(`${this.api}/incidents/${incidentId}/images`, form)
      .pipe(map(r => r.data));
  }
 
  delete(incidentId: number, imageId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.api}/incidents/${incidentId}/images/${imageId}`)
      .pipe(map(() => void 0));
  }
}
