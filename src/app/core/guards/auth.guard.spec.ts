import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, firstValueFrom, isObservable } from 'rxjs';
import { authGuard, loginGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthState } from '../models/auth.model';
import { User } from '../models/user.model';

describe('Auth Guards', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let authStateSubject: BehaviorSubject<AuthState>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    createdAt: new Date()
  };

  const authenticatedState: AuthState = {
    isAuthenticated: true,
    user: mockUser,
    token: 'mock-token'
  };

  const unauthenticatedState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  async function resolveGuardResult(guardResult: any): Promise<boolean> {
    if (typeof guardResult === 'boolean') {
      return guardResult;
    }
    if (isObservable(guardResult)) {
      return firstValueFrom(guardResult) as Promise<boolean>;
    }
    if (guardResult && typeof guardResult.then === 'function') {
      return await guardResult;
    }
    return guardResult;
  }

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authStateSubject = new BehaviorSubject<AuthState>(unauthenticatedState);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            authState$: authStateSubject.asObservable()
          }
        },
        { provide: Router, useValue: routerSpy }
      ]
    });

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {
      url: '/protected-route'
    } as RouterStateSnapshot;
  });

  afterEach(() => {
    authStateSubject.complete();
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', async () => {
      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', async () => {
      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: '/protected-route' } }
      );
    });

    it('should redirect to login with correct return URL', async () => {
      const customState = {
        url: '/admin/dashboard'
      } as RouterStateSnapshot;

      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, customState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: '/admin/dashboard' } }
      );
    });

    it('should handle empty return URL', async () => {
      const emptyState = {
        url: ''
      } as RouterStateSnapshot;

      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, emptyState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: '' } }
      );
    });

    it('should work with different route snapshots', async () => {
      const customRoute = {
        params: { id: '123' },
        data: { role: 'admin' }
      } as any;

      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(customRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('loginGuard', () => {
    it('should allow access when user is not authenticated', async () => {
      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access when user is authenticated', async () => {
      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should redirect authenticated user to home page', async () => {
      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should work without route and state parameters', async () => {
      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(undefined as any, undefined as any);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle user with null token but authenticated state', async () => {
      const partialAuthState: AuthState = {
        isAuthenticated: true,
        user: mockUser,
        token: null
      };

      authStateSubject.next(partialAuthState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('Guard Integration', () => {
    it('should work together - authGuard blocks, loginGuard allows', async () => {
      authStateSubject.next(unauthenticatedState);

      const authResult = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      const loginResult = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(authResult).toBe(false);
      expect(loginResult).toBe(true);
    });

    it('should work together - authGuard allows, loginGuard blocks', async () => {
      authStateSubject.next(authenticatedState);

      const authResult = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      const loginResult = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(authResult).toBe(true);
      expect(loginResult).toBe(false);
    });
  });

  describe('State Changes', () => {
    it('should respond to different authentication states in authGuard', async () => {
      authStateSubject.next(unauthenticatedState);

      const result1 = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });
      expect(result1).toBe(false);

      authStateSubject.next(authenticatedState);

      const result2 = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });
      expect(result2).toBe(true);
    });

    it('should respond to different authentication states in loginGuard', async () => {
      authStateSubject.next(authenticatedState);

      const result1 = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });
      expect(result1).toBe(false);

      authStateSubject.next(unauthenticatedState);

      const result2 = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });
      expect(result2).toBe(true);
    });
  });

  describe('Navigation Behavior', () => {
    beforeEach(() => {
      mockRouter.navigate.calls.reset();
    });

    it('should navigate when not authenticated', async () => {
      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate with different URLs correctly', async () => {
      authStateSubject.next(unauthenticatedState);

      const state1 = { url: '/page1' } as RouterStateSnapshot;
      const state2 = { url: '/page2' } as RouterStateSnapshot;

      const result1 = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, state1);
        return resolveGuardResult(guardResult);
      });

      const result2 = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, state2);
        return resolveGuardResult(guardResult);
      });

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: '/page1' } }
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: '/page2' } }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null route snapshot', async () => {
      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(null as any, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
    });

    it('should handle undefined URL in state', async () => {
      const stateWithUndefinedUrl = {
        url: undefined
      } as any;

      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, stateWithUndefinedUrl);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['auth/login'],
        { queryParams: { returnUrl: undefined } }
      );
    });
  });

  describe('Service Integration', () => {
    it('should use AuthService correctly', async () => {
      const customAuthState = {
        isAuthenticated: true,
        user: { ...mockUser, email: 'custom@test.com' },
        token: 'custom-token'
      };

      authStateSubject.next(customAuthState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(true);
    });

    it('should handle missing user data gracefully', async () => {
      const incompleteState = {
        isAuthenticated: false,
        user: null,
        token: null
      };

      authStateSubject.next(incompleteState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });

  describe('Observable Behavior', () => {
    it('should handle take(1) correctly for authGuard', async () => {
      authStateSubject.next(unauthenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = authGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

      authStateSubject.next(authenticatedState);

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });

    it('should handle take(1) correctly for loginGuard', async () => {
      authStateSubject.next(authenticatedState);

      const result = await TestBed.runInInjectionContext(async () => {
        const guardResult = loginGuard(mockRoute, mockState);
        return resolveGuardResult(guardResult);
      });

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

      authStateSubject.next(unauthenticatedState);

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });
  });
});
