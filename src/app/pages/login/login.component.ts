import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly challengeToken = signal('');
  readonly challengeExpiresAt = signal('');
  readonly form = this.fb.nonNullable.group({
    email: [
      'manager@company.local',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
    password: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.pattern(/^\d{6}$|^[A-Fa-f0-9-]{19}$/)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password, code } = this.form.getRawValue();
    const request = this.challengeToken()
      ? this.auth.verifyMfa(this.challengeToken(), code.trim())
      : this.auth.login(email.trim(), password);
    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.state === 'MFA_REQUIRED' && response.challengeToken) {
            this.challengeToken.set(response.challengeToken);
            this.challengeExpiresAt.set(response.challengeExpiresAt ?? '');
            this.form.controls.code.addValidators(Validators.required);
            this.form.controls.code.updateValueAndValidity();
            return;
          }
          this.router.navigateByUrl(this.auth.homeUrl(response.user));
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            apiErrorMessage(
              error,
              'Sign-in failed. Check that the backend is running and the Angular development proxy is enabled.',
            ),
          ),
      });
  }

  restart(): void {
    this.challengeToken.set('');
    this.challengeExpiresAt.set('');
    this.form.controls.code.clearValidators();
    this.form.controls.code.setValidators([Validators.pattern(/^\d{6}$|^[A-Fa-f0-9-]{19}$/)]);
    this.form.controls.code.setValue('');
  }
}
