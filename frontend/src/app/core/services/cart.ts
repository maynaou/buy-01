import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CartResponse, CartRequest } from '../../features/cart/models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);

  private readonly cartUrl = `${environment.apiUrl}/api/orders/cart`;

  readonly cartCount = signal<number>(0);
  readonly cart = signal<CartResponse | null>(null);

  getItemQuantity(productId: string): number {
    const item = this.cart()?.items?.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.cartUrl).pipe(
      tap((cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      })
    );
  }

  addToCart(request: CartRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.cartUrl, request).pipe(
      tap((cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      })
    );
  }

  updateQuantity(request: CartRequest): Observable<CartResponse> {
    return this.http.put<CartResponse>(this.cartUrl, request).pipe(
      tap((cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      })
    );
  }

  removeFromCart(productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.cartUrl}/${productId}`).pipe(
      tap((cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      })
    );
  }

  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.cartUrl}/clear`).pipe(
      tap((cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      })
    );
  }

  refreshCartCount(): void {
    this.getCart().subscribe({
      next: (cart) => {
        this.cartCount.set(cart?.totalItems ?? 0);
        this.cart.set(cart);
      },
      error: () => {
        this.cartCount.set(0);
        this.cart.set(null);
      },
    });
  }
}