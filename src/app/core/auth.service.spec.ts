import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthUser } from '../models/api.models';
import { AuthService } from './auth.service';
import { credentialsInterceptor } from './credentials.interceptor';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const manager: AuthUser = {
    id: 'manager-id',
    email: 'manager@company.local',
    firstName: 'Maya',
    lastName: 'Manager',
    displayName: 'Maya Manager',
    role: 'MANAGER',
    mustChangePassword: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches a CSRF token before login and keeps the JWT outside JavaScript', () => {
    let result: AuthUser | undefined;
    service.login(manager.email, 'secret').subscribe((user) => (result = user));

    const csrf = http.expectOne('/api/auth/csrf');
    expect(csrf.request.method).toBe('GET');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ headerName: 'X-XSRF-TOKEN' });

    const login = http.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.withCredentials).toBe(true);
    expect(login.request.body).toEqual({ email: manager.email, password: 'secret' });
    login.flush(manager);

    expect(result).toEqual(manager);
    expect(service.user()).toEqual(manager);
  });

  it('converts an unauthenticated session lookup into a null user', () => {
    let result: AuthUser | null | undefined;
    service.ensureSession().subscribe((user) => (result = user));

    http
      .expectOne('/api/auth/me')
      .flush({ title: 'Authentication required' }, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('refreshes CSRF and replaces the current user after a password change', () => {
    const changed = { ...manager, mustChangePassword: false };
    let result: AuthUser | undefined;

    service.changePassword('temporary password', 'a new private passphrase').subscribe((user) => {
      result = user;
    });

    http.expectOne('/api/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN' });
    const request = http.expectOne('/api/auth/change-password');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      currentPassword: 'temporary password',
      newPassword: 'a new private passphrase',
    });
    request.flush(changed);

    expect(result).toEqual(changed);
    expect(service.user()).toEqual(changed);
  });

  it('selects a role-aware home page and prioritizes a required password change', () => {
    expect(service.homeUrl({ ...manager, role: 'ADMIN' })).toBe('/admin/users');
    expect(service.homeUrl({ ...manager, mustChangePassword: true })).toBe('/change-password');
    expect(service.homeUrl(manager)).toBe('/tasks');
  });
});
