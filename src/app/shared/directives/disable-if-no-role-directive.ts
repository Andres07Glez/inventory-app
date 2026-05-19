import { Directive, effect, HostBinding, inject, Input, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { UserRole } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth/auth.service';

@Directive({
  selector: '[disableIfNoRole]',
  standalone:true,
})
export class DisableIfNoRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly ngControl   = inject(NgControl, { optional: true });

  private readonly allowedRoles = signal<UserRole[]>([]);
  private isDisabled = false; // Cambiado a variable interna privada

  @Input({ required: true, alias: 'disableIfNoRole' })
  set roles(roles: UserRole | UserRole[]) {
    this.allowedRoles.set(Array.isArray(roles) ? roles : [roles]);
  }

  // Cambiamos a attr.disabled con un getter seguro para el compilador
  @HostBinding('attr.disabled')
  get attrDisabled() {
    return this.isDisabled ? 'disabled' : null;
  }

  constructor() {
    effect(() => {
      const currentRole = this.authService.currentUser()?.role;
      const allowed     = this.allowedRoles();

      const hasRole = !!(currentRole && allowed.includes(currentRole));
      const shouldDisable = !hasRole;

      this.isDisabled = shouldDisable;

      // Esto maneja perfectamente los componentes de PrimeNG con ngModel
      if (this.ngControl?.control) {
        if (shouldDisable) {
          this.ngControl.control.disable();
        } else {
          this.ngControl.control.enable();
        }
      }
    });
  }
}
