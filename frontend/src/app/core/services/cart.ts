import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Cart, CartRequest } from '../../features/cart/models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);

  private readonly cartUrl = `${environment.apiUrl}/api/orders/cart`;

  getCart() {
    return this.http.get<Cart>(this.cartUrl);
  }

  addToCart(request: CartRequest) {
    return this.http.post<string>(this.cartUrl, request ,    { responseType: 'text' } );
  }

  updateQuantity(request: CartRequest) {
    return this.http.put<Cart>(
      this.cartUrl, request
    );
  }

  removeFromCart(productId: string) {
    return this.http.delete<void>(
      `${this.cartUrl}/${productId}`);
  }
}