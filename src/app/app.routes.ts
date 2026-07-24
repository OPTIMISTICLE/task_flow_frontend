import { Routes } from '@angular/router';
import { authGuard, loginGuard, managerGuard } from './core/auth.guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/task-list/task-list.component').then((m) => m.TaskListComponent)
      },
      {
        path: 'tasks/new',
        canActivate: [managerGuard],
        loadComponent: () => import('./pages/task-create/task-create.component').then((m) => m.TaskCreateComponent)
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./pages/task-detail/task-detail.component').then((m) => m.TaskDetailComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
