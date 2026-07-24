import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { UserAdminApiService } from '../../core/user-admin-api.service';
import { AdminUser, AuthUser } from '../../models/api.models';
import { UserEditorComponent } from './user-editor.component';

describe('UserEditorComponent', () => {
  let fixture: ComponentFixture<UserEditorComponent>;
  let component: UserEditorComponent;

  const admin: AuthUser = {
    id: 'admin-id',
    email: 'admin@company.local',
    firstName: 'Ada',
    lastName: 'Administrator',
    displayName: 'Ada Administrator',
    role: 'ADMIN',
    mustChangePassword: false,
  };
  const createdUser: AdminUser = {
    id: 'new-user-id',
    version: 0,
    firstName: 'Will',
    lastName: 'Worker',
    displayName: 'Will Worker',
    email: 'worker@company.local',
    jobTitle: null,
    department: null,
    phoneNumber: null,
    role: 'WORKER',
    active: true,
    mustChangePassword: true,
    createdAt: '2026-07-24T08:00:00Z',
    updatedAt: '2026-07-24T08:00:00Z',
  };
  const api = {
    create: vi.fn(() => of({ user: createdUser, temporaryPassword: 'generated-password' })),
  };
  const auth = { user: signal<AuthUser | null>(admin).asReadonly() };
  const router = { navigateByUrl: vi.fn() };

  beforeEach(async () => {
    api.create.mockClear();
    router.navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserEditorComponent],
      providers: [
        provideRouter([]),
        { provide: UserAdminApiService, useValue: api },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UserEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates an account and displays its one-time temporary password', () => {
    component.form.setValue({
      firstName: 'Will',
      lastName: 'Worker',
      email: 'WORKER@company.local',
      jobTitle: '',
      department: '',
      phoneNumber: '',
      role: 'WORKER',
    });

    component.submit();
    fixture.detectChanges();

    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'WORKER@company.local', role: 'WORKER' }),
    );
    expect(component.temporaryPassword()).toBe('generated-password');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Show once');
  });

  it('navigates to the created account after the password is acknowledged', () => {
    component.createdUserId.set('new-user-id');
    component.temporaryPassword.set('generated-password');

    component.closeTemporaryPassword();

    expect(component.temporaryPassword()).toBe('');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/users/new-user-id');
  });
});
