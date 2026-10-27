import { Component, inject, OnInit, signal } from '@angular/core';
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
export class OrderConfirmationPage implements OnInit {
  private readonly router = inject(Router);
  private readonly navigationOrders: Order[] | undefined;

  readonly orders = signal<Order[]>([]);

  constructor() {
    // Navigation state must be read in the constructor while navigation is active.
    // getCurrentNavigation() returns null once the component finishes constructing.
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { orders?: Order[] } | undefined;
    this.navigationOrders = state?.orders;
  }

  ngOnInit(): void {
    if (this.navigationOrders?.length) {
      this.orders.set(this.navigationOrders);
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
