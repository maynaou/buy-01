import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart';
import { NotificationError } from '../../core/services/notification-error';
import { CartResponse, CartItemResponse } from './models/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartPage {
  private readonly cartService = inject(CartService);
  private readonly notification = inject(NotificationError);

  readonly cart = signal<CartResponse | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly isClearing = signal(false);
  readonly updatingProductId = signal<string | null>(null);

  readonly items = computed<CartItemResponse[]>(() => this.cart()?.items ?? []);
  readonly totalItems = computed<number>(() => this.cart()?.totalItems ?? 0);
  readonly subtotal = computed<number>(() => this.cart()?.subtotalPrice ?? 0);
  readonly shipping = computed<number>(() => this.cart()?.shippingPrice ?? 0);
  readonly total = computed<number>(() => this.cart()?.totalPrice ?? 0);

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.cartService.getCart().subscribe({
      next: (cartResponse) => {
        this.cart.set(cartResponse);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load your cart.');
        console.error('Unable to load cart', error);
      },
    });
  }

  removeItem(productId: string): void {
    this.updatingProductId.set(productId);

    this.cartService.removeFromCart(productId).subscribe({
      next: (updatedCart) => {
        this.cart.set(updatedCart);
        this.updatingProductId.set(null);
        this.notification.show('Item removed from cart', 'green');
      },
      error: (error) => {
        this.updatingProductId.set(null);
        console.error('Unable to remove item from cart', error);
        this.notification.show('Failed to remove item', 'red');
      },
    });
  }

  clearCart(): void {
    if (this.items().length === 0 || this.isClearing()) {
      return;
    }

    this.isClearing.set(true);

    this.cartService.clearCart().subscribe({
      next: (emptyCart) => {
        this.cart.set(emptyCart);
        this.isClearing.set(false);
        this.notification.show('Cart cleared successfully', 'green');
      },
      error: (error) => {
        this.isClearing.set(false);
        console.error('Unable to clear cart', error);
        this.notification.show('Failed to clear cart', 'red');
      },
    });
  }

  changeQuantity(productId: string, quantity: number): void {
    const item = this.items().find(
      (current) => current.productId === productId
    );

    if (!item || quantity < 1 || quantity > item.availableStock) {
      return;
    }

    this.updatingProductId.set(productId);

    this.cartService.updateQuantity({ productId, quantity }).subscribe({
      next: (updatedCart) => {
        this.cart.set(updatedCart);
        this.updatingProductId.set(null);
      },
      error: (error) => {
        this.updatingProductId.set(null);
        console.error('Unable to update quantity', error);
        this.notification.show('Unable to update quantity', 'red');
      },
    });
  }
}
