import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth-guard';
import { TokenService } from '../services/token';

describe('authGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj<TokenService>(
      'TokenService',
      ['isAuthenticated'],
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['createUrlTree'],
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TokenService,
          useValue: tokenService,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should return true when the user is authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBeTrue();
    expect(tokenService.isAuthenticated).toHaveBeenCalled();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login when the user is not authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(false);

    const loginUrlTree = {} as UrlTree;

    router.createUrlTree.and.returnValue(loginUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBe(loginUrlTree);
    expect(tokenService.isAuthenticated).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should not create a login UrlTree when the user is authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(true);

    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should create a login UrlTree when the user is not authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(false);

    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(router.createUrlTree).toHaveBeenCalledTimes(1);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
