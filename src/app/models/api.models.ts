export type UserRole = 'MANAGER' | 'WORKER';
export type TaskProgressStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskStatus = TaskProgressStatus | 'OVERDUE';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
}

export interface PersonSummary {
  id: string;
  displayName: string;
  email: string;
}

export interface WorkerSummary {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  progressStatus: TaskProgressStatus;
  effectiveStatus: TaskStatus;
  creator: PersonSummary;
  assignee: PersonSummary;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  version: number;
  attachments: Attachment[];
}

export interface CreateTaskPayload {
  title: string;
  description: string | null;
  assigneeId: string;
  dueDate: string | null;
}

export interface ApiProblem {
  title?: string;
  status?: number;
  detail?: string;
  fieldErrors?: Record<string, string>;
}
