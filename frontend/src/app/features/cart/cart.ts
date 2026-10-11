import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';


import { CartService } from '../../core/services/cart';
import { ProductService } from '../../core/services/product';
import { Product } from '../products/models/product';

interface CartItemView {
  productId: string;
  quantity: number;
  product: Product;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartPage {
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);

  readonly items = signal<CartItemView[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly total = () =>
    this.items().reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
  this.loading.set(true);
  this.errorMessage.set('');

  this.cartService.getCart().subscribe({
    next: (cart) => {
      const cartItems = cart.items ?? [];
      const productIds = [
        ...new Set(cartItems.map((item) => item.productId)),
      ];

     console.log('Cart items:', cartItems);
     console.log('Product IDs:', productIds);

      if (productIds.length === 0) {
        this.items.set([]);
        this.loading.set(false);
        return;
      }

      this.productService.getProductsByIds(productIds).subscribe({
        next: (products) => {
          const items: CartItemView[] = cartItems
            .map((item) => {
              const product = products.find(
                (p) => p.id === item.productId
              );

              return product
                ? {
                    productId: item.productId,
                    quantity: item.quantity,
                    product,
                  }
                : null;
            })
            .filter((item): item is CartItemView => item !== null);

          this.items.set(items);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set('Unable to load cart products.');
          console.error('Unable to load cart products', error);
        },
      });
    },
    error: (error) => {
      this.loading.set(false);

      if (error.status === 404) {
        this.items.set([]);
        return;
      }

      this.errorMessage.set('Unable to load your cart.');
      console.error('Unable to load cart', error);
    },
  });
}
  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId).subscribe({
      next: () => {
        this.items.update((items) =>
          items.filter((item) => item.productId !== productId)
        );
      },
      error: (error) => {
        console.error('Unable to remove item from cart', error);
        this.errorMessage.set('Unable to remove this product.');
      },
    });
  }

  changeQuantity(productId: string, quantity: number): void {
    const item = this.items().find(
      (current) => current.productId === productId
    );

    if (!item || quantity < 1 || quantity > item.product.quantity) {
      return;
    }

    this.cartService.updateQuantity({ productId, quantity }).subscribe({
      next: () => {
        this.items.update((items) =>
          items.map((current) =>
            current.productId === productId
              ? { ...current, quantity }
              : current
          )
        );
      },
      error: (error) => {
        console.error('Unable to update quantity', error);
        this.errorMessage.set('Unable to update product quantity.');
      },
    });
  }
}
