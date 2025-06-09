import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  statusMessage = '';

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.announceToScreenReader('Página de inicio de sesión cargada');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.focusEmailInput();
    }, 100);
  }

  private focusEmailInput(): void {
    if (this.emailInput?.nativeElement) {
      this.emailInput.nativeElement.focus();
    }
  }

  onEmailKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onSubmitKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.announceToScreenReader('Iniciando verificación de credenciales');

      const email = this.loginForm.get('email')?.value;

      this.authService.login(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.announceToScreenReader('Inicio de sesión exitoso, redirigiendo...');
            this.router.navigate(['../home']);
          }
        },
        error: (error) => {
          this.isLoading = false;

          if (error.message.includes('Usuario no encontrado') || error.message.includes('No autorizado')) {
            this.askToCreateUser(email);
          } else {
            this.errorMessage = error.message;
            this.announceToScreenReader(`Error: ${error.message}`);
            setTimeout(() => this.focusEmailInput(), 100);
          }
        }
      });
    } else {
      this.markFormGroupTouched();
      this.announceToScreenReader('Por favor, corrige los errores en el formulario');

      const firstErrorField = this.getFirstErrorField();
      if (firstErrorField) {
        setTimeout(() => firstErrorField.focus(), 100);
      }
    }
  }

  private askToCreateUser(email: string): void {
    this.errorMessage = `No se encontró una cuenta con el email: ${email}`;
    this.announceToScreenReader(
      `Usuario no encontrado. ¿Deseas crear una nueva cuenta con ${email}? Presiona C para crear cuenta o cualquier otra tecla para cancelar.`
    );

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'c') {
        this.createUser(email);
      } else {
        this.announceToScreenReader('Creación de cuenta cancelada');
      }
      document.removeEventListener('keydown', keyHandler);
    };

    document.addEventListener('keydown', keyHandler);

    setTimeout(() => {
      const shouldCreate = confirm(
        `No se encontró una cuenta con el email: ${email}\n\n¿Deseas crear una nueva cuenta?`
      );

      if (shouldCreate) {
        this.createUser(email);
      }
      document.removeEventListener('keydown', keyHandler);
    }, 1);
  }

  private createUser(email: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.announceToScreenReader('Creando nueva cuenta...');

    this.userService.register(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.announceToScreenReader('Cuenta creada exitosamente, iniciando sesión...');
          this.onSubmit();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Error al crear la cuenta: ${error.message}`;
        this.announceToScreenReader(`Error al crear cuenta: ${error.message}`);
        setTimeout(() => this.focusEmailInput(), 100);
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
      return 'El email es requerido';
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

  private getFirstErrorField(): HTMLElement | null {
    const formElement = document.querySelector('form');
    if (!formElement) return null;

    const errorFields = formElement.querySelectorAll('[aria-invalid="true"]');
    return errorFields.length > 0 ? errorFields[0] as HTMLElement : null;
  }

  clearError(): void {
    this.errorMessage = '';
    this.statusMessage = '';
  }

  private announceToScreenReader(message: string): void {
    this.statusMessage = message;

    setTimeout(() => {
      this.statusMessage = '';
    }, 1000);
  }
}
