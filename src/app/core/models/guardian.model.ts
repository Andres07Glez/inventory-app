import { Campus } from './location.model';

export interface Guardian {
  id: number;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  locationId: number | null;
  locationName: string;
  isActive: boolean;
}

export interface GuardianRequest {
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  locationId: number | null;
}

export interface Location {
  id:          number;
  name:        string;
  building:    string;
  campus:      Campus;
  description: string;
  isActive:    boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}