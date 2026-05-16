import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone:true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly passwordVisible = signal(false);
  readonly isLoading       = signal(false);
  readonly errorMessage    = signal<string | null>(null);

  readonly form = this.fb.group({
    employeeNumber: ['', [Validators.required]],
    password:       ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { employeeNumber, password } = this.form.getRawValue();

    this.authService.login({ employeeNumber: employeeNumber!, password: password! }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        // El guard firstLoginGuard maneja la redirección si mustChangePassword = true
        const destination = user.mustChangePassword ? '/cambiar-password' : '/';
        this.router.navigate([destination]);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Número de empleado o contraseña incorrectos.'
            : 'Error de conexión. Verifica que el servidor esté activo.'
        );
      },
    });
  }

  togglePassword(): void {
    this.passwordVisible.update(v => !v);
  }

}
