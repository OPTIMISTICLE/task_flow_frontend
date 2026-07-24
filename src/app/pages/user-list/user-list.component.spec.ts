import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserAdminApiService } from '../../core/user-admin-api.service';
import { AdminUserPage } from '../../models/api.models';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;

  const page: AdminUserPage = {
    items: [
      {
        id: 'user-id',
        version: 0,
        firstName: 'Will',
        lastName: 'Worker',
        displayName: 'Will Worker',
        email: 'worker@company.local',
        jobTitle: 'Analyst',
        department: 'Operations',
        phoneNumber: null,
        role: 'WORKER',
        active: true,
        mustChangePassword: true,
        createdAt: '2026-07-24T08:00:00Z',
        updatedAt: '2026-07-24T08:00:00Z',
      },
    ],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  };
  const api = { list: vi.fn(() => of(page)) };

  beforeEach(async () => {
    api.list.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [provideRouter([]), { provide: UserAdminApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the paged directory and shows credential state', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 20 }));
    expect(element.textContent).toContain('Will Worker');
    expect(element.textContent).toContain('Temporary password');
  });

  it('applies server-side role and status filters', () => {
    component.applyFilters('Will', 'WORKER', 'true', 'name');

    expect(api.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: 'Will',
        role: 'WORKER',
        active: true,
        sort: 'name',
        page: 0,
      }),
    );
  });
});
