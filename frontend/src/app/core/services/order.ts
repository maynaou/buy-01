import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CheckoutRequest, Order, OrderStatus } from '../../features/checkout/models/order';
import { CustomerProfileAnalytics } from '../../features/profile/models/customer-profile-analytics';

export interface OrderSearchFilters {
  search?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}

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
   * POST /api/orders/seller
   * Returns all orders containing the authenticated seller's products.
   */
  getSellerOrders(filters: OrderSearchFilters = {}): Observable<Order[]> {
    return this.http.post<Order[]>(this.orderUrl + '/seller', filters);
  }

  getSellerTopProducts(): Observable<TopSellingProduct[]> {
    return this.http.get<TopSellingProduct[]>(`${this.orderUrl}/seller/top-products`);
  }

  /**
   * PATCH /api/orders/{id}/status
   * Updates the order status (e.g. CONFIRMED, SHIPPED, DELIVERED, CANCELLED).
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.orderUrl}/${orderId}/status`, { status });
  }

  /**
   * POST /api/orders/my-orders
   * Returns all active orders placed by the current client.
   */
  getMyOrders(filters: OrderSearchFilters = {}): Observable<Order[]> {
    return this.http.post<Order[]>(`${this.orderUrl}/my-orders`, filters);
  }

  getMyAnalytics(): Observable<CustomerProfileAnalytics> {
    return this.http.get<CustomerProfileAnalytics>(`${this.orderUrl}/my-analytics`);
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
