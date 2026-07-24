import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Attachment, CreateTaskPayload, TaskItem } from '../models/api.models';
import { credentialsInterceptor } from './credentials.interceptor';
import { TaskApiService } from './task-api.service';

describe('TaskApiService', () => {
  let service: TaskApiService;
  let http: HttpTestingController;

  const task: TaskItem = {
    id: 'task-id',
    title: 'Review artifact',
    description: null,
    dueDate: null,
    progressStatus: 'ASSIGNED',
    effectiveStatus: 'ASSIGNED',
    creator: { id: 'manager-id', displayName: 'Maya Manager', email: 'manager@company.local' },
    assignee: { id: 'worker-id', displayName: 'William Worker', email: 'worker1@company.local' },
    createdAt: '2026-07-24T00:00:00Z',
    updatedAt: '2026-07-24T00:00:00Z',
    completedAt: null,
    version: 0,
    attachments: [],
  };

  const attachment: Attachment = {
    id: 'attachment-id',
    originalName: 'result.txt',
    mimeType: 'text/plain',
    sizeBytes: 6,
    uploadedAt: '2026-07-24T00:00:00Z',
    uploadedBy: 'Maya Manager',
    downloadUrl: '/api/tasks/task-id/attachments/attachment-id',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TaskApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('refreshes CSRF separately before creating a task and uploading its attachment', () => {
    const payload: CreateTaskPayload = {
      title: task.title,
      description: null,
      assigneeId: task.assignee.id,
      dueDate: null,
    };
    const file = new File(['result'], 'result.txt', { type: 'text/plain' });
    let uploaded: Attachment | undefined;

    service.create(payload).subscribe((created) => {
      service.upload(created.id, file).subscribe((result) => (uploaded = result));
    });

    const createCsrf = http.expectOne('/api/auth/csrf');
    expect(createCsrf.request.method).toBe('GET');
    expect(createCsrf.request.withCredentials).toBe(true);
    createCsrf.flush({ headerName: 'X-XSRF-TOKEN' });

    const create = http.expectOne('/api/tasks');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush(task);

    const uploadCsrf = http.expectOne('/api/auth/csrf');
    expect(uploadCsrf.request.method).toBe('GET');
    uploadCsrf.flush({ headerName: 'X-XSRF-TOKEN' });

    const upload = http.expectOne('/api/tasks/task-id/attachments');
    expect(upload.request.method).toBe('POST');
    expect(upload.request.headers.has('Content-Type')).toBe(false);
    expect(upload.request.body).toBeInstanceOf(FormData);
    expect((upload.request.body as FormData).get('file')).toBe(file);
    upload.flush(attachment);

    expect(uploaded).toEqual(attachment);
  });

  it('refreshes CSRF before a task status mutation', () => {
    service.updateStatus(task.id, 'IN_PROGRESS').subscribe();

    http.expectOne('/api/auth/csrf').flush({ headerName: 'X-XSRF-TOKEN' });

    const update = http.expectOne('/api/tasks/task-id/status');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ status: 'IN_PROGRESS' });
    update.flush({ ...task, progressStatus: 'IN_PROGRESS', effectiveStatus: 'IN_PROGRESS' });
  });
});
