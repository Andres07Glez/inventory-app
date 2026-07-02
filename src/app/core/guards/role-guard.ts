import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService   = inject(AuthService);
  const router        = inject(Router);

  const allowedRoles  = route.data['roles'] as UserRole[] | undefined;

  // Sin restricción de roles declarada → cualquier usuario autenticado puede pasar
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const currentRole = authService.currentUser()?.role;

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree(['/inventario/mis-bienes']);
};
