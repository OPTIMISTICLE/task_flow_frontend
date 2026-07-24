import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { TaskApiService } from '../../core/task-api.service';
import { AuthUser, TaskItem } from '../../models/api.models';
import { TaskListComponent } from './task-list.component';

describe('TaskListComponent', () => {
  let fixture: ComponentFixture<TaskListComponent>;
  const worker: AuthUser = {
    id: 'worker-id', email: 'worker@company.local', firstName: 'Will', lastName: 'Worker',
    displayName: 'Will Worker', role: 'WORKER', mustChangePassword: false
  };
  const task: TaskItem = {
    id: 'task-id', title: 'Prepare report', description: 'Summarize delivery risks.', dueDate: null,
    progressStatus: 'ASSIGNED', effectiveStatus: 'ASSIGNED',
    creator: { id: 'manager-id', displayName: 'Maya Manager', email: 'manager@company.local' },
    assignee: { id: worker.id, displayName: worker.displayName, email: worker.email },
    createdAt: '2026-07-22T10:00:00Z', updatedAt: '2026-07-22T10:00:00Z', completedAt: null,
    version: 0, attachments: []
  };
  const updated = { ...task, progressStatus: 'IN_PROGRESS' as const, effectiveStatus: 'IN_PROGRESS' as const };
  const api = {
    list: vi.fn(() => of([task])),
    updateStatus: vi.fn(() => of(updated))
  };
  const auth = {
    user: signal<AuthUser | null>(worker).asReadonly(),
    isManager: signal(false).asReadonly()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: TaskApiService, useValue: api }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
  });

  it('shows assigned work and lets the worker start it', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Prepare report');
    expect(element.textContent).toContain('Start');

    const startButton = Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Start') as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    expect(api.updateStatus).toHaveBeenCalledWith('task-id', 'IN_PROGRESS');
    expect(element.textContent).toContain('In progress');
  });
});
