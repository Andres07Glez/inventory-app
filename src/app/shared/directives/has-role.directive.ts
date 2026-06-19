import { Directive, effect, inject, Input, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { UserRole } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth/auth.service';

@Directive({
  selector: '[hasRole]',
  standalone:true,
})
export class HasRoleDirective {
  private readonly authService   = inject(AuthService);
  private readonly templateRef   = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly allowedRoles = signal<UserRole[]>([]);

  @Input({ required: true })
  set hasRole(roles: UserRole | UserRole[]) {
    this.allowedRoles.set(Array.isArray(roles) ? roles : [roles]);
  }

  constructor() {
    effect(() => {
      const currentRole = this.authService.currentUser()?.role;
      const allowed     = this.allowedRoles();

      this.viewContainer.clear();
      if (currentRole && allowed.includes(currentRole)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
