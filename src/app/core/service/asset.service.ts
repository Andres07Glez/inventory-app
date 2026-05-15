import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../config/environment';

export interface AssetRequest {
  inventoryNumber?: string;  // ← agrega esta línea
  description: string;
  brand?: number | null;
  model?: string;
  serialNumber?: string;
  barcode?: string;
  notes?: string;
  categoryId: number;
  locationId?: number | null;
  invoiceId?: number | null;
  entryDate: string;
  conditionStatus: string;
}

export interface AssetResponse {
  id: number;
  inventoryNumber: string;
  description: string;
  categoryName: string;
  locationName?: string;
  conditionStatus: string;
  lifecycleStatus: string;
  createdAt: string;
  createdByName: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: { id: number; name: string } | null;
  isActive: boolean;
}

export interface Location {
  id: number;
  name: string;
  building?: string;
  campus?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  supplier?: string;
  invoiceDate: string;
  totalAmount?: number;
  documentPath?: string;
  notes?: string;
  createdAt: string;
  createdByName?: string;
}

export interface Brand {
  id: number;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssetService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) { }

  registerAsset(payload: AssetRequest): Observable<AssetResponse> {
    return this.http
      .post<{ success: boolean; data: AssetResponse }>(
        `${this.base}/assets?userId=${environment.userId}`,
        payload
      )
      .pipe(map(res => res.data));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<{ success: boolean; data: Category[] }>(`${this.base}/catalogs/categories`)
      .pipe(map(res => res.data));
  }

  getLocations(): Observable<Location[]> {
    return this.http
      .get<{ success: boolean; data: Location[] }>(`${this.base}/catalogs/locations`)
      .pipe(map(res => res.data));
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http
      .get<{ success: boolean; data: Invoice[] }>(`${this.base}/catalogs/invoices`)
      .pipe(map(res => res.data));
  }

  getNextFolio(): Observable<string> {
    return this.http
      .get<{ success: boolean; data: string }>(`${this.base}/assets/next-folio`)
      .pipe(map(res => res.data));
  }

  getBrands(): Observable<Brand[]> {
    return this.http
      .get<{ success: boolean; data: Brand[] }>(`${this.base}/catalogs/brands`)
      .pipe(map(res => res.data));
  }
}