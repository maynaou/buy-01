import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { TokenService } from '../services/token';
import { TokenRefreshService } from '../services/token-refresh';

function withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const tokenRefreshService = inject(TokenRefreshService);

  // /api/auth/** is public, and the refresh call itself lives there — sending a
  // token or retrying it would only loop.
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = tokenService.getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(withToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 means the access token expired or was rejected. 403 is a role
      // problem, which a new token would not fix.
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return tokenRefreshService.refresh().pipe(
        // Refresh failed: surface the original 401 so callers still see an
        // HttpErrorResponse rather than a synthetic error.
        catchError(() => throwError(() => error)),
        // Replay the original request with the fresh token. A second failure
        // propagates as-is, so this can never loop.
        switchMap((freshToken) => next(withToken(req, freshToken))),
      );
    }),
  );
};
