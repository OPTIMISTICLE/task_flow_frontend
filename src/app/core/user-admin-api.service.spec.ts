import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminUser, AdminUserPayload } from '../models/api.models';
import { credentialsInterceptor } from './credentials.interceptor';
import { UserAdminApiService } from './user-admin-api.service';

describe('UserAdminApiService', () => {
  let service: UserAdminApiService;
  let http: HttpTestingController;

  const user: AdminUser = {
    id: 'user-id',
    version: 0,
    firstName: 'New',
    lastName: 'Worker',
    displayName: 'New Worker',
    email: 'new.worker@company.local',
    jobTitle: 'Analyst',
    department: 'Operations',
    phoneNumber: '+14155552671',
    role: 'WORKER',
    active: true,
    mustChangePassword: true,
    createdAt: '2026-07-24T00:00:00Z',
    updatedAt: '2026-07-24T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserAdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends paged directory filters', () => {
    service.list({ page: 1, size: 20, query: 'worker', role: 'WORKER', active: true }).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/admin/users' && candidate.params.get('page') === '1',
    );
    expect(request.request.params.get('query')).toBe('worker');
    expect(request.request.params.get('role')).toBe('WORKER');
    expect(request.request.params.get('active')).toBe('true');
    request.flush({ items: [user], page: 1, size: 20, totalElements: 21, totalPages: 2 });
  });

  it('refreshes CSRF before creating an account and exposes the one-time result', () => {
    const payload: AdminUserPayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      jobTitle: user.jobTitle,
      department: user.department,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    let password = '';

    service.create(payload).subscribe((result) => (password = result.temporaryPassword));
    http.expectOne('/api/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN' });
    const create = http.expectOne('/api/admin/users');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush({ user, temporaryPassword: 'generated-temporary-password' });

    expect(password).toBe('generated-temporary-password');
  });
});
