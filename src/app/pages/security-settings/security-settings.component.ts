import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { AuthSession, MfaSetup, MfaStatus } from '../../models/api.models';

@Component({
  selector: 'app-security-settings',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.scss',
})
export class SecuritySettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly sessions = signal<AuthSession[]>([]);
  readonly status = signal<MfaStatus>({ enabled: false, recoveryCodesRemaining: 0 });
  readonly setup = signal<MfaSetup | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly error = signal('');
  readonly success = signal('');
  readonly busy = signal(false);
  readonly setupForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.pattern(/^\d{6}$/)]],
  });
  readonly sensitiveForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.maxLength(64)]],
  });

  ngOnInit(): void { this.reload(); }

  startMfa(): void {
    if (this.setupForm.controls.currentPassword.invalid) return;
    this.run(() => this.auth.startMfa(this.setupForm.controls.currentPassword.value), (setup) => {
      this.setup.set(setup);
      this.setupForm.controls.code.addValidators(Validators.required);
      this.setupForm.controls.code.updateValueAndValidity();
      this.success.set('Add this key to your authenticator, then enter its six-digit code.');
    });
  }

  confirmMfa(): void {
    if (!this.setup() || this.setupForm.controls.code.invalid) return;
    this.run(() => this.auth.confirmMfa(this.setupForm.controls.code.value), (response) => {
      this.recoveryCodes.set(response.recoveryCodes);
      this.setup.set(null);
      this.status.set({ enabled: true, recoveryCodesRemaining: response.recoveryCodes.length });
      this.success.set('MFA is enabled. Save these recovery codes now; they are shown once.');
    });
  }

  disableMfa(): void {
    if (this.sensitiveForm.invalid || !globalThis.confirm('Disable MFA for your account?')) return;
    const value = this.sensitiveForm.getRawValue();
    this.run(() => this.auth.disableMfa(value.currentPassword, value.code), () => {
      this.status.set({ enabled: false, recoveryCodesRemaining: 0 });
      this.recoveryCodes.set([]);
      this.success.set('MFA was disabled.');
    });
  }

  regenerate(): void {
    if (this.sensitiveForm.invalid) return;
    const value = this.sensitiveForm.getRawValue();
    this.run(() => this.auth.regenerateRecoveryCodes(value.currentPassword, value.code), (response) => {
      this.recoveryCodes.set(response.recoveryCodes);
      this.status.update((status) => ({ ...status, recoveryCodesRemaining: response.recoveryCodes.length }));
      this.success.set('New recovery codes generated. Previous codes no longer work.');
    });
  }

  revoke(session: AuthSession): void {
    if (!globalThis.confirm(`Revoke the session for ${session.userAgent}?`)) return;
    this.run(() => this.auth.revokeSession(session.id), () => this.reload());
  }

  revokeOthers(): void {
    this.run(() => this.auth.revokeOtherSessions(), () => {
      this.success.set('Other sessions were revoked.'); this.reload();
    });
  }

  private reload(): void {
    forkJoin({ sessions: this.auth.sessions(), status: this.auth.mfaStatus() }).subscribe({
      next: (response) => { this.sessions.set(response.sessions); this.status.set(response.status); },
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'Security settings could not be loaded.')),
    });
  }

  private run<T>(request: () => import('rxjs').Observable<T>, success: (value: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.success.set('');
    request().subscribe({
      next: (value) => { this.busy.set(false); success(value); },
      error: (error: HttpErrorResponse) => {
        this.busy.set(false); this.error.set(apiErrorMessage(error, 'The security change failed.'));
      },
    });
  }
}
