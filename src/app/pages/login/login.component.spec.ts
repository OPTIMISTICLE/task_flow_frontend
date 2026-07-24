import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { AuthUser } from '../../models/api.models';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  const manager: AuthUser = {
    id: 'manager-id',
    email: 'manager@company.local',
    firstName: 'Maya',
    lastName: 'Manager',
    displayName: 'Maya Manager',
    role: 'MANAGER',
    mustChangePassword: false,
  };
  const auth = { login: vi.fn(), homeUrl: vi.fn() };
  const router = { navigateByUrl: vi.fn() };

  beforeEach(async () => {
    auth.login.mockReset();
    auth.homeUrl.mockReset();
    auth.homeUrl.mockReturnValue('/tasks');
    router.navigateByUrl.mockReset();
    router.navigateByUrl.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    component.form.setValue({ email: manager.email, password: 'TestPassword123!' });
    fixture.detectChanges();
  });

  it('navigates to tasks after a successful login and clears the loading state', () => {
    auth.login.mockReturnValue(of(manager));

    component.submit();

    expect(auth.login).toHaveBeenCalledWith(manager.email, 'TestPassword123!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
    expect(component.loading()).toBe(false);
  });

  it('shows an actionable proxy error and clears the loading state after a failed login', () => {
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: 'Cannot POST /api/auth/login',
          }),
      ),
    );

    component.submit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('backend is running');
    expect(alert.textContent).toContain('development proxy is enabled');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });
});
