import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth';
import { TokenService } from './token';
import { environment } from '../../../environments/environment';

import { AuthResponse } from '../../features/auth/models/auth-response';
import { LoginRequest } from '../../features/auth/models/login-request';
import { RegisterRequest } from '../../features/auth/models/register-request';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let tokenService: jasmine.SpyObj<TokenService>;

  const authUrl = `${environment.apiUrl}/api/auth`;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'isAuthenticated',
      'clearTokens',
    ]);

    tokenServiceSpy.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TokenService,
          useValue: tokenServiceSpy,
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);

    tokenService = TestBed.inject(
      TokenService,
    ) as jasmine.SpyObj<TokenService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // --------------------------------------------------
  // Creation
  // --------------------------------------------------

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --------------------------------------------------
  // isAuthenticated
  // --------------------------------------------------

  describe('isAuthenticated', () => {
    it('should initialize with the authentication state from TokenService', () => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(tokenService.isAuthenticated).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // register()
  // --------------------------------------------------

  describe('register', () => {
    it('should send a POST request to the register endpoint', () => {
      const request: RegisterRequest = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        role: 'CLIENT',
      };

      service.register(request).subscribe();

      const req = httpTestingController.expectOne(
        `${authUrl}/register`,
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.responseType).toBe('text');

      req.flush('Registration successful');
    });

    it('should return the registration response', () => {
      const request: RegisterRequest = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        role: 'CLIENT',
      };

      const response = 'Registration successful';

      service.register(request).subscribe((result) => {
        expect(result).toBe(response);
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/register`,
      );

      req.flush(response);
    });

    it('should handle registration errors', () => {
      const request: RegisterRequest = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        role: 'CLIENT',
      };

      service.register(request).subscribe({
        next: () => fail('Expected registration to fail'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/register`,
      );

      req.flush(
        { message: 'Invalid registration data' },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );
    });

    it('should allow SELLER as a valid role', () => {
      const request: RegisterRequest = {
        username: 'seller',
        email: 'seller@example.com',
        password: 'password123',
        role: 'SELLER',
      };

      service.register(request).subscribe();

      const req = httpTestingController.expectOne(
        `${authUrl}/register`,
      );

      expect(req.request.body).toEqual(request);

      req.flush('Registration successful');
    });
  });

  // --------------------------------------------------
  // login()
  // --------------------------------------------------

  describe('login', () => {
    it('should send a POST request to the login endpoint', () => {
      const request: LoginRequest = {
        identifier: 'test',
        password: 'password123',
      };

      service.login(request).subscribe();

      const req = httpTestingController.expectOne(
        `${authUrl}/login`,
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);

      req.flush({
        acces_Token: 'access123',
        refresh_Token: 'refresh123',
      });
    });

    it('should return the authentication response', () => {
      const request: LoginRequest = {
        identifier: 'test',
        password: 'password123',
      };

      const response: AuthResponse = {
        acces_Token: 'access123',
        refresh_Token: 'refresh123',
      };

      service.login(request).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/login`,
      );

      req.flush(response);
    });

    it('should handle login errors', () => {
      const request: LoginRequest = {
        identifier: 'test',
        password: 'wrong-password',
      };

      service.login(request).subscribe({
        next: () => fail('Expected login to fail'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/login`,
      );

      req.flush(
        { message: 'Invalid credentials' },
        {
          status: 401,
          statusText: 'Unauthorized',
        },
      );
    });
  });

  // --------------------------------------------------
  // logout()
  // --------------------------------------------------

  describe('logout', () => {
    it('should clear the tokens', () => {
      service.logout();

      expect(tokenService.clearTokens).toHaveBeenCalled();
    });

    it('should set isAuthenticated to false', () => {
      service.setAuthenticated();

      expect(service.isAuthenticated()).toBeTrue();

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should clear tokens and set authentication to false', () => {
      service.logout();

      expect(tokenService.clearTokens).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  // --------------------------------------------------
  // setAuthenticated()
  // --------------------------------------------------

  describe('setAuthenticated', () => {
    it('should set isAuthenticated to true', () => {
      expect(service.isAuthenticated()).toBeFalse();

      service.setAuthenticated();

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should keep isAuthenticated true when called multiple times', () => {
      service.setAuthenticated();
      service.setAuthenticated();

      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // --------------------------------------------------
  // refresh()
  // --------------------------------------------------

  describe('refresh', () => {
    it('should send a POST request to the refresh endpoint', () => {
      const refreshToken = 'refresh123';

      service.refresh(refreshToken).subscribe();

      const req = httpTestingController.expectOne(
        `${authUrl}/refresh/${encodeURIComponent(refreshToken)}`,
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();

      req.flush({
        acces_Token: 'new-access',
        refresh_Token: 'new-refresh',
      });
    });

    it('should encode the refresh token in the URL', () => {
      const refreshToken = 'refresh/token?test=true';

      service.refresh(refreshToken).subscribe();

      const expectedUrl =
        `${authUrl}/refresh/${encodeURIComponent(refreshToken)}`;

      const req = httpTestingController.expectOne(expectedUrl);

      expect(req.request.method).toBe('POST');

      req.flush({
        acces_Token: 'new-access',
        refresh_Token: 'new-refresh',
      });
    });

    it('should return the refreshed authentication response', () => {
      const refreshToken = 'refresh123';

      const response: AuthResponse = {
        acces_Token: 'new-access',
        refresh_Token: 'new-refresh',
      };

      service.refresh(refreshToken).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/refresh/${encodeURIComponent(refreshToken)}`,
      );

      req.flush(response);
    });

    it('should handle refresh errors', () => {
      const refreshToken = 'invalid-refresh';

      service.refresh(refreshToken).subscribe({
        next: () => fail('Expected refresh to fail'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpTestingController.expectOne(
        `${authUrl}/refresh/${encodeURIComponent(refreshToken)}`,
      );

      req.flush(
        { message: 'Invalid refresh token' },
        {
          status: 401,
          statusText: 'Unauthorized',
        },
      );
    });
  });
});
