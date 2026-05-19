import { UserRole } from './auth.model';

export type { UserRole };

export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  email: string;
  employeeNumber: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetail extends UserSummary {
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  email: string;
  employeeNumber: string;
  role: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

/** Respuesta paginada directa de Spring (sin wrapper ApiResponse) */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
