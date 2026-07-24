import { statusClass, statusLabel } from './status-display';

describe('status display', () => {
  it('maps effective workflow states to readable labels and classes', () => {
    expect(statusLabel('IN_PROGRESS')).toBe('In progress');
    expect(statusLabel('OVERDUE')).toBe('Overdue');
    expect(statusClass('IN_PROGRESS')).toBe('status-in-progress');
  });
});
