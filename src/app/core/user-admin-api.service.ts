import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  AdminUser,
  AdminUserPage,
  AdminUserPayload,
  TemporaryPasswordResult,
  UpdateAdminUserPayload,
  UserAuditPage,
  UserRole,
} from '../models/api.models';
import { CsrfService } from './csrf.service';

export interface UserDirectoryQuery {
  page: number;
  size: number;
  query?: string;
  role?: UserRole | '';
  active?: boolean;
  sort?: 'name' | 'email' | 'createdAt' | 'updatedAt';
  direction?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class UserAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfService);

  list(query: UserDirectoryQuery): Observable<AdminUserPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', query.sort ?? 'createdAt')
      .set('direction', query.direction ?? 'desc');
    if (query.query) params = params.set('query', query.query);
    if (query.role) params = params.set('role', query.role);
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http.get<AdminUserPage>('/api/admin/users', { params });
  }

  get(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`/api/admin/users/${id}`);
  }

  create(payload: AdminUserPayload): Observable<TemporaryPasswordResult> {
    return this.withFreshCsrf(() =>
      this.http.post<TemporaryPasswordResult>('/api/admin/users', payload),
    );
  }

  update(id: string, payload: UpdateAdminUserPayload): Observable<AdminUser> {
    return this.withFreshCsrf(() => this.http.patch<AdminUser>(`/api/admin/users/${id}`, payload));
  }

  activate(user: AdminUser): Observable<AdminUser> {
    return this.action(user, 'activate');
  }

  deactivate(user: AdminUser): Observable<AdminUser> {
    return this.action(user, 'deactivate');
  }

  resetPassword(user: AdminUser): Observable<TemporaryPasswordResult> {
    return this.withFreshCsrf(() =>
      this.http.post<TemporaryPasswordResult>(`/api/admin/users/${user.id}/reset-password`, {
        version: user.version,
      }),
    );
  }

  audit(id: string, page = 0, size = 20): Observable<UserAuditPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<UserAuditPage>(`/api/admin/users/${id}/audit`, { params });
  }

  private action(user: AdminUser, action: 'activate' | 'deactivate'): Observable<AdminUser> {
    return this.withFreshCsrf(() =>
      this.http.post<AdminUser>(`/api/admin/users/${user.id}/${action}`, {
        version: user.version,
      }),
    );
  }

  private withFreshCsrf<T>(request: () => Observable<T>): Observable<T> {
    return this.csrf.refresh().pipe(switchMap(request));
  }
}
