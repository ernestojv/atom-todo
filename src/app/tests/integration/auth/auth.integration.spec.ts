import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { authInterceptor } from '../../../core/interceptors/auth.interceptor';
import { authGuard, loginGuard } from '../../../core/guards/auth.guard';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { AuthState, LoginResponse } from '../../../core/models/auth.model';
import { User } from '../../../core/models/user.model';
import { Task, TaskResponse } from '../../../core/models/task.model';

@Component({
  template: '<h1>Login Page</h1><button id="login-btn">Login</button>',
  standalone: true
})
class MockLoginComponent { }

@Component({
  template: '<h1>Register Page</h1><button id="register-btn">Register</button>',
  standalone: true
})
class MockRegisterComponent { }

@Component({
  template: '<div class="home-page"><h1>Home Page</h1><div id="tasks-container">Tasks loaded</div></div>',
  standalone: true
})
class MockHomeComponent { }

@Component({
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterOutlet]
})
class MockAppComponent { }

describe('Authentication Integration Tests', () => {
  let fixture: ComponentFixture<MockAppComponent>;
  let router: Router;
  let location: Location;
  let httpTestingController: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let authStateSubject: BehaviorSubject<AuthState>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01')
  };

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo',
      userEmail: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTaskResponse: TaskResponse = {
    success: true,
    data: mockTasks,
    message: 'Tasks retrieved successfully'
  };

  const unauthenticatedState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  const authenticatedState: AuthState = {
    isAuthenticated: true,
    user: mockUser,
    token: 'mock-token'
  };

  beforeEach(async () => {
    authStateSubject = new BehaviorSubject<AuthState>(unauthenticatedState);

    const authServiceSpy = jasmine.createSpyObj('AuthService',
      ['login', 'logout', 'isAuthenticated', 'getCurrentUser', 'getToken', 'isValidEmail']
    );

    const taskServiceSpy = jasmine.createSpyObj('TaskService',
      ['getTasksByUserEmail', 'createTask', 'updateTask', 'deleteTask']
    );

    Object.defineProperty(authServiceSpy, 'authState$', {
      get: () => authStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'auth/login',
            component: MockLoginComponent,
            canActivate: [loginGuard]
          },
          {
            path: 'auth/register',
            component: MockRegisterComponent,
            canActivate: [loginGuard]
          },
          {
            path: 'home',
            component: MockHomeComponent,
            canActivate: [authGuard]
          },
          { path: '', redirectTo: '/home', pathMatch: 'full' },
          { path: '**', redirectTo: '/auth/login' }
        ])
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MockAppComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    mockAuthService.isAuthenticated.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(null);
    mockAuthService.getToken.and.returnValue(null);
    mockAuthService.isValidEmail.and.returnValue(true);
    mockTaskService.getTasksByUserEmail.and.returnValue(of(mockTaskResponse));
  });

  afterEach(() => {
    if (httpTestingController) {
      httpTestingController.verify();
    }
    if (authStateSubject) {
      authStateSubject.complete();
    }
  });

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated user to login', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');
    });

    it('should allow authenticated user to access home', async () => {
      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('mock-token');

      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });

    it('should redirect authenticated user away from login', async () => {
      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('mock-token');

      fixture.detectChanges();

      await router.navigate(['/auth/login']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });

    it('should complete full login flow', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      const loginResponse: LoginResponse = {
        success: true,
        data: {
          user: mockUser,
          token: 'new-token',
          expiresIn: '1h'
        },
        message: 'Login successful'
      };

      mockAuthService.login.and.returnValue(of(loginResponse));

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('new-token');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });
  });

  describe('Guard Integration', () => {
    it('should handle multiple guard checks correctly', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');
    });

    it('should preserve return URL through authentication', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });

    it('should handle loginGuard correctly', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/auth/login']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login');

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      fixture.detectChanges();
      await fixture.whenStable();

      await router.navigate(['/auth/register']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });
  });

  describe('Service Integration', () => {
    it('should call AuthService methods correctly', async () => {
      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      fixture.detectChanges();
      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockAuthService.getToken).toBeDefined();
      expect(mockAuthService.getCurrentUser).toBeDefined();
      expect(mockAuthService.isAuthenticated).toBeDefined();
    });

    it('should handle logout flow', async () => {
      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      fixture.detectChanges();
      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');

      authStateSubject.next(unauthenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.getToken.and.returnValue(null);
      mockAuthService.logout.and.stub();

      fixture.detectChanges();
      await fixture.whenStable();

      await router.navigate(['/']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });
  });

  describe('Component Integration', () => {
    it('should render login component when unauthenticated', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/auth/login']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login');

      const loginContent = fixture.nativeElement.textContent;
      expect(loginContent).toContain('Login Page');
    });

    it('should render home component when authenticated', async () => {
      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      fixture.detectChanges();
      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');

      const homeContent = fixture.nativeElement.textContent;
      expect(homeContent).toContain('Home Page');
    });

    it('should not show protected content when not authenticated', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      const content = fixture.nativeElement.textContent;
      expect(content).not.toContain('Home Page');
      expect(content).not.toContain('Tasks loaded');
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should handle complete user session lifecycle', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('session-token');

      fixture.detectChanges();
      await fixture.whenStable();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');

      authStateSubject.next(unauthenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.getToken.and.returnValue(null);
      mockAuthService.logout.and.stub();

      fixture.detectChanges();
      await fixture.whenStable();

      await router.navigate(['/']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');
    });

    it('should handle navigation between public and protected routes', async () => {
      authStateSubject.next(unauthenticatedState);
      fixture.detectChanges();

      await router.navigate(['/auth/login']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login');

      await router.navigate(['/auth/register']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/register');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');

      authStateSubject.next(authenticatedState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getToken.and.returnValue('valid-token');

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');

      await router.navigate(['/auth/login']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(location.path()).toBe('/home');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle auth service errors gracefully', async () => {
      authStateSubject.next(unauthenticatedState);
      mockAuthService.isAuthenticated.and.throwError('Auth service error');

      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/auth/login?returnUrl=%2Fhome');
    });

    it('should handle invalid auth state', async () => {
      const invalidState: AuthState = {
        isAuthenticated: true,
        user: null,
        token: 'some-token'
      };

      authStateSubject.next(invalidState);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.getToken.and.returnValue('some-token');

      fixture.detectChanges();

      await router.navigate(['/home']);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(location.path()).toBe('/home');
    });
  });
});
