import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { CartPage } from './cart';
import { CartService } from '../../core/services/cart';
import { NotificationError } from '../../core/services/notification-error';
import { CartResponse } from './models/cart';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;

  let cartService: jasmine.SpyObj<CartService>;
  let notification: jasmine.SpyObj<NotificationError>;

  const mockCart: CartResponse = {
    id: 'cart-1',
    userId: 'user-1',
    totalItems: 3,
    subtotalPrice: 160.0,
    shippingPrice: 0.0,
    totalPrice: 160.0,
    items: [
      {
        productId: 'prod-1',
        productName: 'Soccer Ball',
        productDescription: 'FIFA quality',
        unitPrice: 30,
        quantity: 2,
        subtotal: 60,
        availableStock: 10,
        imagePaths: ['https://example.com/ball.jpg'],
      },
      {
        productId: 'prod-2',
        productName: 'Running Shoes',
        productDescription: 'Lightweight shoes',
        unitPrice: 100,
        quantity: 1,
        subtotal: 100,
        availableStock: 5,
        imagePaths: [],
      },
    ],
  };

  beforeEach(async () => {
    cartService = jasmine.createSpyObj<CartService>('CartService', [
      'getCart',
      'removeFromCart',
      'clearCart',
      'updateQuantity',
      'refreshCartCount',
    ]);
    (cartService as any).cartCount = signal(3);

    notification = jasmine.createSpyObj<NotificationError>('NotificationError', [
      'show',
    ]);

    cartService.getCart.and.returnValue(of(mockCart));

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: NotificationError, useValue: notification },
      ],
    })
      .overrideComponent(CartPage, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created and load calculated cart directly from backend', () => {
    expect(component).toBeTruthy();
    expect(cartService.getCart).toHaveBeenCalledTimes(1);
    expect(component.items().length).toBe(2);
    expect(component.totalItems()).toBe(3);
    expect(component.subtotal()).toBe(160.0);
    expect(component.shipping()).toBe(0.0);
    expect(component.total()).toBe(160.0);
    expect(component.items()[0].subtotal).toBe(60);
  });

  it('should handle empty cart response', () => {
    cartService.getCart.and.returnValue(
      of({
        id: 'c2',
        userId: 'u1',
        items: [],
        totalItems: 0,
        subtotalPrice: 0.0,
        shippingPrice: 0.0,
        totalPrice: 0.0,
      })
    );
    component.loadCart();

    expect(component.items().length).toBe(0);
    expect(component.totalItems()).toBe(0);
    expect(component.total()).toBe(0);
  });

  it('should handle 404 cart response as empty', () => {
    cartService.getCart.and.returnValue(throwError(() => ({ status: 404 })));
    component.loadCart();

    expect(component.items().length).toBe(0);
    expect(component.errorMessage()).toBe('');
  });

  it('should handle general cart loading error', () => {
    cartService.getCart.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadCart();

    expect(component.errorMessage()).toBe('Unable to load your cart.');
  });

  describe('removeItem', () => {
    it('should update cart directly from backend response and notify user', () => {
      const updatedCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        totalItems: 1,
        subtotalPrice: 100.0,
        shippingPrice: 0.0,
        totalPrice: 100.0,
        items: [
          {
            productId: 'prod-2',
            productName: 'Running Shoes',
            unitPrice: 100,
            quantity: 1,
            subtotal: 100,
            availableStock: 5,
            imagePaths: [],
          },
        ],
      };

      cartService.removeFromCart.and.returnValue(of(updatedCart));

      component.removeItem('prod-1');

      expect(cartService.removeFromCart).toHaveBeenCalledWith('prod-1');
      expect(component.items().length).toBe(1);
      expect(component.items()[0].productId).toBe('prod-2');
      expect(component.totalItems()).toBe(1);
      expect(component.total()).toBe(100.0);
      expect(notification.show).toHaveBeenCalledWith(
        'Item removed from cart',
        'green'
      );
    });

    it('should notify error if removing item fails', () => {
      cartService.removeFromCart.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );

      component.removeItem('prod-1');

      expect(notification.show).toHaveBeenCalledWith(
        'Failed to remove item',
        'red'
      );
      expect(component.items().length).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('should not call the service when the cart is already empty', () => {
      component.cart.set({
        ...mockCart,
        items: [],
        totalItems: 0,
        subtotalPrice: 0,
        totalPrice: 0,
      });

      component.clearCart();

      expect(cartService.clearCart).not.toHaveBeenCalled();
      expect(component.isClearing()).toBeFalse();
    });

    it('should clear all cart items and notify user', () => {
      const emptyCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        totalItems: 0,
        subtotalPrice: 0.0,
        shippingPrice: 0.0,
        totalPrice: 0.0,
      };

      cartService.clearCart.and.returnValue(of(emptyCart));

      component.clearCart();

      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
      expect(component.items().length).toBe(0);
      expect(component.totalItems()).toBe(0);
      expect(component.total()).toBe(0);
      expect(notification.show).toHaveBeenCalledWith(
        'Cart cleared successfully',
        'green'
      );
    });

    it('should notify error if clearing cart fails', () => {
      cartService.clearCart.and.returnValue(
        throwError(() => new Error('Clear failed'))
      );

      component.clearCart();

      expect(notification.show).toHaveBeenCalledWith(
        'Failed to clear cart',
        'red'
      );
      expect(component.items().length).toBe(2);
    });
  });

  describe('changeQuantity', () => {
    it('should update cart with backend response when quantity is valid', () => {
      const updatedCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        totalItems: 4,
        subtotalPrice: 190.0,
        shippingPrice: 0.0,
        totalPrice: 190.0,
        items: [
          {
            productId: 'prod-1',
            productName: 'Soccer Ball',
            unitPrice: 30,
            quantity: 3,
            subtotal: 90,
            availableStock: 10,
          },
          {
            productId: 'prod-2',
            productName: 'Running Shoes',
            unitPrice: 100,
            quantity: 1,
            subtotal: 100,
            availableStock: 5,
          },
        ],
      };
      cartService.updateQuantity.and.returnValue(of(updatedCart));

      component.changeQuantity('prod-1', 3);

      expect(cartService.updateQuantity).toHaveBeenCalledWith({
        productId: 'prod-1',
        quantity: 3,
      });
      expect(component.items()[0].quantity).toBe(3);
      expect(component.items()[0].subtotal).toBe(90);
      expect(component.total()).toBe(190.0);
      expect(component.totalItems()).toBe(4);
    });

    it('should not update quantity if below 1 or exceeds available stock', () => {
      component.changeQuantity('prod-1', 0);
      expect(cartService.updateQuantity).not.toHaveBeenCalled();

      component.changeQuantity('prod-1', 11);
      expect(cartService.updateQuantity).not.toHaveBeenCalled();
    });

    it('should not update quantity for a product that is not in the cart', () => {
      component.changeQuantity('missing-product', 1);

      expect(cartService.updateQuantity).not.toHaveBeenCalled();
      expect(component.updatingProductId()).toBeNull();
    });

    it('should reset the updating state and notify when quantity update fails', () => {
      cartService.updateQuantity.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      component.changeQuantity('prod-1', 3);

      expect(component.updatingProductId()).toBeNull();
      expect(notification.show).toHaveBeenCalledWith(
        'Unable to update quantity',
        'red'
      );
      expect(component.items()[0].quantity).toBe(2);
    });
  });
});
