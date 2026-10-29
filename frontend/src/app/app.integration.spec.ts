import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NgForm } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { TokenService } from './core/services/token';
import { NotificationError } from './core/services/notification-error';
import { CartPage } from './features/cart/cart';
import { CheckoutPage } from './features/checkout/checkout';
import { Order } from './features/checkout/models/order';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { MyOrdersPage } from './features/orders/my-orders';
import { Profile } from './features/profile/profile';
import { SellerDashboard } from './features/products/seller-dashboard/seller-dashboard';

describe('Frontend route integrations', () => {
  let http: HttpTestingController;
  let notification: jasmine.SpyObj<NotificationError>;

  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    localStorage.clear();
    notification = jasmine.createSpyObj<NotificationError>(
      'NotificationError',
      ['show']
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        { provide: NotificationError, useValue: notification },
      ],
    });
  });

  afterEach(() => {
    http?.verify();
    localStorage.clear();
  });

  async function createHarness(role?: 'CLIENT' | 'SELLER') {
    if (role) {
      const payload = btoa(JSON.stringify({
        sub: 'user-1',
        scope: `ROLE_${role}`,
      }));
      TestBed.inject(TokenService).setTokens(`header.${payload}.signature`, 'refresh');
    }

    http = TestBed.inject(HttpTestingController);
    return RouterTestingHarness.create();
  }

  it('opens the public home, login, and registration routes', async () => {
    const harness = await createHarness();

    await harness.navigateByUrl('/', Home);
    http.expectOne(`${apiUrl}/api/products/catalog?page=0&size=10`).flush({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    });
    expect(harness.routeNativeElement?.querySelector('#product-catalog')).toBeTruthy();

    await harness.navigateByUrl('/login', Login);
    expect(harness.routeNativeElement?.textContent).toContain('Welcome back');

    await harness.navigateByUrl('/register', Register);
    expect(harness.routeNativeElement?.textContent).toContain('Create account');
  });

  it('redirects protected pages to login when the user is signed out', async () => {
    const harness = await createHarness();

    await harness.navigateByUrl('/cart', Login);

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Welcome back');
  });

  it('loads the cart and clears it from the cart page', async () => {
    const harness = await createHarness('CLIENT');
    await harness.navigateByUrl('/cart', CartPage);
    const cartUrl = `${apiUrl}/api/orders/cart`;

    http.expectOne(cartUrl).flush({
      id: 'cart-1',
      userId: 'user-1',
      items: [{
        productId: 'product-1',
        productName: 'Test Ball',
        unitPrice: 12.5,
        quantity: 2,
        subtotal: 25,
        availableStock: 8,
      }],
      totalItems: 2,
      subtotalPrice: 25,
      shippingPrice: 0,
      totalPrice: 25,
    });
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Test Ball');
    expect(harness.routeNativeElement?.textContent).toContain('Order Summary');

    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.cart-header__clear')
      ?.click();
    harness.detectChanges();

    const clearRequest = http.expectOne(`${cartUrl}/clear`);
    expect(clearRequest.request.method).toBe('DELETE');
    clearRequest.flush({
      id: 'cart-1',
      userId: 'user-1',
      items: [],
      totalItems: 0,
      subtotalPrice: 0,
      shippingPrice: 0,
      totalPrice: 0,
    });
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Your cart is empty');
    expect(notification.show).toHaveBeenCalledWith(
      'Cart cleared successfully',
      'green'
    );
  });

  it('loads the client profile and purchase analytics', async () => {
    const harness = await createHarness('CLIENT');

    await harness.navigateByUrl('/profile', Profile);
    http.expectOne(`${apiUrl}/api/users/me`).flush({
      username: 'buyer',
      email: 'buyer@example.test',
      role: 'CLIENT',
    });
    http.expectOne(`${apiUrl}/api/orders/my-analytics`).flush({
      totalSpent: 0,
      mostBoughtProducts: [],
      topCategories: [],
    });
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('buyer');
  });

  it('loads seller products on the dashboard route', async () => {
    const harness = await createHarness('SELLER');

    await harness.navigateByUrl('/dashboard', SellerDashboard);
    http.expectOne(`${apiUrl}/api/products/my-products`).flush([]);

    expect(harness.routeNativeElement?.textContent).toContain('Seller Dashboard');
  });

  it('loads the client order history route', async () => {
    const harness = await createHarness('CLIENT');

    await harness.navigateByUrl('/orders', MyOrdersPage);
    const request = http.expectOne(`${apiUrl}/api/orders/my-orders`);
    expect(request.request.method).toBe('POST');
    request.flush([]);
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('You have no orders yet');
  });

  it('submits checkout and displays the returned order confirmation', async () => {
    const harness = await createHarness('CLIENT');

    const checkout = await harness.navigateByUrl('/checkout', CheckoutPage);
    http.expectOne(`${apiUrl}/api/orders/cart`).flush({
      id: 'cart-1',
      userId: 'user-1',
      items: [{
        productId: 'product-1',
        productName: 'Test Ball',
        unitPrice: 12.5,
        quantity: 2,
        subtotal: 25,
        availableStock: 8,
      }],
      totalItems: 2,
      subtotalPrice: 25,
      shippingPrice: 0,
      totalPrice: 25,
    });

    checkout.fullName = 'Buyer Example';
    checkout.address = '123 Main Street';
    checkout.phone = '555-0100';
    checkout.placeOrder({ invalid: false } as NgForm);

    const order: Order = {
      id: 'order-123456789',
      buyerId: 'user-1',
      sellerId: 'seller-1',
      status: 'PENDING',
      paymentMethod: 'PAY_ON_DELIVERY',
      fullName: 'Buyer Example',
      address: '123 Main Street',
      phone: '555-0100',
      items: [],
      total: 25,
      statusHistory: [],
      hiddenByBuyer: false,
      createdAt: '2026-01-10T12:00:00Z',
    };
    const request = http.expectOne(`${apiUrl}/api/orders/checkout`);
    expect(request.request.method).toBe('POST');
    request.flush([order]);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/order/confirmation');
    expect(harness.routeNativeElement?.textContent).toContain('Order Placed!');
  });
});
