import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../config/environment';

// ── Supplier (respuesta del endpoint /v1/suppliers) ──────────────────────────
export interface SupplierResponse {
  id:          number;
  name:        string;
  rfc?:        string;
  contactName?: string;
  email?:      string;
  phone?:      string;
  address?:    string;
  isActive:    boolean;
}
 
// Wrapper de paginación que devuelve Spring (Page<T>)
export interface SpringPage<T> {
  content:          T[];
  totalElements:    number;
  totalPages:       number;
  number:           number;   // página actual (0-based)
  size:             number;
}
 
// ── Invoice ──────────────────────────────────────────────────────────────────
export interface InvoiceRequest {
  invoiceNumber: string;
  supplierId:    number;          // FK — ya no es texto
  invoiceDate:   string;          // 'YYYY-MM-DD'
  totalAmount:   number;          // siempre 0 por defecto
  documentPath?: string;
  notes?:        string;
}
 
export interface InvoiceResponse {
  id:             number;
  invoiceNumber:  string;
  supplierId?:    number;
  supplierName?:  string;         // el backend puede proyectar el nombre
  invoiceDate:    string | number[];
  totalAmount?:   number | null;
  documentPath?:  string;
  documentUrl?:   string;         // ← URL pública del PDF (agregada en backend)
  notes?:         string;
  createdAt:      string;
  createdByName?: string;
}
 
@Injectable({ providedIn: 'root' })
export class InvoiceService {
 
  private readonly base = environment.apiUrl;
 
  constructor(private http: HttpClient) {}
 
  // ── Facturas ─────────────────────────────────────────────────────────────
  getAll(page = 0, size = 10, q = ''): Observable<SpringPage<InvoiceResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http
      .get<{ success: boolean; data: SpringPage<InvoiceResponse> }>(
        `${this.base}/invoices`, { params }
      )
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
 
  // ── Proveedores ──────────────────────────────────────────────────────────
  getSuppliers(page = 0, size = 100): Observable<SpringPage<SupplierResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http
      .get<SpringPage<SupplierResponse>>(`${this.base}/suppliers`, { params })
      .pipe(map(res => res));
  }

  // ── PDF de factura ────────────────────────────────────────────────────────

  /**
   * Sube (o reemplaza) el PDF de una factura.
   * Retorna la URL pública del documento guardado.
   * Ruta en disco: uploads/invoices/{invoiceId}/{uuid}.pdf
   */
  uploadPdf(invoiceId: number, file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post<{ success: boolean; data: string }>(
        `${this.base}/invoices/${invoiceId}/pdf`, form
      )
      .pipe(map(res => res.data));
  }

  /**
   * Elimina el PDF asociado a la factura (físico + limpia documentPath en BD).
   */
  deletePdf(invoiceId: number): Observable<void> {
    return this.http
      .delete<{ success: boolean; data: string }>(
        `${this.base}/invoices/${invoiceId}/pdf`
      )
      .pipe(map(() => void 0));
  }
}