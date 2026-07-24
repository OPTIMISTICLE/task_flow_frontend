import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import {
  AuthSession,
  AuthUser,
  LoginResponse,
  MfaSetup,
  MfaStatus,
  RecoveryCodes,
} from '../models/api.models';
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

  login(email: string, password: string): Observable<LoginResponse> {
    return this.csrf.refresh().pipe(
      switchMap(() => this.http.post<LoginResponse>('/api/auth/login', { email, password })),
      tap((response) => {
        if (response.user) {
          this.currentUserSignal.set(response.user);
          this.sessionLoaded = true;
        }
      }),
    );
  }

  verifyMfa(challengeToken: string, code: string): Observable<LoginResponse> {
    return this.csrf.refresh().pipe(
      switchMap(() =>
        this.http.post<LoginResponse>('/api/auth/mfa/challenge', { challengeToken, code }),
      ),
      tap((response) => {
        if (response.user) {
          this.currentUserSignal.set(response.user);
          this.sessionLoaded = true;
        }
      }),
    );
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.publicPost('/api/auth/password-recovery/request', { email });
  }

  completePasswordToken(path: 'invitations/accept' | 'password-recovery/complete', token: string,
                        password: string): Observable<{ message: string }> {
    return this.publicPost(`/api/auth/${path}`, { token, password });
  }

  confirmEmail(token: string): Observable<{ message: string }> {
    return this.publicPost('/api/auth/email/confirm', { token });
  }

  sessions(): Observable<AuthSession[]> {
    return this.http.get<AuthSession[]>('/api/auth/sessions');
  }

  revokeSession(id: string): Observable<void> {
    return this.withCsrf(() => this.http.delete<void>(`/api/auth/sessions/${id}`));
  }

  revokeOtherSessions(): Observable<void> {
    return this.withCsrf(() => this.http.post<void>('/api/auth/sessions/revoke-others', {}));
  }

  mfaStatus(): Observable<MfaStatus> {
    return this.http.get<MfaStatus>('/api/auth/mfa');
  }

  startMfa(currentPassword: string): Observable<MfaSetup> {
    return this.withCsrf(() => this.http.post<MfaSetup>('/api/auth/mfa/setup', { currentPassword }));
  }

  confirmMfa(code: string): Observable<RecoveryCodes> {
    return this.withCsrf(() => this.http.post<RecoveryCodes>('/api/auth/mfa/confirm', { code }));
  }

  disableMfa(currentPassword: string, code: string): Observable<void> {
    return this.withCsrf(() =>
      this.http.post<void>('/api/auth/mfa/disable', { currentPassword, code }),
    );
  }

  regenerateRecoveryCodes(currentPassword: string, code: string): Observable<RecoveryCodes> {
    return this.withCsrf(() =>
      this.http.post<RecoveryCodes>('/api/auth/mfa/recovery-codes', { currentPassword, code }),
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

  private publicPost<T>(url: string, body: unknown): Observable<T> {
    return this.csrf.refresh().pipe(switchMap(() => this.http.post<T>(url, body)));
  }

  private withCsrf<T>(request: () => Observable<T>): Observable<T> {
    return this.csrf.refresh().pipe(switchMap(request));
  }
}
