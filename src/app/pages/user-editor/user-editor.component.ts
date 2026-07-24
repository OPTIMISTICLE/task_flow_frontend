import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { UserAdminApiService } from '../../core/user-admin-api.service';
import { AdminUser, AdminUserPayload, UserAuditEvent, UserRole } from '../../models/api.models';

@Component({
  selector: 'app-user-editor',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './user-editor.component.html',
  styleUrl: './user-editor.component.scss',
})
export class UserEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserAdminApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isNew = this.id === null;
  readonly user = signal<AdminUser | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly auditEvents = signal<UserAuditEvent[]>([]);
  readonly auditPage = signal(0);
  readonly auditTotalPages = signal(0);
  readonly isSelf = computed(() => this.user()?.id === this.auth.user()?.id);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    jobTitle: ['', [Validators.maxLength(120)]],
    department: ['', [Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.pattern(/^\+[1-9]\d{7,14}$/)]],
    role: ['WORKER' as UserRole, [Validators.required]],
  });

  ngOnInit(): void {
    if (!this.isNew && this.id) this.load(this.id);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const payload = this.payload();
    const request: Observable<AdminUser> = this.isNew
      ? this.api.create(payload)
      : this.api.update(this.id!, { ...payload, version: this.user()!.version });
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.user.set(response);
        this.form.patchValue(this.formValue(response));
        this.success.set(
          this.isNew ? 'Account created and invitation email queued.' : 'Account details saved.',
        );
        if (this.isNew) this.router.navigateByUrl(`/admin/users/${response.id}`);
        else this.loadAudit(response.id);
      },
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'The account could not be saved.')),
    });
  }

  changeActive(): void {
    const user = this.user();
    if (!user || this.saving()) return;
    const verb = user.active ? 'deactivate' : 'reactivate';
    if (!globalThis.confirm(`Are you sure you want to ${verb} ${user.displayName}?`)) return;
    this.runAccountAction(
      user.active ? this.api.deactivate(user) : this.api.activate(user),
      user.active ? 'Account deactivated.' : 'Account reactivated.',
    );
  }

  resetPassword(): void {
    const user = this.user();
    if (!user || this.saving()) return;
    if (!globalThis.confirm(`Send a password recovery email to ${user.displayName}?`)) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .resetPassword(user)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.user.set(response);
          this.success.set('Password recovery email queued.');
          this.loadAudit(response.id);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'The password could not be reset.')),
      });
  }

  resendInvitation(): void {
    const user = this.user();
    if (!user) return;
    this.runAccountAction(this.api.resendInvitation(user), 'Invitation email queued.');
  }

  resetMfa(): void {
    const user = this.user();
    if (!user || !globalThis.confirm(`Reset MFA and all sessions for ${user.displayName}?`)) return;
    this.runAccountAction(this.api.resetMfa(user), 'MFA reset and sessions revoked.');
  }

  previousAudit(): void {
    if (!this.id || this.auditPage() === 0) return;
    this.auditPage.update((value) => value - 1);
    this.loadAudit(this.id);
  }

  nextAudit(): void {
    if (!this.id || this.auditPage() + 1 >= this.auditTotalPages()) return;
    this.auditPage.update((value) => value + 1);
    this.loadAudit(this.id);
  }

  auditLabel(action: string): string {
    return action.toLowerCase().replaceAll('_', ' ');
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.form.reset(this.formValue(user));
          this.loadAudit(id);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'The account could not be loaded.')),
      });
  }

  private loadAudit(id: string): void {
    this.api.audit(id, this.auditPage()).subscribe({
      next: (response) => {
        this.auditEvents.set(response.items);
        this.auditTotalPages.set(response.totalPages);
      },
      error: () => this.auditEvents.set([]),
    });
  }

  private runAccountAction(
    request: ReturnType<UserAdminApiService['activate']>,
    message: string,
  ): void {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (user) => {
        this.user.set(user);
        this.success.set(message);
        this.loadAudit(user.id);
      },
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'The account status could not be changed.')),
    });
  }

  private payload(): AdminUserPayload {
    const value = this.form.getRawValue();
    return {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      jobTitle: value.jobTitle.trim() || null,
      department: value.department.trim() || null,
      phoneNumber: value.phoneNumber.trim() || null,
      role: value.role,
    };
  }

  private formValue(user: AdminUser) {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.pendingEmail ?? user.email,
      jobTitle: user.jobTitle ?? '',
      department: user.department ?? '',
      phoneNumber: user.phoneNumber ?? '',
      role: user.role,
    };
  }
}
