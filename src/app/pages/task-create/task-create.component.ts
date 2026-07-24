import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/error-message';
import { TaskApiService } from '../../core/task-api.service';
import { CreateTaskPayload, WorkerSummary } from '../../models/api.models';

@Component({
  selector: 'app-task-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TaskApiService);
  private readonly router = inject(Router);

  readonly workers = signal<WorkerSummary[]>([]);
  readonly loadingWorkers = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly createdTaskId = signal<string | null>(null);
  readonly minDueDate = toLocalInputDate(new Date());

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.maxLength(4000)]],
    assigneeId: ['', [Validators.required]],
    dueDate: ['']
  });

  ngOnInit(): void {
    this.api.workers().pipe(finalize(() => this.loadingWorkers.set(false))).subscribe({
      next: (workers) => this.workers.set(workers),
      error: (error) => this.error.set(apiErrorMessage(error, 'Workers could not be loaded.'))
    });
  }

  chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.item(0) ?? null);
  }

  submit(): void {
    if (this.form.invalid || this.submitting() || this.createdTaskId()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const payload: CreateTaskPayload = {
      title: value.title.trim(),
      description: value.description.trim() || null,
      assigneeId: value.assigneeId,
      dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : null
    };

    this.api.create(payload).subscribe({
      next: (task) => {
        const file = this.selectedFile();
        if (!file) {
          this.router.navigate(['/tasks', task.id]);
          return;
        }
        this.createdTaskId.set(task.id);
        this.api.upload(task.id, file).pipe(finalize(() => this.submitting.set(false))).subscribe({
          next: () => this.router.navigate(['/tasks', task.id]),
          error: (error) => this.error.set(
            `The task was created, but the attachment failed: ${apiErrorMessage(error)}`
          )
        });
      },
      error: (error) => {
        this.submitting.set(false);
        this.error.set(apiErrorMessage(error, 'The task could not be created.'));
      }
    });
  }

  openCreatedTask(): void {
    const id = this.createdTaskId();
    if (id) this.router.navigate(['/tasks', id]);
  }
}

function toLocalInputDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
