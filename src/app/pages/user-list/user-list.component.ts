import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/error-message';
import { UserAdminApiService } from '../../core/user-admin-api.service';
import { AdminUser, UserAccountStatus, UserRole } from '../../models/api.models';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly api = inject(UserAdminApiService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly query = signal('');
  readonly role = signal<UserRole | ''>('');
  readonly status = signal<UserAccountStatus | ''>('');
  readonly sort = signal<'name' | 'email' | 'createdAt' | 'updatedAt'>('createdAt');
  readonly direction = signal<'asc' | 'desc'>('desc');

  ngOnInit(): void {
    this.load();
  }

  applyFilters(query: string, role: string, status: string, sort: string): void {
    this.query.set(query.trim());
    this.role.set(role as UserRole | '');
    this.status.set(status as UserAccountStatus | '');
    this.sort.set(sort as 'name' | 'email' | 'createdAt' | 'updatedAt');
    this.page.set(0);
    this.load();
  }

  changeDirection(): void {
    this.direction.update((value) => (value === 'asc' ? 'desc' : 'asc'));
    this.load();
  }

  previous(): void {
    if (this.page() === 0) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  next(): void {
    if (this.page() + 1 >= this.totalPages()) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrator' : role === 'MANAGER' ? 'Manager' : 'Worker';
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .list({
        page: this.page(),
        size: 20,
        query: this.query(),
        role: this.role(),
        status: this.status(),
        sort: this.sort(),
        direction: this.direction(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.users.set(response.items);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'The user directory could not be loaded.')),
      });
  }
}
