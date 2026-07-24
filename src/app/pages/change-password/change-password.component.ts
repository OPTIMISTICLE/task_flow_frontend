import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    newPassword: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(200)]],
    confirmPassword: ['', [Validators.required, Validators.maxLength(200)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('The new password and confirmation do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth
      .changePassword(currentPassword, newPassword)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => this.router.navigateByUrl(this.auth.homeUrl(user)),
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'The password could not be changed.')),
      });
  }
}
