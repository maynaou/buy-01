import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CartService } from './cart';
import { environment } from '../../../environments/environment';
import { CartResponse, CartRequest } from '../../features/cart/models/cart';

describe('CartService', () => {
  let service: CartService;
  let httpTestingController: HttpTestingController;

  const cartUrl = `${environment.apiUrl}/api/orders/cart`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CartService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.cartCount()).toBe(0);
  });

  it('should return a product quantity from the cached cart or zero when absent', () => {
    service.cart.set({
      userId: 'user-1',
      items: [
        {
          productId: 'prod-1',
          productName: 'Ball',
          unitPrice: 25,
          quantity: 3,
          subtotal: 75,
          availableStock: 10,
        },
      ],
      totalItems: 3,
      subtotalPrice: 75,
      shippingPrice: 0,
      totalPrice: 75,
    });

    expect(service.getItemQuantity('prod-1')).toBe(3);
    expect(service.getItemQuantity('missing-product')).toBe(0);
  });

  describe('getCart', () => {
    it('should send a GET request and update cartCount from backend totalItems', () => {
      const mockCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        totalItems: 5,
        subtotalPrice: 150.0,
        shippingPrice: 0.0,
        totalPrice: 150.0,
        items: [
          {
            productId: 'prod-1',
            productName: 'Ball',
            unitPrice: 25,
            quantity: 2,
            subtotal: 50,
            availableStock: 10,
          },
          {
            productId: 'prod-2',
            productName: 'Shoes',
            unitPrice: 100,
            quantity: 1,
            subtotal: 100,
            availableStock: 5,
          },
        ],
      };

      service.getCart().subscribe((cart) => {
        expect(cart).toEqual(mockCart);
      });

      const req = httpTestingController.expectOne(cartUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCart);

      expect(service.cartCount()).toBe(5);
    });

    it('should handle empty cart', () => {
      const mockCart: CartResponse = {
        id: 'cart-2',
        userId: 'user-1',
        items: [],
        totalItems: 0,
        subtotalPrice: 0.0,
        shippingPrice: 0.0,
        totalPrice: 0.0,
      };

      service.getCart().subscribe((cart) => {
        expect(cart.items.length).toBe(0);
      });

      const req = httpTestingController.expectOne(cartUrl);
      req.flush(mockCart);

      expect(service.cartCount()).toBe(0);
    });
  });

  describe('addToCart', () => {
    it('should send a POST request and update cartCount from response', () => {
      const request: CartRequest = {
        productId: 'prod-1',
        quantity: 2,
      };

      const mockResponse: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            productId: 'prod-1',
            productName: 'Ball',
            unitPrice: 25,
            quantity: 2,
            subtotal: 50,
            availableStock: 10,
          },
        ],
        totalItems: 2,
        subtotalPrice: 50.0,
        shippingPrice: 0.0,
        totalPrice: 50.0,
      };

      service.addToCart(request).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(cartUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);

      expect(service.cartCount()).toBe(2);
    });
  });

  describe('updateQuantity', () => {
    it('should send a PUT request and update cartCount from backend totalItems', () => {
      const request: CartRequest = {
        productId: 'prod-1',
        quantity: 4,
      };

      const updatedCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        totalItems: 4,
        subtotalPrice: 100.0,
        shippingPrice: 0.0,
        totalPrice: 100.0,
        items: [
          {
            productId: 'prod-1',
            productName: 'Ball',
            unitPrice: 25,
            quantity: 4,
            subtotal: 100,
            availableStock: 10,
          },
        ],
      };

      service.updateQuantity(request).subscribe((cart) => {
        expect(cart).toEqual(updatedCart);
      });

      const req = httpTestingController.expectOne(cartUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(updatedCart);

      expect(service.cartCount()).toBe(4);
    });
  });

  describe('removeFromCart', () => {
    it('should send a DELETE request for a specific product and update cartCount', () => {
      const productId = 'prod-1';
      const updatedCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        totalItems: 0,
        subtotalPrice: 0.0,
        shippingPrice: 0.0,
        totalPrice: 0.0,
      };

      service.removeFromCart(productId).subscribe((cart) => {
        expect(cart).toEqual(updatedCart);
      });

      const req = httpTestingController.expectOne(`${cartUrl}/${productId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(updatedCart);

      expect(service.cartCount()).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should send a DELETE request to /clear and reset cartCount', () => {
      service.cartCount.set(5);
      const emptyCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        totalItems: 0,
        subtotalPrice: 0.0,
        shippingPrice: 0.0,
        totalPrice: 0.0,
      };

      service.clearCart().subscribe((cart) => {
        expect(cart).toEqual(emptyCart);
      });

      const req = httpTestingController.expectOne(`${cartUrl}/clear`);
      expect(req.request.method).toBe('DELETE');
      req.flush(emptyCart);

      expect(service.cartCount()).toBe(0);
    });
  });

  describe('refreshCartCount', () => {
    it('should refresh cached cart data and item count', () => {
      const refreshedCart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        totalItems: 4,
        subtotalPrice: 80,
        shippingPrice: 0,
        totalPrice: 80,
      };
      service.cartCount.set(1);

      service.refreshCartCount();

      const req = httpTestingController.expectOne(cartUrl);
      expect(req.request.method).toBe('GET');
      req.flush(refreshedCart);

      expect(service.cartCount()).toBe(4);
      expect(service.cart()).toEqual(refreshedCart);
    });

    it('should clear cached cart data and count when refresh fails', () => {
      service.cartCount.set(3);
      service.cart.set({
        userId: 'user-1',
        items: [],
        totalItems: 3,
        subtotalPrice: 30,
        shippingPrice: 0,
        totalPrice: 30,
      });

      service.refreshCartCount();

      const req = httpTestingController.expectOne(cartUrl);
      req.flush('Cart unavailable', {
        status: 500,
        statusText: 'Server Error',
      });

      expect(service.cartCount()).toBe(0);
      expect(service.cart()).toBeNull();
    });
  });
});
