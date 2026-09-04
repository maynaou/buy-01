import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { sellerGuard } from './seller-guard';
import { TokenService } from '../services/token';

describe('sellerGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj<TokenService>(
      'TokenService',
      ['isAuthenticated', 'isSeller'],
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
    expect(sellerGuard).toBeTruthy();
  });

  it('should redirect to login when the user is not authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(false);

    const loginUrlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(loginUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      sellerGuard({} as any, {} as any),
    );

    expect(result).toBe(loginUrlTree);

    expect(tokenService.isAuthenticated).toHaveBeenCalled();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);

    expect(tokenService.isSeller).not.toHaveBeenCalled();
  });

  it('should redirect to home when the user is authenticated but is not a seller', () => {
    tokenService.isAuthenticated.and.returnValue(true);
    tokenService.isSeller.and.returnValue(false);

    const homeUrlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(homeUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      sellerGuard({} as any, {} as any),
    );

    expect(result).toBe(homeUrlTree);

    expect(tokenService.isAuthenticated).toHaveBeenCalled();
    expect(tokenService.isSeller).toHaveBeenCalled();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should allow access when the user is an authenticated seller', () => {
    tokenService.isAuthenticated.and.returnValue(true);
    tokenService.isSeller.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      sellerGuard({} as any, {} as any),
    );

    expect(result).toBeTrue();

    expect(tokenService.isAuthenticated).toHaveBeenCalled();
    expect(tokenService.isSeller).toHaveBeenCalled();

    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should not check seller status when the user is not authenticated', () => {
    tokenService.isAuthenticated.and.returnValue(false);

    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.runInInjectionContext(() =>
      sellerGuard({} as any, {} as any),
    );

    expect(tokenService.isSeller).not.toHaveBeenCalled();
  });

  it('should check seller status only after authentication succeeds', () => {
    tokenService.isAuthenticated.and.returnValue(true);
    tokenService.isSeller.and.returnValue(false);

    router.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.runInInjectionContext(() =>
      sellerGuard({} as any, {} as any),
    );

    expect(tokenService.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(tokenService.isSeller).toHaveBeenCalledTimes(1);
  });
});
