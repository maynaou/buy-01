
import { TestBed } from '@angular/core/testing';
import { TokenService } from './token';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(TokenService);

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // --------------------------------------------------
  // Creation
  // --------------------------------------------------

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --------------------------------------------------
  // setTokens()
  // --------------------------------------------------

  describe('setTokens', () => {
    it('should store the access token', () => {
      service.setTokens('access123', 'refresh123');

      expect(localStorage.getItem('access_token')).toBe('access123');
    });

    it('should store the refresh token', () => {
      service.setTokens('access123', 'refresh123');

      expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    });

    it('should store both tokens', () => {
      service.setTokens('access123', 'refresh123');

      expect(localStorage.getItem('access_token')).toBe('access123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    });

    it('should replace existing tokens', () => {
      service.setTokens('old-access', 'old-refresh');
      service.setTokens('new-access', 'new-refresh');

      expect(localStorage.getItem('access_token')).toBe('new-access');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
    });
  });

  // --------------------------------------------------
  // getAccessToken()
  // --------------------------------------------------

  describe('getAccessToken', () => {
    it('should return the stored access token', () => {
      localStorage.setItem('access_token', 'access123');

      expect(service.getAccessToken()).toBe('access123');
    });

    it('should return null when no access token exists', () => {
      expect(service.getAccessToken()).toBeNull();
    });
  });

  // --------------------------------------------------
  // getRefreshToken()
  // --------------------------------------------------

  describe('getRefreshToken', () => {
    it('should return the stored refresh token', () => {
      localStorage.setItem('refresh_token', 'refresh123');

      expect(service.getRefreshToken()).toBe('refresh123');
    });

    it('should return null when no refresh token exists', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  // --------------------------------------------------
  // clearTokens()
  // --------------------------------------------------

  describe('clearTokens', () => {
    it('should remove the access token', () => {
      localStorage.setItem('access_token', 'access123');
      localStorage.setItem('refresh_token', 'refresh123');

      service.clearTokens();

      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should remove the refresh token', () => {
      localStorage.setItem('access_token', 'access123');
      localStorage.setItem('refresh_token', 'refresh123');

      service.clearTokens();

      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should remove both tokens', () => {
      service.setTokens('access123', 'refresh123');

      service.clearTokens();

      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  // --------------------------------------------------
  // isAuthenticated()
  // --------------------------------------------------

  describe('isAuthenticated', () => {
    it('should return true when an access token exists', () => {
      localStorage.setItem('access_token', 'access123');

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when no access token exists', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true when the access token is an empty string', () => {
      localStorage.setItem('access_token', '');

      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // --------------------------------------------------
  // getUserId()
  // --------------------------------------------------

  describe('getUserId', () => {
    it('should return the user id from the JWT payload', () => {
      const token = createJwtToken({
        sub: 'user-123',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getUserId()).toBe('user-123');
    });

    it('should return null when there is no access token', () => {
      expect(service.getUserId()).toBeNull();
    });

    it('should return null when the token does not contain three segments', () => {
      service.setTokens('invalid-token', 'refresh123');

      expect(service.getUserId()).toBeNull();
    });

    it('should return null when the JWT payload is invalid', () => {
      service.setTokens('header.invalid-payload.signature', 'refresh123');

      expect(service.getUserId()).toBeNull();
    });

    it('should return null when the sub claim is missing', () => {
      const token = createJwtToken({
        email: 'test@example.com',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getUserId()).toBeNull();
    });

    it('should return null when the sub claim is not a string', () => {
      const token = createJwtToken({
        sub: 123,
      });

      service.setTokens(token, 'refresh123');

      expect(service.getUserId()).toBeNull();
    });
  });

  // --------------------------------------------------
  // getRoles()
  // --------------------------------------------------

  describe('getRoles', () => {
    it('should return roles from the scope claim', () => {
      const token = createJwtToken({
        scope: 'ROLE_CLIENT ROLE_SELLER',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getRoles()).toEqual([
        'ROLE_CLIENT',
        'ROLE_SELLER',
      ]);
    });

    it('should return an empty array when there is no access token', () => {
      expect(service.getRoles()).toEqual([]);
    });

    it('should return an empty array when the token is invalid', () => {
      service.setTokens('invalid-token', 'refresh123');

      expect(service.getRoles()).toEqual([]);
    });

    it('should return an empty array when scope is missing', () => {
      const token = createJwtToken({
        sub: 'user-123',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getRoles()).toEqual([]);
    });

    it('should return an empty array when scope is not a string', () => {
      const token = createJwtToken({
        scope: 123,
      });

      service.setTokens(token, 'refresh123');

      expect(service.getRoles()).toEqual([]);
    });

    it('should split roles separated by spaces', () => {
      const token = createJwtToken({
        scope: 'ROLE_CLIENT ROLE_SELLER ROLE_ADMIN',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getRoles()).toEqual([
        'ROLE_CLIENT',
        'ROLE_SELLER',
        'ROLE_ADMIN',
      ]);
    });

    it('should ignore extra spaces between roles', () => {
      const token = createJwtToken({
        scope: 'ROLE_CLIENT   ROLE_SELLER    ROLE_ADMIN',
      });

      service.setTokens(token, 'refresh123');

      expect(service.getRoles()).toEqual([
        'ROLE_CLIENT',
        'ROLE_SELLER',
        'ROLE_ADMIN',
      ]);
    });
  });

  // --------------------------------------------------
  // isSeller()
  // --------------------------------------------------

  describe('isSeller', () => {
    it('should return true when the user has ROLE_SELLER', () => {
      const token = createJwtToken({
        scope: 'ROLE_CLIENT ROLE_SELLER',
      });

      service.setTokens(token, 'refresh123');

      expect(service.isSeller()).toBeTrue();
    });

    it('should return false when the user does not have ROLE_SELLER', () => {
      const token = createJwtToken({
        scope: 'ROLE_CLIENT',
      });

      service.setTokens(token, 'refresh123');

      expect(service.isSeller()).toBeFalse();
    });

    it('should return false when there are no roles', () => {
      expect(service.isSeller()).toBeFalse();
    });
  });
});

/**
 * Creates a fake JWT containing the supplied payload.
 *
 * We don't need a real signed JWT here because TokenService
 * only reads the payload.
 */
function createJwtToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(
    JSON.stringify({
      alg: 'none',
      typ: 'JWT',
    }),
  );

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${header}.${encodedPayload}.signature`;
}

function base64UrlEncode(value: string): string {
  const base64 = btoa(value);

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}