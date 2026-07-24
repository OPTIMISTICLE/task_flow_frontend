import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { TaskApiService } from '../../core/task-api.service';
import { TaskItem, TaskProgressStatus } from '../../models/api.models';
import { statusClass, statusLabel } from '../../shared/status-display';

@Component({
  selector: 'app-task-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TaskApiService);

  readonly task = signal<TaskItem | null>(null);
  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.get(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (task) => this.task.set(task),
      error: (error) => this.error.set(apiErrorMessage(error, 'The task could not be loaded.'))
    });
  }

  updateStatus(status: TaskProgressStatus): void {
    const task = this.task();
    if (!task || this.working()) return;
    this.working.set(true);
    this.error.set('');
    this.api.updateStatus(task.id, status).pipe(finalize(() => this.working.set(false))).subscribe({
      next: (updated) => this.task.set(updated),
      error: (error) => this.error.set(apiErrorMessage(error, 'The task status could not be updated.'))
    });
  }

  chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.item(0) ?? null);
  }

  upload(): void {
    const task = this.task();
    const file = this.selectedFile();
    if (!task || !file || this.working()) return;
    this.working.set(true);
    this.error.set('');
    this.api.upload(task.id, file).pipe(finalize(() => this.working.set(false))).subscribe({
      next: () => {
        this.selectedFile.set(null);
        this.load();
      },
      error: (error) => this.error.set(apiErrorMessage(error, 'The attachment could not be uploaded.'))
    });
  }

  download(url: string, filename: string): void {
    this.api.download(url).subscribe({
      next: (response) => {
        if (!response.body) return;
        const objectUrl = URL.createObjectURL(response.body);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (error) => this.error.set(apiErrorMessage(error, 'The attachment could not be downloaded.'))
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}
