import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthUser } from '../models/api.models';
import { CsrfService } from './csrf.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfService);
  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private sessionLoaded = false;
  private sessionRequest?: Observable<AuthUser | null>;

  readonly user = this.currentUserSignal.asReadonly();
  readonly isManager = computed(() => this.currentUserSignal()?.role === 'MANAGER');
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  readonly mustChangePassword = computed(
    () => this.currentUserSignal()?.mustChangePassword === true,
  );

  ensureSession(): Observable<AuthUser | null> {
    if (this.sessionLoaded) {
      return of(this.currentUserSignal());
    }
    if (!this.sessionRequest) {
      this.sessionRequest = this.http.get<AuthUser>('/api/auth/me').pipe(
        tap((user) => {
          this.currentUserSignal.set(user);
          this.sessionLoaded = true;
        }),
        catchError(() => {
          this.currentUserSignal.set(null);
          this.sessionLoaded = true;
          return of(null);
        }),
        finalize(() => (this.sessionRequest = undefined)),
        shareReplay(1),
      );
    }
    return this.sessionRequest;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.csrf.refresh().pipe(
      switchMap(() => this.http.post<AuthUser>('/api/auth/login', { email, password })),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.sessionLoaded = true;
      }),
    );
  }

  logout(): Observable<void> {
    return this.csrf.refresh().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
      finalize(() => {
        this.currentUserSignal.set(null);
        this.sessionLoaded = true;
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthUser> {
    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post<AuthUser>('/api/auth/change-password', { currentPassword, newPassword }),
      ),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.sessionLoaded = true;
      }),
    );
  }

  homeUrl(user: AuthUser | null = this.currentUserSignal()): string {
    if (!user) return '/login';
    if (user.mustChangePassword) return '/change-password';
    return user.role === 'ADMIN' ? '/admin/users' : '/tasks';
  }
}
