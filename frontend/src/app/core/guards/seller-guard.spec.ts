import { TestBed } from '@angular/core/testing';
import { CanActivateFn, UrlTree, provideRouter } from '@angular/router';

import { sellerGuard } from './seller-guard';

/** Builds a token whose payload segment carries the given claims. */
function tokenWith(claims: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(claims))}.signature`;
}

describe('sellerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => sellerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should let a seller through', () => {
    localStorage.setItem('access_token', tokenWith({ sub: 'user-42', scope: 'ROLE_SELLER' }));

    expect(executeGuard(null!, null!)).toBe(true);
  });

  it('should send a signed-out visitor to login', () => {
    const result = executeGuard(null!, null!) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login');
  });

  it('should send a client back to the catalogue', () => {
    localStorage.setItem('access_token', tokenWith({ sub: 'user-7', scope: 'ROLE_CLIENT' }));

    const result = executeGuard(null!, null!) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/');
  });
});
