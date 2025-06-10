import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LoginResponse } from '../../../core/models/auth.model';
import { CreateUserResponse, User } from '../../../core/models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01')
  };

  const mockLoginResponse: LoginResponse = {
    success: true,
    data: {
      user: mockUser,
      token: 'mock-jwt-token',
      expiresIn: '24h'
    }
  };

  const mockCreateUserResponse: CreateUserResponse = {
    success: true,
    data: mockUser,
    message: 'User created successfully'
  };

  beforeEach(async () => {
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['login']);
    const userServiceSpyObj = jasmine.createSpyObj('UserService', ['register']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpyObj },
        { provide: UserService, useValue: userServiceSpyObj },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize login form with email field', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('email')?.hasError('required')).toBeTrue();
    });

    it('should initialize with default state', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      // El statusMessage puede tener el mensaje de carga inicial
      expect(component.statusMessage).toBeDefined();
    });

    it('should announce page load to screen readers on init', () => {
      spyOn(component, 'announceToScreenReader' as any);

      component.ngOnInit();

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Página de inicio de sesión cargada');
    });

    it('should focus email input after view init', fakeAsync(() => {
      spyOn(component.emailInput.nativeElement, 'focus');

      component.ngAfterViewInit();
      tick(100);

      expect(component.emailInput.nativeElement.focus).toHaveBeenCalled();
    }));
  });

  describe('Form Validation', () => {
    it('should validate required email field', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('');
      emailControl?.markAsTouched();

      expect(component.hasFieldError('email', 'required')).toBeTrue();
      expect(component.getFieldErrorMessage('email')).toBe('El email es requerido');
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      expect(component.hasFieldError('email', 'email')).toBeTrue();
      expect(component.getFieldErrorMessage('email')).toBe('Por favor ingresa un email válido');
    });

    it('should accept valid email format', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('valid@example.com');
      emailControl?.markAsTouched();

      expect(component.hasFieldError('email')).toBeFalse();
      expect(component.getFieldErrorMessage('email')).toBe('');
    });

    it('should return correct error messages for different validation errors', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('');
      emailControl?.setErrors({ required: true });
      emailControl?.markAsTouched();
      expect(component.getFieldErrorMessage('email')).toBe('El email es requerido');

      emailControl?.setValue('invalid');
      emailControl?.setErrors({ email: true });
      expect(component.getFieldErrorMessage('email')).toBe('Por favor ingresa un email válido');

      emailControl?.setValue('test');
      emailControl?.setErrors({ customError: true });
      expect(component.getFieldErrorMessage('email')).toBe('Campo inválido');
    });

    it('should return false for hasFieldError with non-existent field', () => {
      expect(component.hasFieldError('nonexistent')).toBeFalse();
      expect(component.hasFieldError('nonexistent', 'required')).toBeFalse();
    });

    it('should return empty string for getFieldErrorMessage with non-existent field', () => {
      expect(component.getFieldErrorMessage('nonexistent')).toBe('');
    });

    it('should return empty string when field has no errors', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('valid@example.com');
      emailControl?.markAsTouched();

      expect(component.getFieldErrorMessage('email')).toBe('');
    });
  });

  describe('Successful Login Flow', () => {
    it('should login successfully and navigate to home', fakeAsync(() => {
      const email = 'test@example.com';
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      expect(authServiceSpy.login).toHaveBeenCalledWith(email);
      expect(component.isLoading).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['../home']);
      expect(component.errorMessage).toBe('');
    }));

    it('should announce successful login to screen readers', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      const email = 'test@example.com';
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Inicio de sesión exitoso, redirigiendo...');
    }));

    it('should not navigate when response success is false', fakeAsync(() => {
      const email = 'test@example.com';
      const unsuccessfulResponse = { ...mockLoginResponse, success: false };
      authServiceSpy.login.and.returnValue(of(unsuccessfulResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      expect(component.isLoading).toBeFalse();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('Login Error Handling', () => {
    it('should handle general login errors', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      const email = 'test@example.com';
      const error = new Error('Server connection failed');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Server connection failed');
      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Error: Server connection failed');
    }));

    it('should ask to create user when user not found', fakeAsync(() => {
      const email = 'newuser@example.com';
      const error = new Error('Usuario no encontrado');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(of(mockCreateUserResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      // El componente debe procesar el error
      expect(component.isLoading).toBeFalse();

      // Simular el confirm que se ejecuta después del setTimeout
      tick(10);

      // El confirm debería haber sido llamado eventualmente
      expect(window.confirm).toHaveBeenCalled();
    }));

    it('should handle unauthorized error for user creation', fakeAsync(() => {
      const email = 'test@example.com';
      const error = new Error('No autorizado');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(of(mockCreateUserResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      // El componente debe procesar el error
      expect(component.isLoading).toBeFalse();

      tick(10);

      // El confirm debería haber sido llamado eventualmente
      expect(window.confirm).toHaveBeenCalled();
    }));

    it('should not create user when confirmation is denied', fakeAsync(() => {
      const email = 'newuser@example.com';
      const error = new Error('Usuario no encontrado');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      spyOn(window, 'confirm').and.returnValue(false);

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(2);

      expect(window.confirm).toHaveBeenCalled();
      expect(userServiceSpy.register).not.toHaveBeenCalled();
    }));

    it('should handle user creation errors', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      const email = 'newuser@example.com';
      const loginError = new Error('Usuario no encontrado');
      const createError = new Error('Email already exists');

      authServiceSpy.login.and.returnValue(throwError(() => loginError));
      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(throwError(() => createError));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(2);

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Error al crear la cuenta: Email already exists');
      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Error al crear cuenta: Email already exists');
    }));

    it('should login after successful user creation', fakeAsync(() => {
      const email = 'newuser@example.com';
      const loginError = new Error('Usuario no encontrado');

      authServiceSpy.login.and.returnValues(
        throwError(() => loginError),
        of(mockLoginResponse)
      );
      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(of(mockCreateUserResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(2);

      expect(userServiceSpy.register).toHaveBeenCalledWith(email);
      expect(authServiceSpy.login).toHaveBeenCalledTimes(2);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['../home']);
    }));

    it('should focus email input after error', fakeAsync(() => {
      spyOn(component.emailInput.nativeElement, 'focus');
      const email = 'test@example.com';
      const error = new Error('Invalid credentials');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(100);

      expect(component.emailInput.nativeElement.focus).toHaveBeenCalled();
    }));
  });

  describe('Form Submission Validation', () => {
    it('should prevent submission when form is invalid', () => {
      component.loginForm.get('email')?.setValue('');
      component.onSubmit();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should prevent multiple submissions when loading', () => {
      const email = 'test@example.com';
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.loginForm.get('email')?.setValue(email);
      component.isLoading = true;
      component.onSubmit();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should mark form as touched and announce error when invalid', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      spyOn(component, 'markFormGroupTouched' as any).and.callThrough();

      component.loginForm.get('email')?.setValue('');
      component.onSubmit();

      expect(component['markFormGroupTouched']).toHaveBeenCalled();
      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Por favor, corrige los errores en el formulario');
    }));

    it('should focus first error field when form is invalid', fakeAsync(() => {
      const mockElement = { focus: jasmine.createSpy('focus') };
      spyOn(component, 'getFirstErrorField' as any).and.returnValue(mockElement);

      component.loginForm.get('email')?.setValue('');
      component.onSubmit();

      tick(100);

      expect(mockElement.focus).toHaveBeenCalled();
    }));
  });

  describe('Keyboard Navigation', () => {
    it('should handle Enter key submission', () => {
      spyOn(component, 'onSubmit');
      const email = 'test@example.com';
      component.loginForm.get('email')?.setValue(email);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component.onEmailKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should not trigger onSubmit for non-Enter keys in email field', () => {
      spyOn(component, 'onSubmit');

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');

      component.onEmailKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.onSubmit).not.toHaveBeenCalled();
    });

    it('should handle space key on submit button', () => {
      spyOn(component, 'onSubmit');

      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');

      component.onSubmitKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should not trigger onSubmit for non-space keys on submit button', () => {
      spyOn(component, 'onSubmit');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component.onSubmitKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should clear error and status messages', () => {
      component.errorMessage = 'Some error';
      component.statusMessage = 'Some status';

      component.clearError();

      expect(component.errorMessage).toBe('');
      expect(component.statusMessage).toBe('');
    });

    it('should announce messages to screen readers', fakeAsync(() => {
      const message = 'Test announcement';

      component['announceToScreenReader'](message);

      expect(component.statusMessage).toBe(message);

      tick(1000);

      expect(component.statusMessage).toBe('');
    }));

    it('should focus email input', () => {
      spyOn(component.emailInput.nativeElement, 'focus');

      component['focusEmailInput']();

      expect(component.emailInput.nativeElement.focus).toHaveBeenCalled();
    });

    it('should handle focus when email input is not available', () => {
      const originalEmailInput = component.emailInput;
      component.emailInput = undefined as any;

      expect(() => component['focusEmailInput']()).not.toThrow();

      component.emailInput = originalEmailInput;
    });

    it('should mark all form controls as touched', () => {
      const emailControl = component.loginForm.get('email');

      expect(emailControl?.touched).toBeFalse();

      component['markFormGroupTouched']();

      expect(emailControl?.touched).toBeTrue();
    });

    it('should return first error field element', () => {
      const mockElement = document.createElement('input');
      mockElement.setAttribute('aria-invalid', 'true');

      spyOn(document, 'querySelector').and.returnValue({
        querySelectorAll: jasmine.createSpy().and.returnValue([mockElement])
      } as any);

      const result = component['getFirstErrorField']();
      expect(result).toBe(mockElement);
    });

    it('should return null when no form element found', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      const result = component['getFirstErrorField']();
      expect(result).toBeNull();
    });

    it('should return null when no error fields found', () => {
      spyOn(document, 'querySelector').and.returnValue({
        querySelectorAll: jasmine.createSpy().and.returnValue([])
      } as any);

      const result = component['getFirstErrorField']();
      expect(result).toBeNull();
    });
  });

  describe('User Creation Flow', () => {
    it('should handle user creation flow basic steps', fakeAsync(() => {
      const email = 'newuser@example.com';
      const loginError = new Error('Usuario no encontrado');

      authServiceSpy.login.and.returnValue(throwError(() => loginError));
      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(of(mockCreateUserResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();
      expect(component.isLoading).toBeFalse();

      tick(10);
      expect(window.confirm).toHaveBeenCalled();
    }));

    it('should handle user creation with unsuccessful response', fakeAsync(() => {
      const email = 'newuser@example.com';
      const loginError = new Error('Usuario no encontrado');
      const unsuccessfulCreateResponse = { ...mockCreateUserResponse, success: false };

      authServiceSpy.login.and.returnValue(throwError(() => loginError));
      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(of(unsuccessfulCreateResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(10);

      expect(component.isLoading).toBeFalse();
    }));

    it('should focus email input after user creation error', fakeAsync(() => {
      spyOn(component.emailInput.nativeElement, 'focus');
      const email = 'newuser@example.com';
      const loginError = new Error('Usuario no encontrado');
      const createError = new Error('Email already exists');

      authServiceSpy.login.and.returnValue(throwError(() => loginError));
      spyOn(window, 'confirm').and.returnValue(true);
      userServiceSpy.register.and.returnValue(throwError(() => createError));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick(110);

      expect(component.emailInput.nativeElement.focus).toHaveBeenCalled();
    }));
  });

  describe('Accessibility Features', () => {
    it('should announce login verification start', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      const email = 'test@example.com';
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Iniciando verificación de credenciales');
    }));

    it('should handle accessibility announcements', fakeAsync(() => {
      spyOn(component, 'announceToScreenReader' as any);
      const email = 'test@example.com';
      const error = new Error('Invalid credentials');
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component.loginForm.get('email')?.setValue(email);
      component.onSubmit();

      tick();

      expect(component['announceToScreenReader']).toHaveBeenCalledWith('Error: Invalid credentials');
    }));
  });
});
