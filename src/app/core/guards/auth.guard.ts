import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter(loading => !loading),
    take(1),
    timeout(5000),
    catchError(() => of(false)),
    map(() => {
      if (authService.isAuthenticated()) return true;
      return router.createUrlTree(['/login']);
    })
  );
};

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter(loading => !loading),
    take(1),
    timeout(5000),
    catchError(() => of(false)),
    map(() => {
      if (!authService.isAuthenticated()) return true;
      return router.createUrlTree(['/notes']);
    })
  );
};
