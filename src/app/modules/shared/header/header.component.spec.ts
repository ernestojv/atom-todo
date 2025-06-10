import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject AuthService', () => {
      expect(component['authService']).toBeTruthy();
    });

    it('should inject Router', () => {
      expect(component['router']).toBeTruthy();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render the header container with correct classes', () => {
      const headerDiv = fixture.nativeElement.querySelector('div.w-full.h-18.bg-white');
      expect(headerDiv).toBeTruthy();
      expect(headerDiv.classList).toContain('border-b-2');
      expect(headerDiv.classList).toContain('border-gray-100');
      expect(headerDiv.classList).toContain('flex');
      expect(headerDiv.classList).toContain('items-center');
      expect(headerDiv.classList).toContain('justify-between');
      expect(headerDiv.classList).toContain('px-4');
    });

    it('should render the logo icon', () => {
      const iconElement = fixture.nativeElement.querySelector('em.pi.pi-check-square');
      expect(iconElement).toBeTruthy();
      expect(iconElement.classList).toContain('font-semibold');
    });

    it('should render the application title', () => {
      const titleElement = fixture.nativeElement.querySelector('span.text-lg.font-semibold');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent.trim()).toBe('Atom - TODO');
    });

    it('should render the logout button', () => {
      const logoutButton = fixture.nativeElement.querySelector('button');
      expect(logoutButton).toBeTruthy();
      expect(logoutButton.textContent.trim()).toBe('Cerrar sesión');
    });

    it('should apply correct classes to logout button', () => {
      const logoutButton = fixture.nativeElement.querySelector('button');
      expect(logoutButton.classList).toContain('text-gray-700');
      expect(logoutButton.classList).toContain('hover:text-gray-900');
      expect(logoutButton.classList).toContain('focus:outline-none');
      expect(logoutButton.classList).toContain('border-2');
      expect(logoutButton.classList).toContain('border-gray-200');
      expect(logoutButton.classList).toContain('px-4');
      expect(logoutButton.classList).toContain('py-2');
      expect(logoutButton.classList).toContain('rounded-lg');
      expect(logoutButton.classList).toContain('transition-colors');
      expect(logoutButton.classList).toContain('duration-200');
      expect(logoutButton.classList).toContain('cursor-pointer');
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call logout method when logout button is clicked', () => {
      spyOn(component, 'logout');
      const logoutButton = fixture.nativeElement.querySelector('button');

      logoutButton.click();

      expect(component.logout).toHaveBeenCalled();
    });

    it('should call authService.logout when logout is called', () => {
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should navigate to login page when logout is called', () => {
      component.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['../auth/login']);
    });

    it('should call both authService.logout and router.navigate in correct order', () => {
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['../auth/login']);
      expect(mockAuthService.logout).toHaveBeenCalledBefore(mockRouter.navigate);
    });

    it('should handle logout button click and perform complete logout flow', () => {
      spyOn(component, 'logout').and.callThrough();
      const logoutButton = fixture.nativeElement.querySelector('button');

      logoutButton.click();

      expect(component.logout).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['../auth/login']);
    });
  });

  describe('Service Integration', () => {
    it('should have AuthService injected correctly', () => {
      expect(component['authService']).toBe(mockAuthService);
    });

    it('should have Router injected correctly', () => {
      expect(component['router']).toBe(mockRouter);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have focusable logout button', () => {
      const logoutButton = fixture.nativeElement.querySelector('button');
      expect(logoutButton.tabIndex).not.toBe(-1);
    });

    it('should have button with readable text content', () => {
      const logoutButton = fixture.nativeElement.querySelector('button');
      expect(logoutButton.textContent.trim()).toBeTruthy();
      expect(logoutButton.textContent.trim().length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct header structure with logo section', () => {
      const logoSection = fixture.nativeElement.querySelector('div.flex.items-center.gap-2');
      expect(logoSection).toBeTruthy();

      const icon = logoSection.querySelector('em.pi.pi-check-square');
      const title = logoSection.querySelector('span.text-lg.font-semibold');

      expect(icon).toBeTruthy();
      expect(title).toBeTruthy();
    });

    it('should have correct header structure with actions section', () => {
      const actionsSection = fixture.nativeElement.querySelector('div.flex.items-center.gap-4');
      expect(actionsSection).toBeTruthy();

      const logoutButton = actionsSection.querySelector('button');
      expect(logoutButton).toBeTruthy();
    });

    it('should maintain proper spacing and layout classes', () => {
      const logoSection = fixture.nativeElement.querySelector('div.flex.items-center.gap-2');
      const actionsSection = fixture.nativeElement.querySelector('div.flex.items-center.gap-4');

      expect(logoSection.classList).toContain('gap-2');
      expect(actionsSection.classList).toContain('gap-4');
    });
  });
});
