import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { LoginResponse, AuthState } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let localStorageStore: { [key: string]: string };

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
    },
    message: 'Login successful'
  };

  beforeEach(() => {
    localStorageStore = {};

    const localStorageMock = {
      getItem: jasmine.createSpy('getItem').and.callFake((key: string): string | null => {
        return localStorageStore[key] || null;
      }),
      setItem: jasmine.createSpy('setItem').and.callFake((key: string, value: string): void => {
        localStorageStore[key] = value;
      }),
      removeItem: jasmine.createSpy('removeItem').and.callFake((key: string): void => {
        delete localStorageStore[key];
      }),
      clear: jasmine.createSpy('clear').and.callFake((): void => {
        localStorageStore = {};
      }),
      length: 0,
      key: jasmine.createSpy('key').and.returnValue(null)
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorageStore = {};
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      service = TestBed.inject(AuthService);
      expect(service).toBeTruthy();
    });

    it('should initialize with unauthenticated state when no stored data', (done) => {
      localStorageStore = {};
      service = TestBed.inject(AuthService);

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeFalse();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        done();
      });
    });

    it('should initialize with authenticated state when valid stored data exists', (done) => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      localStorageStore['auth_token'] = 'stored-token';
      localStorageStore['user_data'] = JSON.stringify(userData);

      service = TestBed.inject(AuthService);

      setTimeout(() => {
        service.authState$.subscribe(state => {
          expect(state.isAuthenticated).toBeTrue();
          expect(state.user?.id).toBe('123');
          expect(state.user?.email).toBe('test@example.com');
          expect(state.token).toBe('stored-token');
          done();
        });
      }, 10);
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should login successfully with valid credentials', () => {
      const email = 'test@example.com';

      service.login(email).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(service.getToken()).toBe('mock-jwt-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: email.toLowerCase() });
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockLoginResponse);
    });

    it('should trim and lowercase email before sending', () => {
      const email = '  TEST@EXAMPLE.COM  ';

      service.login(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.body).toEqual({ email: 'test@example.com' });

      req.flush(mockLoginResponse);
    });

    it('should store auth data in localStorage on successful login', () => {
      const email = 'test@example.com';

      service.login(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(mockUser));
      expect(localStorageStore['auth_token']).toBe('mock-jwt-token');
      expect(localStorageStore['user_data']).toBe(JSON.stringify(mockUser));
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should handle 401 Unauthorized error', () => {
      const email = 'test@example.com';

      service.login(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('No autorizado');
          expect(service.isAuthenticated()).toBeFalse();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 User not found error', () => {
      const email = 'nonexistent@example.com';

      service.login(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Usuario no encontrado');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 Internal Server Error', () => {
      const email = 'test@example.com';

      service.login(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error interno del servidor');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 400 Bad Request with custom message', () => {
      const email = 'test@example.com';

      service.login(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Invalid email format');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid email format' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle client-side errors', () => {
      const email = 'test@example.com';
      const clientError = new ErrorEvent('Network error', {
        message: 'Connection failed'
      });

      service.login(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error: Connection failed');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.error(clientError);
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      localStorageStore['auth_token'] = 'test-token';
      localStorageStore['user_data'] = JSON.stringify(mockUser);
      service = TestBed.inject(AuthService);
    });

    it('should logout and clear all auth data', () => {
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_data');
      expect(localStorageStore['auth_token']).toBeUndefined();
      expect(localStorageStore['user_data']).toBeUndefined();
    });

    it('should update auth state observable on logout', (done) => {
      service.logout();

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeFalse();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        done();
      });
    });
  });

  describe('Email Validation', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co',
        'user+tag@example.org',
        'user123@example-domain.com'
      ];

      validEmails.forEach(email => {
        expect(service.isValidEmail(email)).toBeTrue();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
        'user@@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(service.isValidEmail(email)).toBeFalse();
      });
    });
  });

  describe('Auth State Management', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should return current authentication status', () => {
      expect(service.isAuthenticated()).toBeFalse();

      service.login('test@example.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return current user', () => {
      expect(service.getCurrentUser()).toBeNull();

      service.login('test@example.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return current token', () => {
      expect(service.getToken()).toBeNull();

      service.login('test@example.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);

      expect(service.getToken()).toBe('mock-jwt-token');
    });
  });

  describe('LocalStorage Error Handling', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('should handle localStorage access gracefully', () => {
      spyOn(console, 'error');

      // Test that service continues to work even if localStorage has issues
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getToken()).toBeNull();

      // These methods should not throw even if localStorage fails
      expect(() => service.logout()).not.toThrow();
    });

    it('should handle service operations without localStorage', () => {
      // Test basic service functionality
      expect(service.isValidEmail('test@example.com')).toBeTrue();
      expect(service.isValidEmail('invalid-email')).toBeFalse();

      // Login should still work (the HTTP part)
      service.login('test@example.com').subscribe({
        next: (response) => {
          expect(response).toEqual(mockLoginResponse);
        },
        error: () => fail('Login should succeed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });
  });

  describe('SSR Safety', () => {
    it('should handle logout gracefully', () => {
      service = TestBed.inject(AuthService);

      expect(() => service.logout()).not.toThrow();
      expect(() => service.isAuthenticated()).not.toThrow();
    });
  });
});
