import { TestBed } from '@angular/core/testing';

import { TokenService } from './token';

/** Builds a token whose payload segment carries the given claims. */
function tokenWith(claims: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(claims))}.signature`;
}

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should read the subject as the user id', () => {
    localStorage.setItem('access_token', tokenWith({ sub: 'user-42', scope: 'ROLE_SELLER' }));
    expect(service.getUserId()).toBe('user-42');
  });

  it('should read authorities from the scope claim', () => {
    localStorage.setItem('access_token', tokenWith({ sub: 'user-42', scope: 'ROLE_SELLER' }));

    expect(service.getRoles()).toEqual(['ROLE_SELLER']);
    expect(service.isSeller()).toBe(true);
  });

  it('should split a scope claim carrying several authorities', () => {
    localStorage.setItem('access_token', tokenWith({ scope: 'ROLE_CLIENT ROLE_SELLER' }));
    expect(service.getRoles()).toEqual(['ROLE_CLIENT', 'ROLE_SELLER']);
  });

  it('should not treat a client as a seller', () => {
    localStorage.setItem('access_token', tokenWith({ sub: 'user-7', scope: 'ROLE_CLIENT' }));

    expect(service.isSeller()).toBe(false);
  });

  it('should stay quiet without a token', () => {
    expect(service.getUserId()).toBeNull();
    expect(service.getRoles()).toEqual([]);
    expect(service.isSeller()).toBe(false);
  });

  it('should stay quiet on an unreadable token', () => {
    localStorage.setItem('access_token', 'not-a-jwt');

    expect(service.getUserId()).toBeNull();
    expect(service.isSeller()).toBe(false);
  });
});
