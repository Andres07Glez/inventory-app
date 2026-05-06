import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../config/environment';

export interface InvoiceRequest {
  invoiceNumber: string;
  supplier?:     string;
  invoiceDate:   string;        // ISO date: 'YYYY-MM-DD'
  totalAmount?:  number | null;
  documentPath?: string;
  notes?:        string;
}

export interface InvoiceResponse {
  id:            number;
  invoiceNumber: string;
  supplier?:     string;
  invoiceDate:   string;
  totalAmount?:  number | null;
  documentPath?: string;
  notes?:        string;
  createdAt:     string;
  createdByName?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InvoiceResponse[]> {
    return this.http
      .get<{ success: boolean; data: InvoiceResponse[] }>(`${this.base}/invoices`)
      .pipe(map(res => res.data));
  }

  create(payload: InvoiceRequest): Observable<InvoiceResponse> {
    return this.http
      .post<{ success: boolean; data: InvoiceResponse }>(
        `${this.base}/invoices?userId=${environment.userId}`,
        payload
      )
      .pipe(map(res => res.data));
  }

  update(id: number, payload: InvoiceRequest): Observable<InvoiceResponse> {
    return this.http
      .put<{ success: boolean; data: InvoiceResponse }>(
        `${this.base}/invoices/${id}`,
        payload
      )
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<{ success: boolean; data: null }>(`${this.base}/invoices/${id}`)
      .pipe(map(() => void 0));
  }
}