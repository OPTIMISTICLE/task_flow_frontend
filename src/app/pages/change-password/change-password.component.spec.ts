import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { AuthUser } from '../../models/api.models';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;

  const admin: AuthUser = {
    id: 'admin-id',
    email: 'admin@company.local',
    firstName: 'Ada',
    lastName: 'Administrator',
    displayName: 'Ada Administrator',
    role: 'ADMIN',
    status: 'ACTIVE',
    mustChangePassword: false,
    mfaEnabled: false,
    sessionId: 'admin-session',
  };
  const auth = {
    mustChangePassword: signal(true),
    changePassword: vi.fn(),
    homeUrl: vi.fn().mockReturnValue('/admin/users'),
  };
  const router = { navigateByUrl: vi.fn() };

  beforeEach(async () => {
    auth.changePassword.mockReset();
    router.navigateByUrl.mockReset();
    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
  });

  it('changes a matching password and routes to the role-aware home page', () => {
    auth.changePassword.mockReturnValue(of(admin));
    component.form.setValue({
      currentPassword: 'temporary password',
      newPassword: 'a new private passphrase',
      confirmPassword: 'a new private passphrase',
    });

    component.submit();

    expect(auth.changePassword).toHaveBeenCalledWith(
      'temporary password',
      'a new private passphrase',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/users');
  });

  it('rejects a mismatched confirmation without calling the API', () => {
    component.form.setValue({
      currentPassword: 'temporary password',
      newPassword: 'a new private passphrase',
      confirmPassword: 'a different private passphrase',
    });

    component.submit();

    expect(component.error()).toContain('do not match');
    expect(auth.changePassword).not.toHaveBeenCalled();
  });
});
