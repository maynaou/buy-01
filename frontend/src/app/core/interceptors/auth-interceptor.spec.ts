import {
    HttpClient,
    provideHttpClient,
    withInterceptors,
} from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth-interceptor';
import { TokenService } from '../services/token';
import { TokenRefreshService } from '../services/token-refresh';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpTesting: HttpTestingController;

    let tokenService: jasmine.SpyObj<TokenService>;
    let tokenRefreshService: jasmine.SpyObj<TokenRefreshService>;

    beforeEach(() => {
        tokenService = jasmine.createSpyObj<TokenService>(
            'TokenService',
            ['getAccessToken'],
        );

        tokenRefreshService = jasmine.createSpyObj<TokenRefreshService>(
            'TokenRefreshService',
            ['refresh'],
        );

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(
                    withInterceptors([authInterceptor]),
                ),
                provideHttpClientTesting(),

                {
                    provide: TokenService,
                    useValue: tokenService,
                },

                {
                    provide: TokenRefreshService,
                    useValue: tokenRefreshService,
                },
            ],
        });

        http = TestBed.inject(HttpClient);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTesting.verify();
    });

    it('should be created', () => {
        expect(authInterceptor).toBeTruthy();
    });

    it('should pass auth requests through without adding an authorization header', () => {
        tokenService.getAccessToken.and.returnValue('access-token');

        http.get('/api/auth/login').subscribe();

        const request = httpTesting.expectOne('/api/auth/login');

        expect(request.request.headers.has('Authorization')).toBeFalse();

        request.flush({});
    });

    it('should pass the request through when there is no access token', () => {
        tokenService.getAccessToken.and.returnValue(null);

        http.get('/api/products').subscribe();

        const request = httpTesting.expectOne('/api/products');

        expect(request.request.headers.has('Authorization')).toBeFalse();

        request.flush({});
    });

    it('should add the access token to the authorization header', () => {
        tokenService.getAccessToken.and.returnValue('my-access-token');

        http.get('/api/products').subscribe();

        const request = httpTesting.expectOne('/api/products');

        expect(
            request.request.headers.get('Authorization'),
        ).toBe('Bearer my-access-token');

        request.flush({});
    });

    it('should propagate non-401 errors without refreshing the token', () => {
        tokenService.getAccessToken.and.returnValue('access-token');

        const error = new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
            url: '/api/products',
        });

        let receivedError: HttpErrorResponse | undefined;

        http.get('/api/products').subscribe({
            error: (err) => {
                receivedError = err;
            },
        });

        const request = httpTesting.expectOne('/api/products');

        request.flush(null, error);

        expect(receivedError).toBeDefined();
        expect(receivedError?.status).toBe(500);

        expect(tokenRefreshService.refresh).not.toHaveBeenCalled();
    });

    it('should refresh the token when the request returns 401', () => {
        tokenService.getAccessToken.and.returnValue('old-access-token');

        tokenRefreshService.refresh.and.returnValue(
            of('new-access-token'),
        );

        let receivedResponse: unknown;

        http.get('/api/products').subscribe({
            next: (response) => {
                receivedResponse = response;
            },
        });

        const firstRequest = httpTesting.expectOne('/api/products');

        expect(
            firstRequest.request.headers.get('Authorization'),
        ).toBe('Bearer old-access-token');

        firstRequest.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        expect(tokenRefreshService.refresh).toHaveBeenCalledTimes(1);

        const retryRequest = httpTesting.expectOne('/api/products');

        expect(
            retryRequest.request.headers.get('Authorization'),
        ).toBe('Bearer new-access-token');

        retryRequest.flush({
            success: true,
        });

        expect(receivedResponse).toEqual({
            success: true,
        });
    });

    it('should propagate the original 401 error when token refresh fails', () => {
        tokenService.getAccessToken.and.returnValue('old-access-token');

        const refreshError = new Error('Refresh failed');

        tokenRefreshService.refresh.and.returnValue(
            throwError(() => refreshError),
        );

        let receivedError: HttpErrorResponse | undefined;

        http.get('/api/products').subscribe({
            error: (error) => {
                receivedError = error;
            },
        });

        const request = httpTesting.expectOne('/api/products');

        request.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        expect(tokenRefreshService.refresh).toHaveBeenCalledTimes(1);

        expect(receivedError).toBeDefined();
        expect(receivedError?.status).toBe(401);

        httpTesting.expectNone('/api/products');
    });

    it('should retry the original request only with the fresh token', () => {
        tokenService.getAccessToken.and.returnValue('old-token');

        tokenRefreshService.refresh.and.returnValue(
            of('fresh-token'),
        );

        http.get('/api/products').subscribe();

        const firstRequest = httpTesting.expectOne('/api/products');

        expect(
            firstRequest.request.headers.get('Authorization'),
        ).toBe('Bearer old-token');

        firstRequest.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        const retryRequest = httpTesting.expectOne('/api/products');

        expect(
            retryRequest.request.headers.get('Authorization'),
        ).toBe('Bearer fresh-token');

        retryRequest.flush({
            success: true,
        });
    });

    it('should not refresh the token when the original request has no access token', () => {
        tokenService.getAccessToken.and.returnValue(null);

        let receivedError: HttpErrorResponse | undefined;

        http.get('/api/products').subscribe({
            error: (error) => {
                receivedError = error;
            },
        });

        const request = httpTesting.expectOne('/api/products');

        request.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        expect(receivedError).toBeDefined();
        expect(receivedError?.status).toBe(401);

        expect(tokenRefreshService.refresh).not.toHaveBeenCalled();
    });
    it('should preserve the original request URL when retrying after refresh', () => {
        tokenService.getAccessToken.and.returnValue('old-token');

        tokenRefreshService.refresh.and.returnValue(
            of('fresh-token'),
        );

        http.get('/api/products/123').subscribe();

        const firstRequest = httpTesting.expectOne('/api/products/123');

        firstRequest.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        const retryRequest = httpTesting.expectOne('/api/products/123');

        expect(retryRequest.request.url).toBe('/api/products/123');

        retryRequest.flush({
            id: 123,
        });
    });

    it('should preserve the original request method when retrying after refresh', () => {
        tokenService.getAccessToken.and.returnValue('old-token');

        tokenRefreshService.refresh.and.returnValue(
            of('fresh-token'),
        );

        http.post('/api/products', {
            name: 'Test Product',
        }).subscribe();

        const firstRequest = httpTesting.expectOne('/api/products');

        expect(firstRequest.request.method).toBe('POST');

        firstRequest.flush(null, {
            status: 401,
            statusText: 'Unauthorized',
        });

        const retryRequest = httpTesting.expectOne('/api/products');

        expect(retryRequest.request.method).toBe('POST');

        expect(
            retryRequest.request.headers.get('Authorization'),
        ).toBe('Bearer fresh-token');

        retryRequest.flush({
            success: true,
        });
    });
});
