import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(map((user) => (user ? true : router.createUrlTree(['/login']))));
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .ensureSession()
    .pipe(map((user) => (user ? router.parseUrl(auth.homeUrl(user)) : true)));
};

export const taskUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(
    map((user) => {
      if (!user) return router.createUrlTree(['/login']);
      if (user.mustChangePassword) return router.createUrlTree(['/change-password']);
      return user.role === 'ADMIN' ? router.createUrlTree(['/admin/users']) : true;
    }),
  );
};

export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(
    map((user) => {
      if (!user) return router.createUrlTree(['/login']);
      if (user.mustChangePassword) return router.createUrlTree(['/change-password']);
      return user.role === 'MANAGER' ? true : router.parseUrl(auth.homeUrl(user));
    }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(
    map((user) => {
      if (!user) return router.createUrlTree(['/login']);
      if (user.mustChangePassword) return router.createUrlTree(['/change-password']);
      return user.role === 'ADMIN' ? true : router.createUrlTree(['/tasks']);
    }),
  );
};
