import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }


  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const email = this.loginForm.get('email')?.value;

      this.authService.login(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.router.navigate(['../home']);
          }
        },
        error: (error) => {
          this.isLoading = false;

          // Si el usuario no existe, preguntar si crear cuenta
          if (error.message.includes('Usuario no encontrado') || error.message.includes('No autorizado')) {
            this.askToCreateUser(email);
          } else {
            this.errorMessage = error.message;
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }


  private askToCreateUser(email: string): void {
    // Usando confirm nativo (puedes cambiarlo por MatDialog si prefieres)
    const shouldCreate = confirm(
      `No se encontró una cuenta con el email: ${email}\n\n¿Deseas crear una nueva cuenta?`
    );

    if (shouldCreate) {
      this.createUser(email);
    }
  }


  private createUser(email: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.register(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.onSubmit(); // Reintentar login después de crear usuario
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Error al crear la cuenta: ${error.message}`;
      }
    });
  }


  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field.hasError('email')) {
      return 'Por favor ingresa un email válido';
    }

    return 'Campo inválido';
  }


  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  clearError(): void {
    this.errorMessage = '';
  }
}
