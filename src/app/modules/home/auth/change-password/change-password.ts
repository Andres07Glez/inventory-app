import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, ValidationErrors, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

/** Validador de grupo: newPassword y confirmPassword deben coincidir */
function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPwd     = control.get('newPassword')?.value;
  const confirmPwd = control.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-change-password',
  standalone:true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly isLoading        = signal(false);
  readonly errorMessage     = signal<string | null>(null);
  readonly currentVisible   = signal(false);
  readonly newVisible       = signal(false);
  readonly confirmVisible   = signal(false);

  readonly fullName = this.authService.currentUser()?.fullName ?? '';

  readonly form = this.fb.group(
    {
      currentPassword:  ['', [Validators.required]],
      newPassword:      ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword:  ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Limpiar el flag y redirigir al sistema
        this.authService.clearMustChangePassword();
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 400
            ? 'La contraseña actual es incorrecta.'
            : 'Error al actualizar. Intenta de nuevo.'
        );
      },
    });
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') &&
      !!this.form.get('confirmPassword')?.dirty;
  }

}
