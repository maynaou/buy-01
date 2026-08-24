import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';
import { TokenService } from '../services/token';
import { environment } from '../../../environments/environment';

const PROTECTED_URL = `${environment.apiUrl}/api/users/me`;
const REFRESH_URL = `${environment.apiUrl}/api/auth/refresh/refresh-1`;
const LOGIN_URL = `${environment.apiUrl}/api/auth/login`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let tokenService: TokenService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    tokenService = TestBed.inject(TokenService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should attach the bearer token', () => {
    tokenService.setTokens('access-1', 'refresh-1');
    http.get(PROTECTED_URL).subscribe();

    const req = httpTesting.expectOne(PROTECTED_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({});
  });

  it('should send no header when there is no token', () => {
    http.get(PROTECTED_URL).subscribe();

    const req = httpTesting.expectOne(PROTECTED_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should never attach a token to auth endpoints', () => {
    tokenService.setTokens('access-1', 'refresh-1');
    http.post(LOGIN_URL, {}).subscribe();

    const req = httpTesting.expectOne(LOGIN_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should refresh on 401 and replay the request with the new token', () => {
    tokenService.setTokens('expired-access', 'refresh-1');

    let body: unknown;
    http.get(PROTECTED_URL).subscribe((response) => (body = response));

    // First attempt is rejected as expired.
    httpTesting.expectOne(PROTECTED_URL).flush('expired', {
      status: 401,
      statusText: 'Unauthorized',
    });

    // Interceptor refreshes...
    httpTesting.expectOne(REFRESH_URL).flush({
      acces_Token: 'access-2',
      refresh_Token: 'refresh-2',
    });

    // ...then replays the original request with the fresh token.
    const retry = httpTesting.expectOne(PROTECTED_URL);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ username: 'jane' });

    expect(body).toEqual({ username: 'jane' });
  });

  it('should refresh only once for several parallel 401s', () => {
    tokenService.setTokens('expired-access', 'refresh-1');

    http.get(PROTECTED_URL).subscribe();
    http.get(PROTECTED_URL).subscribe();

    const failures = httpTesting.match(PROTECTED_URL);
    expect(failures.length).toBe(2);
    failures.forEach((req) => req.flush('expired', { status: 401, statusText: 'Unauthorized' }));

    // One shared refresh, not two — the second would hit a rotated token.
    httpTesting.expectOne(REFRESH_URL).flush({
      acces_Token: 'access-2',
      refresh_Token: 'refresh-2',
    });

    const retries = httpTesting.match(PROTECTED_URL);
    expect(retries.length).toBe(2);
    retries.forEach((req) => {
      expect(req.request.headers.get('Authorization')).toBe('Bearer access-2');
      req.flush({});
    });
  });

  it('should surface the original 401 when the refresh fails', () => {
    tokenService.setTokens('expired-access', 'refresh-1');

    let status: number | undefined;
    http.get(PROTECTED_URL).subscribe({ error: (error) => (status = error.status) });

    httpTesting.expectOne(PROTECTED_URL).flush('expired', {
      status: 401,
      statusText: 'Unauthorized',
    });
    httpTesting.expectOne(REFRESH_URL).flush('gone', {
      status: 401,
      statusText: 'Unauthorized',
    });

    // Callers still get an HttpErrorResponse, and the session is cleared.
    expect(status).toBe(401);
    expect(tokenService.getAccessToken()).toBeNull();
  });

  it('should not retry a 403', () => {
    tokenService.setTokens('access-1', 'refresh-1');

    let status: number | undefined;
    http.get(PROTECTED_URL).subscribe({ error: (error) => (status = error.status) });

    httpTesting.expectOne(PROTECTED_URL).flush('denied', {
      status: 403,
      statusText: 'Forbidden',
    });

    expect(status).toBe(403);
    httpTesting.expectNone(REFRESH_URL);
  });
});
