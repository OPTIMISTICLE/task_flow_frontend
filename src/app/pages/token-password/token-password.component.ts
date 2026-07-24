import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-token-password',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './token-password.component.html',
  styleUrl: './token-password.component.scss',
})
export class TokenPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly mode = this.route.snapshot.data['mode'] as 'invitation' | 'reset';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly loading = signal(false);
  readonly error = signal(this.token ? '' : 'This link is missing its security token.');
  readonly success = signal('');
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(200)]],
    confirmation: ['', [Validators.required, Validators.maxLength(200)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading() || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, confirmation } = this.form.getRawValue();
    if (password !== confirmation) {
      this.error.set('The password confirmation does not match.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const path = this.mode === 'invitation' ? 'invitations/accept' : 'password-recovery/complete';
    this.auth
      .completePasswordToken(path, this.token, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.success.set(response.message),
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'The secure link could not be completed.')),
      });
  }
}
