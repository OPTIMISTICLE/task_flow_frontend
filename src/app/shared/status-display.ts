import { TaskStatus } from '../models/api.models';

export function statusLabel(status: TaskStatus): string {
  return {
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    OVERDUE: 'Overdue'
  }[status];
}

export function statusClass(status: TaskStatus): string {
  return `status-${status.toLowerCase().replace('_', '-')}`;
}
