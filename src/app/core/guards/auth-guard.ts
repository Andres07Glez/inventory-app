import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
/**
 * Bloquea el acceso al Shell mientras el usuario tenga
 * mustChangePassword = true. Redirige a /cambiar-password.
 */
export const firstLoginGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.mustChangePassword()
    ? router.createUrlTree(['/cambiar-password'])
    : true;
};
