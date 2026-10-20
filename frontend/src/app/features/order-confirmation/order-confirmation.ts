import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Order } from '../checkout/models/order';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss',
})
export class OrderConfirmationPage {
  private readonly router = inject(Router);

  readonly orders = signal<Order[]>([]);

  constructor() {
    // Navigation state must be read in the constructor while navigation is active.
    // getCurrentNavigation() returns null once the component finishes constructing.
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { orders?: Order[] } | undefined;

    if (state?.orders?.length) {
      this.orders.set(state.orders);
    } else {
      // If user navigates directly or refreshes, redirect home
      this.router.navigate(['/']);
    }
  }

  /** Grand total across all orders (one per seller) */
  grandTotal(): number {
    return this.orders().reduce((sum, o) => sum + o.total, 0);
  }

  /** Formatted order ID — show last 8 chars for readability */
  shortId(id: string): string {
    return id.length > 8 ? '…' + id.slice(-8) : id;
  }
}
