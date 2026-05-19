export type UserRole = 'ADMIN' | 'OPERADOR' | 'AUDITOR';
export interface LoginRequest {
  employeeNumber: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthUser {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}
