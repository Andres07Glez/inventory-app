import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, ChangePasswordRequest, LoginRequest } from '../../models/auth.model';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../config/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

const TOKEN_KEY = 'inv_token';
const USER_KEY  = 'inv_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUser | null>(this.loadPersistedUser());

  /** Solo lectura hacia el exterior */
  readonly currentUser      = this._currentUser.asReadonly();
  readonly isAuthenticated  = computed(() => this._currentUser() !== null);
  readonly currentUserId    = computed(() => this._currentUser()?.userId ?? null);
  readonly mustChangePassword = computed(() => this._currentUser()?.mustChangePassword ?? false);

  // ── Auth flow ────────────────────────────────────────────────────────────

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        map(r => r.data),
        tap(user => this.persistSession(user))
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${environment.apiUrl}/auth/change-password`, request)
      .pipe(map(() => void 0));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Limpia el flag mustChangePassword en memoria y localStorage tras cambiar contraseña */
  clearMustChangePassword(): void {
    const user = this._currentUser();
    if (!user) return;
    const updated: AuthUser = { ...user, mustChangePassword: false };
    this.persistSession(updated);
  }

  // ── Internos ─────────────────────────────────────────────────────────────

  private persistSession(user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadPersistedUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      // JSON corrupto — limpiar y forzar nuevo login
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }
}
