import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { CreateUserResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01')
  };

  const mockCreateUserResponse: CreateUserResponse = {
    success: true,
    data: mockUser,
    message: 'User created successfully',
    timestamp: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: AuthService, useValue: authServiceSpyObj },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('User Registration', () => {
    it('should register user successfully with valid email', () => {
      const email = 'test@example.com';

      service.register(email).subscribe(response => {
        expect(response).toEqual(mockCreateUserResponse);
        expect(response.success).toBeTrue();
        expect(response.data.email).toBe(email);
        expect(response.data.id).toBe('123');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: email.toLowerCase() });
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockCreateUserResponse);
    });

    it('should trim and lowercase email before sending', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const expectedEmail = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      expect(req.request.body).toEqual({ email: expectedEmail });

      req.flush(mockCreateUserResponse);
    });

    it('should log successful registration', () => {
      spyOn(console, 'log');
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(mockCreateUserResponse);

      expect(console.log).toHaveBeenCalledWith('User registration successful:', mockCreateUserResponse);
    });

    it('should not log when registration succeeds but response.success is false', () => {
      spyOn(console, 'log');
      const email = 'test@example.com';
      const unsuccessfulResponse = { ...mockCreateUserResponse, success: false };

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(unsuccessfulResponse);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not log when registration succeeds but user data is missing email', () => {
      spyOn(console, 'log');
      const email = 'test@example.com';
      const responseWithoutEmail = {
        ...mockCreateUserResponse,
        data: { ...mockUser, email: '' }
      };

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(responseWithoutEmail);

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    it('should handle 400 Bad Request error', () => {
      const email = 'invalid-email';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Invalid email format');
          expect(console.error).toHaveBeenCalledWith('Auth Service Error:', jasmine.any(Object));
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Invalid email format' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 400 error without custom message', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Datos inválidos');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 Unauthorized and call logout', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('No autorizado');
          expect(authServiceSpy.logout).toHaveBeenCalled();
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 Not Found error', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Usuario no encontrado');
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Endpoint not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 Internal Server Error', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error interno del servidor');
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Database connection failed' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle client-side errors', () => {
      const email = 'test@example.com';
      const clientError = new ErrorEvent('Network error', {
        message: 'Connection failed'
      });

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error: Connection failed');
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.error(clientError);
    });

    it('should handle unknown status codes with custom error message', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Custom error from server');
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Custom error from server' }, { status: 418, statusText: "I'm a teapot" });
    });

    it('should handle unknown status codes without custom message', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe("Error 418: I'm a teapot");
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(null, { status: 418, statusText: "I'm a teapot" });
    });

    it('should handle unexpected error format gracefully', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error 0: Unknown Error');
          expect(console.error).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(null, { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('HTTP Headers', () => {
    it('should send correct headers with registration request', () => {
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush(mockCreateUserResponse);
    });

    it('should use private getHeaders method consistently', () => {
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      const headers = req.request.headers;

      expect(headers.has('Content-Type')).toBeTrue();
      expect(headers.has('Accept')).toBeTrue();
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Accept')).toBe('application/json');

      req.flush(mockCreateUserResponse);
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint for user registration', () => {
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      expect(req.request.url).toBe(`${environment.apiUrl}/user`);
      expect(req.request.method).toBe('POST');

      req.flush(mockCreateUserResponse);
    });

    it('should use environment API URL correctly', () => {
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/user') && request.url.startsWith(environment.apiUrl);
      });

      expect(req).toBeTruthy();
      req.flush(mockCreateUserResponse);
    });
  });

  describe('Response Data Validation', () => {
    it('should handle successful response with all expected fields', () => {
      const email = 'test@example.com';
      const completeResponse: CreateUserResponse = {
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: new Date('2024-01-01')
        },
        message: 'User created successfully',
        timestamp: '2024-01-01T12:00:00Z'
      };

      service.register(email).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data.id).toBe('user-123');
        expect(response.data.email).toBe('test@example.com');
        expect(response.message).toBe('User created successfully');
        expect(response.timestamp).toBe('2024-01-01T12:00:00Z');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(completeResponse);
    });

    it('should handle response with only required fields', () => {
      const email = 'test@example.com';
      const minimalResponse: CreateUserResponse = {
        success: true,
        data: mockUser
      };

      service.register(email).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data).toEqual(mockUser);
        expect(response.message).toBeUndefined();
        expect(response.timestamp).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(minimalResponse);
    });

    it('should handle response where success is false', () => {
      const email = 'test@example.com';
      const failureResponse: CreateUserResponse = {
        success: false,
        data: mockUser,
        message: 'User already exists'
      };

      service.register(email).subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('User already exists');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(failureResponse);
    });
  });

  describe('Email Processing', () => {
    it('should handle various email formats correctly', () => {
      const emailTestCases = [
        { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' },
        { input: '  user@domain.co  ', expected: 'user@domain.co' },
        { input: 'User.Name@EXAMPLE.ORG', expected: 'user.name@example.org' },
        { input: '\t\n  EMAIL@TEST.COM  \n\t', expected: 'email@test.com' }
      ];

      emailTestCases.forEach(testCase => {
        service.register(testCase.input).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/user`);
        expect(req.request.body.email).toBe(testCase.expected);

        req.flush(mockCreateUserResponse);
      });
    });

    it('should preserve special characters in email', () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user-name@example.com',
        'user_name@example.com'
      ];

      specialEmails.forEach(email => {
        service.register(email).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/user`);
        expect(req.request.body.email).toBe(email.toLowerCase());

        req.flush(mockCreateUserResponse);
      });
    });
  });

  describe('Observable Operators', () => {
    it('should use tap operator for logging successful responses', () => {
      spyOn(console, 'log');
      const email = 'test@example.com';

      service.register(email).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(mockCreateUserResponse);

      expect(console.log).toHaveBeenCalledWith('User registration successful:', mockCreateUserResponse);
    });

    it('should use catchError operator for error handling', () => {
      spyOn(console, 'error');
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Error interno del servidor');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('AuthService Integration', () => {
    it('should call authService.logout on 401 error', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not call authService.logout on non-401 errors', () => {
      const email = 'test@example.com';

      service.register(email).subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(authServiceSpy.logout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user`);
      req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
