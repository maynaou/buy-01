import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CartService } from '../../core/services/cart';
import { NotificationError } from '../../core/services/notification-error';
import { OrderService } from '../../core/services/order';
import { CartResponse } from '../cart/models/cart';
import { Order } from './models/order';
import { CheckoutPage } from './checkout';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let cartService: jasmine.SpyObj<CartService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let notification: jasmine.SpyObj<NotificationError>;
  let router: jasmine.SpyObj<Router>;
  let cartCount: ReturnType<typeof signal<number>>;

  const cart: CartResponse = {
    id: 'cart-1',
    userId: 'buyer-1',
    totalItems: 2,
    subtotalPrice: 25,
    shippingPrice: 0,
    totalPrice: 25,
    items: [
      {
        productId: 'product-1',
        productName: 'Ball',
        unitPrice: 12.5,
        quantity: 2,
        subtotal: 25,
        availableStock: 8,
      },
    ],
  };

  const order: Order = {
    id: 'order-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'PENDING',
    paymentMethod: 'PAY_ON_DELIVERY',
    fullName: 'Client Test',
    address: '123 Main Street',
    phone: '0612345678',
    items: [],
    total: 25,
    statusHistory: [],
    hiddenByBuyer: false,
    createdAt: '2026-01-10T12:00:00Z',
  };

  beforeEach(async () => {
    cartService = jasmine.createSpyObj<CartService>('CartService', ['getCart']);
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['checkout']);
    notification = jasmine.createSpyObj<NotificationError>('NotificationError', ['show']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    cartCount = signal(2);
    Object.defineProperty(cartService, 'cartCount', { value: cartCount });
    cartService.getCart.and.returnValue(of(cart));
    orderService.checkout.and.returnValue(of([order]));

    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: OrderService, useValue: orderService },
        { provide: NotificationError, useValue: notification },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(CheckoutPage, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load cart data and expose order totals', () => {
    expect(cartService.getCart).toHaveBeenCalledTimes(1);
    expect(component.items()).toEqual(cart.items);
    expect(component.totalItems()).toBe(2);
    expect(component.subtotal()).toBe(25);
    expect(component.shipping()).toBe(0);
    expect(component.total()).toBe(25);
    expect(component.loading()).toBeFalse();
  });

  it('should show a loading error when the cart cannot be loaded', () => {
    cartService.getCart.and.returnValue(throwError(() => new Error('network')));

    component.loadCart();

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Unable to load your cart.');
  });

  it('should submit trimmed delivery details and navigate with returned orders', () => {
    component.fullName = '  Client Test  ';
    component.address = '  123 Main Street  ';
    component.phone = '  0612345678  ';
    const form = { invalid: false } as NgForm;

    component.placeOrder(form);

    expect(orderService.checkout).toHaveBeenCalledWith({
      fullName: 'Client Test',
      address: '123 Main Street',
      phone: '0612345678',
    });
    expect(cartCount()).toBe(0);
    expect(component.submitting()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/order/confirmation'], {
      state: { orders: [order] },
    });
  });

  it('should not submit when the form is invalid', () => {
    component.placeOrder({ invalid: true } as NgForm);

    expect(orderService.checkout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should notify when submitting with an empty cart', () => {
    component.loadedCart.set({ ...cart, items: [], totalItems: 0 });

    component.placeOrder({ invalid: false } as NgForm);

    expect(orderService.checkout).not.toHaveBeenCalled();
    expect(notification.show).toHaveBeenCalledWith('Your cart is empty.', 'red');
  });

  it('should show the server error and reset submitting state when checkout fails', () => {
    orderService.checkout.and.returnValue(
      throwError(() => ({ error: { message: 'Insufficient stock' } }))
    );

    component.placeOrder({ invalid: false } as NgForm);

    expect(component.errorMessage()).toBe('Insufficient stock');
    expect(component.submitting()).toBeFalse();
    expect(notification.show).toHaveBeenCalledWith('Insufficient stock', 'red');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
