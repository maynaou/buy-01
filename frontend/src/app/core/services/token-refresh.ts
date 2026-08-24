import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap, throwError } from 'rxjs';

import { AuthService } from './auth';
import { TokenService } from './token';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);

  /** The refresh currently in progress, shared by every waiting request. */
  private inFlight: Observable<string> | null = null;

  /**
   * Refreshes the access token and returns the new one.
   *
   * Concurrent callers share a single request on purpose: the backend rotates
   * the refresh token and deletes the old one, so a second parallel call would
   * be rejected as invalid.
   *
   * On failure the session is cleared and the error is rethrown.
   */
  refresh(): Observable<string> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.authService.logout();
      return throwError(() => new Error('No refresh token stored'));
    }

    const request = this.authService.refresh(refreshToken).pipe(
      map((response) => {
        this.tokenService.setTokens(response.acces_Token, response.refresh_Token);
        this.authService.setAuthenticated();
        return response.acces_Token;
      }),
      tap({
        next: () => {
          this.inFlight = null;
        },
        error: () => {
          this.inFlight = null;
          this.authService.logout();
        },
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight = request;
    return request;
  }
}
