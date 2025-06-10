import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpHandler, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor, AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

describe('Auth Interceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const testUrl = 'https://api.example.com/test';
  const authUrl = 'https://api.example.com/auth/login';
  const registerUrl = 'https://api.example.com/auth/register';
  const mockToken = 'test-token-123';

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        AuthInterceptor,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Functional Interceptor (authInterceptor)', () => {
    it('should add Authorization header when token exists and not auth endpoint', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl).subscribe();

      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not add Authorization header when no token', () => {
      mockAuthService.getToken.and.returnValue(null);

      httpClient.get(testUrl).subscribe();

      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header for login endpoint', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.post(authUrl, {}).subscribe();

      const req = httpTestingController.expectOne(authUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header for register endpoint', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.post(registerUrl, {}).subscribe();

      const req = httpTestingController.expectOne(registerUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should handle 401 error and logout for non-auth endpoints', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(mockAuthService.logout).toHaveBeenCalled();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        }
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should not logout on 401 error for auth endpoints', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.post(authUrl, {}).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(mockAuthService.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        }
      });

      const req = httpTestingController.expectOne(authUrl);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should pass through non-401 errors without logout', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(mockAuthService.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        }
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle multiple concurrent requests with token', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(`${testUrl}/1`).subscribe();
      httpClient.get(`${testUrl}/2`).subscribe();
      httpClient.get(`${testUrl}/3`).subscribe();

      const req1 = httpTestingController.expectOne(`${testUrl}/1`);
      const req2 = httpTestingController.expectOne(`${testUrl}/2`);
      const req3 = httpTestingController.expectOne(`${testUrl}/3`);

      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req3.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });
  });

  describe('Class-based Interceptor (AuthInterceptor)', () => {
    let interceptor: AuthInterceptor;
    let mockNext: jasmine.SpyObj<HttpHandler>;

    beforeEach(() => {
      interceptor = TestBed.inject(AuthInterceptor);
      mockNext = jasmine.createSpyObj('HttpHandler', ['handle']);
    });

    it('should add Authorization header when token exists', () => {
      mockAuthService.getToken.and.returnValue(mockToken);
      mockNext.handle.and.returnValue(of({} as any));

      const req = new HttpRequest('GET', testUrl);

      interceptor.intercept(req, mockNext).subscribe();

      expect(mockNext.handle).toHaveBeenCalledWith(
        jasmine.objectContaining({
          headers: jasmine.objectContaining({
            lazyUpdate: jasmine.arrayContaining([
              jasmine.objectContaining({
                name: 'Authorization',
                value: `Bearer ${mockToken}`
              })
            ])
          })
        })
      );
    });

    it('should not add Authorization header when no token', () => {
      mockAuthService.getToken.and.returnValue(null);
      mockNext.handle.and.returnValue(of({} as any));

      const req = new HttpRequest('GET', testUrl);

      interceptor.intercept(req, mockNext).subscribe();

      expect(mockNext.handle).toHaveBeenCalledWith(req);
    });

    it('should not add Authorization header for auth endpoints', () => {
      mockAuthService.getToken.and.returnValue(mockToken);
      mockNext.handle.and.returnValue(of({} as any));

      const loginReq = new HttpRequest('POST', authUrl, {});
      const registerReq = new HttpRequest('POST', registerUrl, {});

      interceptor.intercept(loginReq, mockNext).subscribe();
      interceptor.intercept(registerReq, mockNext).subscribe();

      expect(mockNext.handle).toHaveBeenCalledWith(loginReq);
      expect(mockNext.handle).toHaveBeenCalledWith(registerReq);
    });

    it('should handle 401 error and logout', () => {
      mockAuthService.getToken.and.returnValue(mockToken);
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockNext.handle.and.returnValue(throwError(() => error));

      const req = new HttpRequest('GET', testUrl);

      interceptor.intercept(req, mockNext).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(401);
          expect(mockAuthService.logout).toHaveBeenCalled();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        }
      });
    });

    it('should not logout on 401 error for auth endpoints', () => {
      mockAuthService.getToken.and.returnValue(mockToken);
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockNext.handle.and.returnValue(throwError(() => error));

      const req = new HttpRequest('POST', authUrl, {});

      interceptor.intercept(req, mockNext).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(401);
          expect(mockAuthService.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        }
      });
    });

    it('should pass through non-401 errors', () => {
      mockAuthService.getToken.and.returnValue(mockToken);
      const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      mockNext.handle.and.returnValue(throwError(() => error));

      const req = new HttpRequest('GET', testUrl);

      interceptor.intercept(req, mockNext).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(mockAuthService.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Auth Endpoint Detection', () => {
    it('should correctly identify login endpoints', () => {
      const urls = [
        'https://api.example.com/auth/login',
        'http://localhost:3000/auth/login',
        'https://api.test.com/v1/auth/login',
        '/auth/login'
      ];

      urls.forEach(url => {
        mockAuthService.getToken.and.returnValue(mockToken);

        httpClient.post(url, {}).subscribe();
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get('Authorization')).toBeNull();
        req.flush({});
      });
    });

    it('should correctly identify register endpoints', () => {
      const urls = [
        'https://api.example.com/auth/register',
        'http://localhost:3000/auth/register',
        'https://api.test.com/v1/auth/register',
        '/auth/register'
      ];

      urls.forEach(url => {
        mockAuthService.getToken.and.returnValue(mockToken);

        httpClient.post(url, {}).subscribe();
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get('Authorization')).toBeNull();
        req.flush({});
      });
    });

    it('should not identify non-auth endpoints as auth endpoints', () => {
      const urls = [
        'https://api.example.com/users',
        'https://api.example.com/tasks',
        'https://api.example.com/profile',
        '/api/data'
      ];

      urls.forEach(url => {
        mockAuthService.getToken.and.returnValue(mockToken);

        httpClient.get(url).subscribe();
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
        req.flush({});
      });
    });
  });

  describe('Token Management', () => {
    it('should handle empty string token', () => {
      mockAuthService.getToken.and.returnValue('');

      httpClient.get(testUrl).subscribe();
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should handle undefined token', () => {
      mockAuthService.getToken.and.returnValue(undefined as any);

      httpClient.get(testUrl).subscribe();
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should handle token with spaces', () => {
      const tokenWithSpaces = '  token-with-spaces  ';
      mockAuthService.getToken.and.returnValue(tokenWithSpaces);

      httpClient.get(testUrl).subscribe();
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${tokenWithSpaces}`);
      req.flush({});
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error).toBeInstanceOf(ProgressEvent);
          expect(mockAuthService.logout).not.toHaveBeenCalled();
        }
      });

      const req = httpTestingController.expectOne(testUrl);
      req.error(new ProgressEvent('error'));
    });

    it('should handle multiple 401 errors without multiple logouts', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(`${testUrl}/1`).subscribe({
        error: () => {}
      });
      httpClient.get(`${testUrl}/2`).subscribe({
        error: () => {}
      });

      const req1 = httpTestingController.expectOne(`${testUrl}/1`);
      const req2 = httpTestingController.expectOne(`${testUrl}/2`);

      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(mockAuthService.logout).toHaveBeenCalledTimes(2);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
    });

    it('should handle 401 error with custom error message', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.error.message).toBe('Token expired');
          expect(mockAuthService.logout).toHaveBeenCalled();
        }
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(
        { message: 'Token expired' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Request Modification', () => {
    it('should preserve existing headers when adding Authorization', () => {
      mockAuthService.getToken.and.returnValue(mockToken);

      httpClient.get(testUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      }).subscribe();

      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
      req.flush({});
    });

    it('should not modify request when no token and no errors', () => {
      mockAuthService.getToken.and.returnValue(null);

      const originalHeaders = { 'Content-Type': 'application/json' };
      httpClient.get(testUrl, { headers: originalHeaders }).subscribe();

      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBeNull();
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({});
    });
  });
});
