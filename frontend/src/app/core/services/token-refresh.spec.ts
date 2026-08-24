import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TokenRefreshService } from './token-refresh';
import { AuthService } from './auth';
import { TokenService } from './token';
import { environment } from '../../../environments/environment';

const REFRESH_URL = `${environment.apiUrl}/api/auth/refresh/refresh-1`;

const NEW_TOKENS = { acces_Token: 'access-2', refresh_Token: 'refresh-2' };

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let tokenService: TokenService;
  let authService: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TokenRefreshService);
    tokenService = TestBed.inject(TokenService);
    authService = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should store the rotated token pair', () => {
    tokenService.setTokens('access-1', 'refresh-1');

    let fresh: string | undefined;
    service.refresh().subscribe((token) => (fresh = token));

    const req = httpTesting.expectOne(REFRESH_URL);
    expect(req.request.method).toBe('POST');
    req.flush(NEW_TOKENS);

    expect(fresh).toBe('access-2');
    expect(tokenService.getAccessToken()).toBe('access-2');
    // The old refresh token is dead server-side, so the new one must be kept.
    expect(tokenService.getRefreshToken()).toBe('refresh-2');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should share one request between concurrent callers', () => {
    tokenService.setTokens('access-1', 'refresh-1');

    const received: string[] = [];
    service.refresh().subscribe((token) => received.push(token));
    service.refresh().subscribe((token) => received.push(token));
    service.refresh().subscribe((token) => received.push(token));

    // Only one call: a second would be rejected, since refresh rotates.
    httpTesting.expectOne(REFRESH_URL).flush(NEW_TOKENS);

    expect(received).toEqual(['access-2', 'access-2', 'access-2']);
  });

  it('should refresh again after the previous one finished', () => {
    tokenService.setTokens('access-1', 'refresh-1');

    service.refresh().subscribe();
    httpTesting.expectOne(REFRESH_URL).flush(NEW_TOKENS);

    service.refresh().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/api/auth/refresh/refresh-2`).flush({
      acces_Token: 'access-3',
      refresh_Token: 'refresh-3',
    });

    expect(tokenService.getAccessToken()).toBe('access-3');
  });

  it('should sign out when there is no refresh token', () => {
    tokenService.setTokens('access-1', 'refresh-1');
    localStorage.removeItem('refresh_token');

    let errored = false;
    service.refresh().subscribe({ error: () => (errored = true) });

    expect(errored).toBe(true);
    expect(tokenService.getAccessToken()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    httpTesting.expectNone(REFRESH_URL);
  });

  it('should sign out when the refresh token is rejected', () => {
    tokenService.setTokens('access-1', 'refresh-1');

    let errored = false;
    service.refresh().subscribe({ error: () => (errored = true) });

    httpTesting.expectOne(REFRESH_URL).flush('expired', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(errored).toBe(true);
    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
