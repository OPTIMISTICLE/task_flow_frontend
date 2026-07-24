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
    pendingEmail: null,
    emailVerifiedAt: null,
    jobTitle: 'Analyst',
    department: 'Operations',
    phoneNumber: '+14155552671',
    role: 'WORKER',
    status: 'PENDING',
    active: false,
    mustChangePassword: false,
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
    service.list({ page: 1, size: 20, query: 'worker', role: 'WORKER', status: 'PENDING' }).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/admin/users' && candidate.params.get('page') === '1',
    );
    expect(request.request.params.get('query')).toBe('worker');
    expect(request.request.params.get('role')).toBe('WORKER');
    expect(request.request.params.get('status')).toBe('PENDING');
    request.flush({ items: [user], page: 1, size: 20, totalElements: 21, totalPages: 2 });
  });

  it('refreshes CSRF before creating an invited account', () => {
    const payload: AdminUserPayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      jobTitle: user.jobTitle,
      department: user.department,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    let result: AdminUser | undefined;

    service.create(payload).subscribe((created) => (result = created));
    http.expectOne('/api/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN' });
    const create = http.expectOne('/api/admin/users');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush(user);

    expect(result).toEqual(user);
  });
});
