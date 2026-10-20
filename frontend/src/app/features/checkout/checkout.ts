import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { NotificationError } from '../../core/services/notification-error';
import { CartResponse, CartItemResponse } from '../cart/models/cart';
import { Order } from './models/order';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutPage {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly notification = inject(NotificationError);
  private readonly router = inject(Router);

  // ── Cart state ──────────────────────────────────────────────────────────────
  readonly loadedCart = signal<CartResponse | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly items = computed<CartItemResponse[]>(() => this.loadedCart()?.items ?? []);
  readonly subtotal = computed(() => this.loadedCart()?.subtotalPrice ?? 0);
  readonly shipping = computed(() => this.loadedCart()?.shippingPrice ?? 0);
  readonly total = computed(() => this.loadedCart()?.totalPrice ?? 0);
  readonly totalItems = computed(() => this.loadedCart()?.totalItems ?? 0);

  // ── Form fields ─────────────────────────────────────────────────────────────
  fullName = '';
  address = '';
  phone = '';

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.cartService.getCart().subscribe({
      next: (c) => {
        this.loadedCart.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Unable to load your cart.');
      },
    });
  }

  placeOrder(form: NgForm): void {
    if (form.invalid || this.submitting()) return;
    if (this.items().length === 0) {
      this.notification.show('Your cart is empty.', 'red');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.orderService
      .checkout({
        fullName: this.fullName.trim(),
        address: this.address.trim(),
        phone: this.phone.trim(),
      })
      .subscribe({
        next: (orders: Order[]) => {
          // Reset cart count in navbar
          this.cartService.cartCount.set(0);
          this.submitting.set(false);
          this.router.navigate(['/order/confirmation'], {
            state: { orders },
          });
        },
        error: (err) => {
          this.submitting.set(false);
          const apiError = err?.error;
          const msg: string =
            typeof apiError === 'string'
              ? apiError
              : apiError?.message ?? apiError?.error ?? 'Order failed. Please try again.';
          this.errorMessage.set(msg);
          this.notification.show(msg, 'red');
        },
      });
  }
}
