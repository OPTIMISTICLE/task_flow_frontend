import { Routes } from '@angular/router';
import { adminGuard, authGuard, loginGuard, managerGuard, taskUserGuard } from './core/auth.guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'accept-invitation',
    data: { mode: 'invitation' },
    loadComponent: () => import('./pages/token-password/token-password.component').then((m) => m.TokenPasswordComponent),
  },
  {
    path: 'reset-password',
    data: { mode: 'reset' },
    loadComponent: () => import('./pages/token-password/token-password.component').then((m) => m.TokenPasswordComponent),
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./pages/confirm-email/confirm-email.component').then((m) => m.ConfirmEmailComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      {
        path: 'settings/security',
        loadComponent: () => import('./pages/security-settings/security-settings.component').then((m) => m.SecuritySettingsComponent),
      },
      {
        path: 'tasks',
        canActivate: [taskUserGuard],
        loadComponent: () =>
          import('./pages/task-list/task-list.component').then((m) => m.TaskListComponent),
      },
      {
        path: 'tasks/new',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./pages/task-create/task-create.component').then((m) => m.TaskCreateComponent),
      },
      {
        path: 'tasks/:id',
        canActivate: [taskUserGuard],
        loadComponent: () =>
          import('./pages/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'admin/users/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/user-editor/user-editor.component').then((m) => m.UserEditorComponent),
      },
      {
        path: 'admin/users/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/user-editor/user-editor.component').then((m) => m.UserEditorComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
