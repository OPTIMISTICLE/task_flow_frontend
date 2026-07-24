import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/error-message';
import { TaskApiService } from '../../core/task-api.service';
import { TaskItem, TaskProgressStatus, TaskStatus } from '../../models/api.models';
import { statusClass, statusLabel } from '../../shared/status-display';

@Component({
  selector: 'app-task-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(TaskApiService);

  readonly tasks = signal<TaskItem[]>([]);
  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);
  readonly error = signal('');
  readonly filter = signal<TaskStatus | ''>('');
  readonly filteredTasks = computed(() => {
    const value = this.filter();
    return value ? this.tasks().filter((task) => task.effectiveStatus === value) : this.tasks();
  });
  readonly activeCount = computed(() => this.tasks().filter((task) => task.effectiveStatus === 'IN_PROGRESS').length);
  readonly overdueCount = computed(() => this.tasks().filter((task) => task.effectiveStatus === 'OVERDUE').length);
  readonly completedCount = computed(() => this.tasks().filter((task) => task.effectiveStatus === 'COMPLETED').length);

  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: (error) => this.error.set(apiErrorMessage(error, 'Tasks could not be loaded.'))
    });
  }

  setFilter(value: string): void {
    this.filter.set(value as TaskStatus | '');
  }

  updateStatus(task: TaskItem, status: TaskProgressStatus): void {
    if (this.updatingId()) return;
    this.updatingId.set(task.id);
    this.error.set('');
    this.api.updateStatus(task.id, status).pipe(finalize(() => this.updatingId.set(null))).subscribe({
      next: (updated) => this.tasks.update((items) => items.map((item) => item.id === updated.id ? updated : item)),
      error: (error) => this.error.set(apiErrorMessage(error, 'The task status could not be updated.'))
    });
  }
}
