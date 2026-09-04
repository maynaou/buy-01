import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { TokenRefreshService } from './token-refresh';
import { AuthService } from './auth';
import { TokenService } from './token';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;

  let authService: jasmine.SpyObj<AuthService>;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'refresh',
      'setAuthenticated',
      'logout',
    ]);

    tokenService = jasmine.createSpyObj<TokenService>('TokenService', [
      'getRefreshToken',
      'setTokens',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TokenRefreshService,
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    });

    service = TestBed.inject(TokenRefreshService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('refresh', () => {
    it('should logout and return an error when no refresh token is stored', () => {
      tokenService.getRefreshToken.and.returnValue(null);

      let receivedError: Error | undefined;

      service.refresh().subscribe({
        error: (error: Error) => {
          receivedError = error;
        },
      });

      expect(tokenService.getRefreshToken).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
      expect(receivedError?.message).toBe('No refresh token stored');
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('should refresh the tokens successfully', () => {
      const refreshToken = 'old-refresh-token';

      const response = {
        acces_Token: 'new-access-token',
        refresh_Token: 'new-refresh-token',
      };

      tokenService.getRefreshToken.and.returnValue(refreshToken);
      authService.refresh.and.returnValue(of(response));

      let receivedToken: string | undefined;

      service.refresh().subscribe({
        next: (token) => {
          receivedToken = token;
        },
      });

      expect(authService.refresh).toHaveBeenCalledWith(refreshToken);

      expect(tokenService.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
      );

      expect(authService.setAuthenticated).toHaveBeenCalled();

      expect(receivedToken).toBe('new-access-token');
    });

    it('should logout when the refresh request fails', () => {
      const refreshToken = 'refresh-token';
      const error = new Error('Refresh failed');

      tokenService.getRefreshToken.and.returnValue(refreshToken);

      authService.refresh.and.returnValue(
        throwError(() => error),
      );

      let receivedError: Error | undefined;

      service.refresh().subscribe({
        error: (err) => {
          receivedError = err;
        },
      });

      expect(receivedError).toBe(error);
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should not save tokens when the refresh request fails', () => {
      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(
        throwError(() => new Error('Refresh failed')),
      );

      service.refresh().subscribe({
        error: () => {},
      });

      expect(tokenService.setTokens).not.toHaveBeenCalled();
      expect(authService.setAuthenticated).not.toHaveBeenCalled();
    });

    it('should clear the in-flight request after a successful refresh', () => {
      const response = {
        acces_Token: 'new-access-token',
        refresh_Token: 'new-refresh-token',
      };

      tokenService.getRefreshToken.and.returnValue('refresh-token');
      authService.refresh.and.returnValue(of(response));

      service.refresh().subscribe();

      authService.refresh.calls.reset();

      service.refresh().subscribe();

      expect(authService.refresh).toHaveBeenCalledTimes(1);
    });

    it('should clear the in-flight request after a failed refresh', () => {
      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValues(
        throwError(() => new Error('First refresh failed')),
        of({
          acces_Token: 'new-access-token',
          refresh_Token: 'new-refresh-token',
        }),
      );

      service.refresh().subscribe({
        error: () => {},
      });

      service.refresh().subscribe();

      expect(authService.refresh).toHaveBeenCalledTimes(2);
    });

    it('should return the same in-flight observable while a refresh is running', () => {
      const refreshSubject = new Subject<{
        acces_Token: string;
        refresh_Token: string;
      }>();

      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(
        refreshSubject.asObservable(),
      );

      const firstRequest = service.refresh();
      const secondRequest = service.refresh();

      expect(firstRequest).toBe(secondRequest);
      expect(authService.refresh).toHaveBeenCalledTimes(1);

      refreshSubject.next({
        acces_Token: 'new-access-token',
        refresh_Token: 'new-refresh-token',
      });

      refreshSubject.complete();
    });

    it('should share the refresh result with multiple subscribers', () => {
      const refreshSubject = new Subject<{
        acces_Token: string;
        refresh_Token: string;
      }>();

      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(
        refreshSubject.asObservable(),
      );

      const firstResult: string[] = [];
      const secondResult: string[] = [];

      service.refresh().subscribe((token) => {
        firstResult.push(token);
      });

      service.refresh().subscribe((token) => {
        secondResult.push(token);
      });

      expect(authService.refresh).toHaveBeenCalledTimes(1);

      refreshSubject.next({
        acces_Token: 'new-access-token',
        refresh_Token: 'new-refresh-token',
      });

      refreshSubject.complete();

      expect(firstResult).toEqual(['new-access-token']);
      expect(secondResult).toEqual(['new-access-token']);
    });

    it('should get the refresh token only when there is no in-flight request', () => {
      const refreshSubject = new Subject<{
        acces_Token: string;
        refresh_Token: string;
      }>();

      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(
        refreshSubject.asObservable(),
      );

      service.refresh();
      service.refresh();

      expect(tokenService.getRefreshToken).toHaveBeenCalledTimes(1);

      refreshSubject.next({
        acces_Token: 'new-access-token',
        refresh_Token: 'new-refresh-token',
      });

      refreshSubject.complete();
    });

    it('should set authenticated after successful refresh', () => {
      const response = {
        acces_Token: 'access-token',
        refresh_Token: 'refresh-token',
      };

      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(of(response));

      service.refresh().subscribe();

      expect(authService.setAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should not set authenticated when refresh fails', () => {
      tokenService.getRefreshToken.and.returnValue('refresh-token');

      authService.refresh.and.returnValue(
        throwError(() => new Error('Refresh failed')),
      );

      service.refresh().subscribe({
        error: () => {},
      });

      expect(authService.setAuthenticated).not.toHaveBeenCalled();
    });
  });
});
