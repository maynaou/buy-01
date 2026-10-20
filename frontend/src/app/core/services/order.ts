import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CheckoutRequest, Order, OrderStatus } from '../../features/checkout/models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  private readonly orderUrl = `${environment.apiUrl}/api/orders`;
    // private readonly sellerOrdersUrl = `${environment.apiUrl}/api/orders/seller`;

  /**
   * POST /api/orders/checkout
   * Submits the current cart as an order (one per seller).
   * The cart is cleared server-side on success.
   */
  checkout(request: CheckoutRequest): Observable<Order[]> {
    return this.http.post<Order[]>(this.orderUrl + '/checkout', request);
  }

  /**
   * GET /api/orders/seller
   * Returns all orders containing the authenticated seller's products.
   */
  getSellerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.orderUrl + '/seller');
  }

  /**
   * PATCH /api/orders/{id}/status
   * Updates the order status (e.g. CONFIRMED, SHIPPED, DELIVERED, CANCELLED).
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.orderUrl}/${orderId}/status`, { status });
  }

  /**
   * GET /api/orders/my-orders
   * Returns all active orders placed by the current client.
   */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.orderUrl}/my-orders`);
  }

  /**
   * PATCH /api/orders/{id}/cancel
   * Allows the client to cancel an order when it's PENDING.
   */
  cancelOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.orderUrl}/${orderId}/cancel`, {});
  }

  /**
   * DELETE /api/orders/{id}
   * Hides a DELIVERED or CANCELLED order from the client's view.
   */
  deleteOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.orderUrl}/${orderId}`);
  }
}
