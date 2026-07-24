import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  Attachment,
  CreateTaskPayload,
  TaskItem,
  TaskProgressStatus,
  TaskStatus,
  WorkerSummary,
} from '../models/api.models';
import { CsrfService } from './csrf.service';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfService);

  list(status?: TaskStatus | ''): Observable<TaskItem[]> {
    const url = status ? `/api/tasks?status=${encodeURIComponent(status)}` : '/api/tasks';
    return this.http.get<TaskItem[]>(url);
  }

  get(id: string): Observable<TaskItem> {
    return this.http.get<TaskItem>(`/api/tasks/${id}`);
  }

  create(payload: CreateTaskPayload): Observable<TaskItem> {
    return this.withFreshCsrf(() => this.http.post<TaskItem>('/api/tasks', payload));
  }

  updateStatus(id: string, status: TaskProgressStatus): Observable<TaskItem> {
    return this.withFreshCsrf(() =>
      this.http.patch<TaskItem>(`/api/tasks/${id}/status`, { status }),
    );
  }

  workers(): Observable<WorkerSummary[]> {
    return this.http.get<WorkerSummary[]>('/api/users?role=WORKER');
  }

  upload(taskId: string, file: File): Observable<Attachment> {
    return this.withFreshCsrf(() => {
      const body = new FormData();
      body.append('file', file);
      return this.http.post<Attachment>(`/api/tasks/${taskId}/attachments`, body);
    });
  }

  download(url: string): Observable<HttpResponse<Blob>> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  private withFreshCsrf<T>(request: () => Observable<T>): Observable<T> {
    return this.csrf.refresh().pipe(switchMap(request));
  }
}
