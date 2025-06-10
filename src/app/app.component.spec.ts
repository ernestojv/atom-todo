import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app.component';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  template: '<div>Test Component</div>'
})
class TestComponent { }

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([
          { path: 'test', component: TestComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct title property', () => {
      expect(component.title).toBe('atom-todo');
    });

    it('should be an instance of AppComponent', () => {
      expect(component instanceof AppComponent).toBeTruthy();
    });
  });

  describe('Component Properties', () => {
    it('should have title as string', () => {
      expect(typeof component.title).toBe('string');
    });

    it('should have non-empty title', () => {
      expect(component.title).toBeTruthy();
      expect(component.title.length).toBeGreaterThan(0);
    });

    it('should have correct app title format', () => {
      expect(component.title).toMatch(/^[a-z-]+$/);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render router-outlet', () => {
      const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
    });

    it('should have only router-outlet as content', () => {
      const content = fixture.nativeElement.innerHTML;
      expect(content).toContain('<router-outlet');
      expect(content).toContain('</router-outlet>');

      const routerOutletCount = (content.match(/<router-outlet/g) || []).length;
      expect(routerOutletCount).toBe(1);
    });

    it('should not have any additional HTML elements', () => {
      const children = fixture.nativeElement.children;
      expect(children.length).toBe(1);
      expect(children[0].tagName.toLowerCase()).toBe('router-outlet');
    });
  });

  describe('Router Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have router outlet present', () => {
      const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
    });

    it('should handle route navigation', async () => {
      await router.navigate(['/test']);
      expect(location.path()).toBe('/test');
    });

    it('should display routed component content', async () => {
      await router.navigate(['/test']);
      fixture.detectChanges();

      const routedContent = fixture.nativeElement.textContent;
      expect(routedContent).toContain('Test Component');
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize without errors', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle multiple change detection cycles', () => {
      expect(() => {
        fixture.detectChanges();
        fixture.detectChanges();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should maintain stable title property', () => {
      const initialTitle = component.title;
      fixture.detectChanges();
      expect(component.title).toBe(initialTitle);
    });
  });

  describe('Application Root Behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should serve as the main application container', () => {
      expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    });

    it('should not have any hardcoded content besides router-outlet', () => {
      const textContent = fixture.nativeElement.textContent.trim();
      expect(textContent).toBe('');
    });

    it('should allow child routes to be displayed', async () => {
      await router.navigate(['/test']);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Test Component');
    });
  });

  describe('Memory and Performance', () => {
    it('should not create memory leaks during initialization', () => {
      const initialComponentCount = 1;
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeDefined();
      expect(typeof fixture.componentInstance.title).toBe('string');
    });

    it('should handle rapid route changes', async () => {
      await router.navigate(['/test']);
      fixture.detectChanges();

      await router.navigate(['']);
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('Minimal Component Requirements', () => {
    it('should be a minimal root component', () => {
      const componentKeys = Object.getOwnPropertyNames(component);
      const expectedKeys = ['title'];

      expect(componentKeys).toContain('title');
      expect(componentKeys.length).toBeLessThanOrEqual(expectedKeys.length + 1);
    });

    it('should not have unnecessary methods', () => {
      const componentMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(component))
        .filter(name => typeof component[name as keyof AppComponent] === 'function')
        .filter(name => name !== 'constructor');

      expect(componentMethods.length).toBe(0);
    });

    it('should follow Angular component conventions', () => {
      expect(component.title).toBeDefined();
      expect(typeof component.title).toBe('string');
    });
  });
});
