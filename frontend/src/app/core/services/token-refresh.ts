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

  private inFlight: Observable<string> | null = null;
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
