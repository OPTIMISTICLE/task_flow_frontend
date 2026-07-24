export type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER';
export type TaskProgressStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskStatus = TaskProgressStatus | 'OVERDUE';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  mustChangePassword: boolean;
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
  code?: string;
}

export interface AdminUser {
  id: string;
  version: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPage {
  items: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  role: UserRole;
}

export interface UpdateAdminUserPayload extends AdminUserPayload {
  version: number;
}

export interface TemporaryPasswordResult {
  user: AdminUser;
  temporaryPassword: string;
}

export interface UserAuditEvent {
  id: string;
  actorEmail: string | null;
  action: string;
  outcome: string;
  details: string | null;
  occurredAt: string;
}

export interface UserAuditPage {
  items: UserAuditEvent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
