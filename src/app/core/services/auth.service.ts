import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthState, LoginResponse } from '../models/auth.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  public readonly authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }


  private initializeAuthState(): void {
    if (typeof window === 'undefined') return;

    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.authStateSubject.next({
        isAuthenticated: true,
        user,
        token
      });
    }
  }

  login(email: string): Observable<LoginResponse> {
    const loginData = { email: email.trim().toLowerCase() };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data.token, response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearAuthData();
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      token: null
    });
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private setAuthData(token: string, user: User): void {
    if (typeof window === 'undefined') return; // SSR safety

    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      this.authStateSubject.next({
        isAuthenticated: true,
        user,
        token
      });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('No se pudo guardar la información de autenticación');
    }
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return; // SSR safety

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null; // SSR safety

    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null; // SSR safety

    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          this.logout(); // Limpia la sesión si el token es inválido
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
